"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import type { ApiClient } from "@/lib/api";
import { PublishPanel } from "./PublishPanel";
import { QuestionPreview } from "./QuestionPreview";

export function SurveyReview() {
  const { id } = useParams<{ id: string }>();
  const fetcher = useCallback((api: ApiClient) => api.getSurvey(id), [id]);
  const { state, reload } = useApiQuery(fetcher);

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") {
    return (
      <div className="space-y-3">
        <ErrorState message={state.message} onRetry={reload} />
        <Link href="/dashboard" className="text-sm font-semibold underline underline-offset-4">
          {vi.common.backToDashboard}
        </Link>
      </div>
    );
  }

  const { survey, published } = state.data;
  return (
    <article aria-labelledby="survey-title" className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {vi.review.readOnlyNote}
        </p>
        <h1 id="survey-title" className="font-serif text-3xl font-bold">
          {survey.title}
        </h1>
        {survey.intro ? <p className="text-muted">{survey.intro}</p> : null}
        <p className="text-sm">
          <Link
            href={`/surveys/${survey.id}/responses`}
            className="font-semibold text-brand-dark underline underline-offset-4"
          >
            {vi.review.viewResponses}
          </Link>
        </p>
      </div>

      <PublishPanel surveyId={survey.id} published={published} onPublished={reload} />

      <section aria-labelledby="questions-title" className="border-y border-line bg-card px-5">
        <h2 id="questions-title" className="sr-only">
          {vi.review.questionsHeading(survey.questions.length)}
        </h2>
        <ol>
          {survey.questions.map((question, index) => (
            <QuestionPreview key={question.id} question={question} index={index} />
          ))}
        </ol>
      </section>
      <p className="text-sm text-muted">{survey.thankYou}</p>
    </article>
  );
}
