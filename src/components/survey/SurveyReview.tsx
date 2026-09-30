"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { Sticker } from "@/components/ui/Sticker";
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
        <p className="text-center">
          <Link href="/dashboard" className={buttonClasses("ghost")}>
            {vi.common.backToDashboard}
          </Link>
        </p>
      </div>
    );
  }

  const { survey, published } = state.data;
  return (
    <article aria-labelledby="survey-title" className="space-y-8">
      <div className="space-y-3">
        <Sticker tone="pink" tilt="left">
          {vi.review.readOnlyNote}
        </Sticker>
        <h1 id="survey-title" className="font-display text-3xl leading-tight font-extrabold sm:text-4xl">
          {survey.title}
        </h1>
        {survey.intro ? <p className="max-w-2xl text-lg text-muted">{survey.intro}</p> : null}
        <p>
          <Link
            href={`/surveys/${survey.id}/responses`}
            className={buttonClasses("secondary", "min-h-11 text-base")}
          >
            {vi.review.viewResponses}
          </Link>
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="order-2 space-y-6 lg:order-1">
          <section aria-labelledby="questions-title">
            <h2 id="questions-title" className="sr-only">
              {vi.review.questionsHeading(survey.questions.length)}
            </h2>
            <ol className="-my-3">
              {survey.questions.map((question, index) => (
                <QuestionPreview key={question.id} question={question} index={index} />
              ))}
            </ol>
          </section>
          <div className="flex items-center gap-3 rounded-bubble border-2 border-dashed border-ink/50 bg-card p-4">
            <Mascot mood="cheer" size={64} float={false} />
            <p className="text-muted">{survey.thankYou}</p>
          </div>
        </div>
        <div className="order-1 lg:sticky lg:top-28 lg:order-2">
          <PublishPanel surveyId={survey.id} published={published} onPublished={reload} />
        </div>
      </div>
    </article>
  );
}
