import { vi } from "@/i18n/vi";
import type { PublicQuestion, PublishedVersion } from "@/lib/schema/survey";
import { deepFreeze } from "@/lib/survey/freeze";
import {
  findUnknownQuestionIds,
  validateAnswers,
} from "@/lib/survey/answerValidation";
import {
  computeCompletionRate,
  describeOrphanResponse,
  describeResponse,
  type ResponseOverview,
} from "@/lib/survey/responseView";
import { ApiError } from "../errors";
import type { ApiClient, PublicSurvey } from "../types";
import { nowIso, requireUser, type MockDeps } from "./context";
import { latestVersionBySlug, requireOwnedSurvey } from "./queries";
import type { MockState, ResponseSession } from "./state";

export const RESPONDENT_SESSION_PREFIX = "surveyai.respondent.";

type RespondApi = Pick<
  ApiClient,
  "getPublicSurvey" | "startResponse" | "submitResponse" | "getResponseOverview"
>;

function requirePublished(state: MockState, slug: string): PublishedVersion {
  const latest = latestVersionBySlug(state, slug);
  if (!latest) throw new ApiError("not_found", vi.errors.publicNotFound);
  return latest;
}

function snapshotOf(
  state: MockState,
  surveyId: string,
  version: number,
): PublishedVersion | undefined {
  return state.versions.find((v) => v.surveyId === surveyId && v.version === version);
}

export function createRespondApi(deps: MockDeps): RespondApi {
  return {
    async getPublicSurvey(slug) {
      await deps.delay();
      const { snapshot, version } = requirePublished(deps.store.read(), slug);
      const publicSurvey: PublicSurvey = {
        slug,
        version,
        title: snapshot.title,
        intro: snapshot.intro,
        thankYou: snapshot.thankYou,
        questions: snapshot.questions.map<PublicQuestion>((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          options: q.options.map((o) => ({ id: o.id, label: o.label })),
          ...(q.maxSelections !== undefined ? { maxSelections: q.maxSelections } : {}),
          ...(q.allowOther ? { allowOther: true } : {}),
        })),
      };
      return deepFreeze(publicSurvey);
    },

    async startResponse(slug, sessionId) {
      await deps.delay();
      const current = requirePublished(deps.store.read(), slug);
      // Reloading the page must not count as a new "started": reuse the session remembered
      // for this browser tab (per slug + version) while it is still open.
      const key = `${RESPONDENT_SESSION_PREFIX}${slug}.v${current.version}`;
      const candidate = sessionId ?? deps.respondentStorage.getItem(key) ?? "";
      const existing = deps.store
        .read()
        .sessions.find(
          (s) => s.id === candidate && s.surveyId === current.surveyId && !s.completedAt,
        );
      if (existing) {
        deps.respondentStorage.setItem(key, existing.id);
        return { sessionId: existing.id };
      }
      const startedAt = nowIso(deps);
      let createdId = "";
      deps.store.update((state, ids) => {
        createdId = ids.next("ses");
        const session: ResponseSession = {
          id: createdId,
          surveyId: current.surveyId,
          version: current.version,
          startedAt,
        };
        return { ...state, sessions: [...state.sessions, session] };
      });
      deps.respondentStorage.setItem(key, createdId);
      return { sessionId: createdId };
    },

    async submitResponse(slug, sessionId, answers) {
      await deps.delay();
      const state = deps.store.read();
      const latest = requirePublished(state, slug);
      const session = state.sessions.find(
        (s) => s.id === sessionId && s.surveyId === latest.surveyId,
      );
      if (session?.completedAt) {
        throw new ApiError("already_submitted", vi.errors.alreadySubmitted);
      }
      // A respondent answers the version they were shown, even if a newer one exists.
      const target = (session && snapshotOf(state, session.surveyId, session.version)) || latest;
      const questions = target.snapshot.questions;
      const answerErrors = validateAnswers(questions, answers);
      const unknownIds = findUnknownQuestionIds(questions, answers);
      if (Object.keys(answerErrors).length > 0 || unknownIds.length > 0) {
        throw new ApiError("invalid_answers", vi.errors.invalidAnswers, { answerErrors });
      }
      const submittedAt = nowIso(deps);
      let responseId = "";
      deps.store.update((s, ids) => {
        responseId = ids.next("rsp");
        const sessionRecordId = session?.id ?? ids.next("ses");
        const completed: ResponseSession = {
          ...(session ?? {
            id: sessionRecordId,
            surveyId: target.surveyId,
            version: target.version,
            startedAt: submittedAt,
          }),
          completedAt: submittedAt,
        };
        return {
          ...s,
          sessions: session
            ? s.sessions.map((item) => (item.id === session.id ? completed : item))
            : [...s.sessions, completed],
          responses: [
            ...s.responses,
            {
              id: responseId,
              surveyId: target.surveyId,
              version: target.version,
              answers,
              submittedAt,
            },
          ],
        };
      });
      return { responseId };
    },

    async getResponseOverview(surveyId): Promise<ResponseOverview> {
      await deps.delay();
      const state = deps.store.read();
      requireOwnedSurvey(state, surveyId, requireUser(state).id);
      const responses = state.responses
        .filter((r) => r.surveyId === surveyId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      const started = Math.max(
        state.sessions.filter((s) => s.surveyId === surveyId).length,
        responses.length,
      );
      const rows = responses.map((response) => {
        const version = snapshotOf(state, surveyId, response.version);
        return version
          ? describeResponse(version.snapshot, response)
          : describeOrphanResponse(response);
      });
      return {
        total: responses.length,
        started,
        completionRate: computeCompletionRate(responses.length, started),
        responses: rows,
      };
    },
  };
}
