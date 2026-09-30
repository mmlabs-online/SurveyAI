import { vi } from "@/i18n/vi";
import type { PublishedVersion, Survey } from "@/lib/schema/survey";
import { ApiError } from "../errors";
import type { PublishInfo } from "../types";
import type { MockState } from "./state";

export function latestVersionOf(
  state: MockState,
  surveyId: string,
): PublishedVersion | null {
  let latest: PublishedVersion | null = null;
  for (const version of state.versions) {
    if (version.surveyId === surveyId && (!latest || version.version > latest.version)) {
      latest = version;
    }
  }
  return latest;
}

export function latestVersionBySlug(
  state: MockState,
  slug: string,
): PublishedVersion | null {
  const match = state.versions.find((v) => v.slug === slug);
  return match ? latestVersionOf(state, match.surveyId) : null;
}

export function requireOwnedSurvey(
  state: MockState,
  surveyId: string,
  userId: string,
): Survey {
  const survey = state.surveys.find((s) => s.id === surveyId && s.ownerId === userId);
  if (!survey) throw new ApiError("not_found", vi.errors.surveyNotFound);
  return survey;
}

export function toPublishInfo(version: PublishedVersion): PublishInfo {
  return {
    version: version.version,
    slug: version.slug,
    path: `/s/${version.slug}`,
    publishedAt: version.publishedAt,
  };
}
