import { describe, expect, it, vi as vitest } from "vitest";
import { IDEA, generated, signedInClient } from "@/test/helpers";
import { vi } from "@/i18n/vi";
import { isApiError } from "../errors";
import type { GenerationProgress } from "../types";
import { MAX_GENERATION_ATTEMPTS } from "./generation";
import { defaultGenerator, GeneratorTimeoutError, type SurveyGenerator } from "./generator";

const faulty: SurveyGenerator = () => ({ title: "thiếu hết các trường khác" });

describe("retry-then-fail (GEN-04)", () => {
  it("retries an invalid draft and succeeds when a later attempt is valid", async () => {
    const attempts: number[] = [];
    const flaky: SurveyGenerator = (input, ctx) => {
      attempts.push(ctx.attempt);
      return ctx.attempt < 3 ? faulty(input, ctx) : defaultGenerator(input, ctx);
    };
    const client = await signedInClient({ generator: flaky });
    const survey = await generated(client);
    expect(attempts).toEqual([1, 2, 3]);
    expect(survey.questions.length).toBeGreaterThanOrEqual(6);
    expect((await client.listAiCallLogs()).map((l) => l.status)).toEqual([
      "invalid_json",
      "invalid_json",
      "ok",
    ]);
  });

  it("fails after 1 try + 2 retries and stores no survey", async () => {
    const generator = vitest.fn(faulty);
    const client = await signedInClient({ generator });
    await expect(generated(client)).rejects.toMatchObject({
      code: "generation_failed",
      message: vi.errors.generationFailed,
    });
    expect(generator).toHaveBeenCalledTimes(MAX_GENERATION_ATTEMPTS);
    expect(MAX_GENERATION_ATTEMPTS).toBe(3);
    expect(await client.listSurveys()).toEqual([]);
  });

  it("can succeed again with a healthy generator after a failure (Thử lại)", async () => {
    let healthy = false;
    const generator: SurveyGenerator = (input, ctx) =>
      healthy ? defaultGenerator(input, ctx) : faulty(input, ctx);
    const client = await signedInClient({ generator });
    await expect(generated(client)).rejects.toSatisfy(isApiError);
    healthy = true;
    await expect(generated(client)).resolves.toMatchObject({ status: "draft" });
  });

  it("treats a thrown timeout and other errors as retryable failures", async () => {
    let call = 0;
    const generator: SurveyGenerator = (input, ctx) => {
      call += 1;
      if (call === 1) throw new GeneratorTimeoutError();
      if (call === 2) throw new Error("boom");
      return defaultGenerator(input, ctx);
    };
    const client = await signedInClient({ generator });
    await generated(client);
    expect((await client.listAiCallLogs()).map((l) => l.status)).toEqual(["timeout", "error", "ok"]);
  });

  it("supports async generators", async () => {
    const generator: SurveyGenerator = async (input, ctx) => defaultGenerator(input, ctx);
    const client = await signedInClient({ generator });
    await expect(generated(client)).resolves.toBeDefined();
  });
});

describe("AI call log (ADM-02/04 data)", () => {
  it("records every call with the required fields", async () => {
    let now = 1_000;
    const client = await signedInClient({
      now: () => {
        now += 5;
        return now;
      },
    });
    const survey = await generated(client);
    const [entry] = await client.listAiCallLogs();
    expect(entry).toMatchObject({
      surveyId: survey.id,
      taskType: "generate_survey",
      model: "mock-llm",
      status: "ok",
    });
    expect(entry?.userId).toBeTruthy();
    expect(entry?.tokensIn).toBeGreaterThan(0);
    expect(entry?.tokensOut).toBeGreaterThan(0);
    expect(entry?.durationMs).toBeGreaterThan(0);
    expect(entry?.estimatedCost).toBeGreaterThan(0);
  });

  it("logs failed attempts with zero-output cost for thrown errors", async () => {
    const client = await signedInClient({
      generator: () => {
        throw new GeneratorTimeoutError();
      },
    });
    await expect(generated(client)).rejects.toBeDefined();
    const logs = await client.listAiCallLogs();
    expect(logs).toHaveLength(3);
    expect(logs.every((l) => l.status === "timeout" && l.tokensOut === 0)).toBe(true);
  });

  it("only returns the current user's log entries", async () => {
    const client = await signedInClient();
    await generated(client);
    await client.logout();
    await client.signup({ email: "second@example.com", password: "password123" });
    expect(await client.listAiCallLogs()).toEqual([]);
  });
});

describe("generation input rules (GEN-01)", () => {
  it("rejects ideas under 10 characters with a helpful message", async () => {
    const client = await signedInClient();
    await expect(client.generateSurvey({ idea: "ngắn" })).rejects.toMatchObject({
      code: "validation",
      message: vi.errors.ideaTooShort,
    });
  });

  it("rejects ideas over 2000 characters", async () => {
    const client = await signedInClient();
    await expect(client.generateSurvey({ idea: "a".repeat(2001) })).rejects.toMatchObject({
      message: vi.errors.ideaTooLong,
    });
  });

  it("requires a session", async () => {
    const client = await signedInClient();
    await client.logout();
    await expect(client.generateSurvey({ idea: IDEA })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("reports progress stages per attempt", async () => {
    const client = await signedInClient();
    const seen: GenerationProgress[] = [];
    await client.generateSurvey({ idea: IDEA }, { onProgress: (p) => seen.push(p) });
    expect(seen.map((p) => p.stage)).toEqual(["analyzing", "drafting", "validating"]);
    expect(seen.every((p) => p.attempt === 1 && p.maxAttempts === 3)).toBe(true);
  });
});
