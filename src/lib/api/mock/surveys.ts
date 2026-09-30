import { vi } from "@/i18n/vi";
import type { PublishedVersion } from "@/lib/schema/survey";
import { checkSurveyAbuse } from "@/lib/survey/abuse";
import { deepFreeze } from "@/lib/survey/freeze";
import { generateUniqueSlug } from "@/lib/survey/slug";
import { ApiError } from "../errors";
import type { ApiClient, SurveySummary } from "../types";
import { nowIso, requireUser, type MockDeps } from "./context";
import { generateSurveyDraft } from "./generation";
import { latestVersionOf, requireOwnedSurvey, toPublishInfo } from "./queries";

type SurveysApi = Pick<
  ApiClient,
  "listSurveys" | "getSurvey" | "generateSurvey" | "publishSurvey" | "listAiCallLogs"
>;

export function createSurveysApi(deps: MockDeps): SurveysApi {
  return {
    async listSurveys() {
      await deps.delay();
      const state = deps.store.read();
      const user = requireUser(state);
      const summaries = state.surveys
        .filter((s) => s.ownerId === user.id)
        .map<SurveySummary>((s) => {
          const latest = latestVersionOf(state, s.id);
          return {
            id: s.id,
            title: s.title,
            status: s.status,
            questionCount: s.questions.length,
            responseCount: state.responses.filter((r) => r.surveyId === s.id).length,
            ...(latest ? { slug: latest.slug } : {}),
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          };
        });
      return [...summaries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async getSurvey(surveyId) {
      await deps.delay();
      const state = deps.store.read();
      const survey = requireOwnedSurvey(state, surveyId, requireUser(state).id);
      const latest = latestVersionOf(state, survey.id);
      return { survey, published: latest ? toPublishInfo(latest) : null };
    },

    generateSurvey: (input, options) => generateSurveyDraft(deps, input, options),

    async publishSurvey(surveyId) {
      await deps.delay();
      const state = deps.store.read();
      const survey = requireOwnedSurvey(state, surveyId, requireUser(state).id);

      const violations = checkSurveyAbuse(survey);
      const first = violations[0];
      if (first) {
        throw new ApiError("abuse_blocked", vi.errors.abuseBlocked(first.questionText), {
          violations,
        });
      }

      const previous = latestVersionOf(state, survey.id);
      const publishedAt = nowIso(deps);
      const slug =
        previous?.slug ??
        generateUniqueSlug(new Set(state.versions.map((v) => v.slug)), deps.random);
      const published = { ...survey, status: "published" as const, updatedAt: publishedAt };
      const version: PublishedVersion = {
        surveyId: survey.id,
        version: (previous?.version ?? 0) + 1,
        slug,
        snapshot: deepFreeze(structuredClone(published)),
        publishedAt,
      };
      deps.store.update((s) => ({
        ...s,
        surveys: s.surveys.map((item) => (item.id === survey.id ? published : item)),
        versions: [...s.versions, version],
      }));
      return { ...toPublishInfo(version), survey: published };
    },

    async listAiCallLogs() {
      await deps.delay();
      const state = deps.store.read();
      const user = requireUser(state);
      return state.aiLog.filter((entry) => entry.userId === user.id);
    },
  };
}
