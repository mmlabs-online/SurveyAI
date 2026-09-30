import { vi } from "@/i18n/vi";
import type { AiCallLog, AiCallStatus } from "@/lib/schema/aiLog";
import { surveySchema, type Survey } from "@/lib/schema/survey";
import { checkIdea } from "@/lib/survey/idea";
import { ApiError } from "../errors";
import type { GenerateOptions, GenerateSurveyInput } from "../types";
import { nowIso, requireUser, type MockDeps } from "./context";
import { GeneratorTimeoutError } from "./generator";

/** First try + up to 2 retries (GEN-04). */
export const MAX_GENERATION_ATTEMPTS = 3;
const TASK_TYPE = "generate_survey";
const COST_PER_INPUT_TOKEN = 0.000001;
const COST_PER_OUTPUT_TOKEN = 0.000004;

interface AttemptResult {
  survey: Survey | null;
  status: AiCallStatus;
  tokensOut: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException("Generation aborted", "AbortError");
}

export function assertValidIdea(idea: string): void {
  const check = checkIdea(idea);
  if (check === "too_short") {
    throw new ApiError("validation", vi.errors.ideaTooShort, { field: "idea" });
  }
  if (check === "too_long") {
    throw new ApiError("validation", vi.errors.ideaTooLong, { field: "idea" });
  }
}

async function runAttempt(
  deps: MockDeps,
  input: GenerateSurveyInput,
  surveyId: string,
  ownerId: string,
  attempt: number,
): Promise<AttemptResult> {
  let draft: unknown;
  try {
    draft = await deps.generator(input, {
      surveyId,
      ownerId,
      nowIso: nowIso(deps),
      attempt,
    });
  } catch (error) {
    const status = error instanceof GeneratorTimeoutError ? "timeout" : "error";
    return { survey: null, status, tokensOut: 0 };
  }
  const tokensOut = estimateTokens(JSON.stringify(draft) ?? "");
  const parsed = surveySchema.safeParse(draft);
  if (!parsed.success) return { survey: null, status: "invalid_json", tokensOut };
  // Never trust identity/lifecycle fields coming from the generator.
  const survey: Survey = {
    ...parsed.data,
    id: surveyId,
    ownerId,
    status: "draft",
  };
  return { survey, status: "ok", tokensOut };
}

function recordCall(
  deps: MockDeps,
  entry: Omit<AiCallLog, "id" | "createdAt">,
): void {
  const createdAt = nowIso(deps);
  deps.store.update((state, ids) => ({
    ...state,
    aiLog: [...state.aiLog, { ...entry, id: ids.next("ai"), createdAt }],
  }));
}

/** GEN-04: generate, validate with Zod, retry up to 2 times, then fail. Logs every call. */
export async function generateSurveyDraft(
  deps: MockDeps,
  input: GenerateSurveyInput,
  options: GenerateOptions = {},
): Promise<Survey> {
  await deps.delay();
  const user = requireUser(deps.store.read());
  assertValidIdea(input.idea);

  let surveyId = "";
  deps.store.update((state, ids) => {
    surveyId = ids.next("srv");
    return state;
  });
  const tokensIn = estimateTokens(input.idea) + 200;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const progress = (stage: "analyzing" | "drafting" | "validating"): void =>
      options.onProgress?.({ stage, attempt, maxAttempts: MAX_GENERATION_ATTEMPTS });
    throwIfAborted(options.signal);
    const startedAt = deps.now();
    progress("analyzing");
    await deps.delay();
    throwIfAborted(options.signal);
    progress("drafting");
    const result = await runAttempt(deps, input, surveyId, user.id, attempt);
    progress("validating");
    await deps.delay();
    recordCall(deps, {
      userId: user.id,
      surveyId,
      taskType: TASK_TYPE,
      model: "mock-llm",
      tokensIn,
      tokensOut: result.tokensOut,
      durationMs: Math.max(0, deps.now() - startedAt),
      estimatedCost: tokensIn * COST_PER_INPUT_TOKEN + result.tokensOut * COST_PER_OUTPUT_TOKEN,
      status: result.status,
    });
    throwIfAborted(options.signal);
    if (result.survey) {
      const survey = result.survey;
      deps.store.update((state) => ({ ...state, surveys: [...state.surveys, survey] }));
      return survey;
    }
  }
  throw new ApiError("generation_failed", vi.errors.generationFailed);
}
