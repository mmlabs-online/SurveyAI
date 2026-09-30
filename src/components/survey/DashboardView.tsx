"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import type { ApiClient, SurveySummary } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

function SurveyRow({ survey }: { survey: SurveySummary }) {
  const published = survey.status === "published";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/surveys/${survey.id}`}
          className="block font-serif text-lg font-bold text-ink hover:underline"
        >
          {survey.title}
        </Link>
        <p className="text-sm text-muted">
          {vi.dashboard.questions(survey.questionCount)} · {vi.dashboard.updated(formatDateTime(survey.updatedAt))}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span
          className={
            published
              ? "bg-brand-soft px-2 py-0.5 font-semibold text-brand-dark"
              : "border border-line px-2 py-0.5 font-semibold text-muted"
          }
        >
          {vi.dashboard.status[survey.status]}
        </span>
        <Link
          href={`/surveys/${survey.id}/responses`}
          className="font-semibold text-brand-dark underline underline-offset-4"
        >
          {vi.dashboard.responses(survey.responseCount)}
        </Link>
      </div>
    </li>
  );
}

export function DashboardView() {
  const fetcher = useCallback((api: ApiClient) => api.listSurveys(), []);
  const { state, refreshError, reload } = useApiQuery(fetcher, { live: true });

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="dashboard-title" className="font-serif text-3xl font-bold">
            {vi.dashboard.title}
          </h1>
          <p className="mt-1 text-muted">{vi.dashboard.subtitle}</p>
        </div>
        <Link
          href="/surveys/new"
          className="inline-flex min-h-11 items-center bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
        >
          {vi.dashboard.newSurvey}
        </Link>
      </div>

      {refreshError && state.status === "success" ? (
        <Alert tone="info">{vi.dashboard.refreshFailed}</Alert>
      ) : null}
      {state.status === "loading" ? <LoadingState /> : null}
      {state.status === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : null}
      {state.status === "success" && state.data.length === 0 ? (
        <div className="border border-dashed border-ink/40 bg-card px-6 py-12 text-center">
          <h2 className="font-serif text-xl font-bold">{vi.dashboard.empty.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">{vi.dashboard.empty.body}</p>
          <Link
            href="/surveys/new"
            className="mt-5 inline-flex min-h-11 items-center bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            {vi.dashboard.empty.cta}
          </Link>
        </div>
      ) : null}
      {state.status === "success" && state.data.length > 0 ? (
        <ul className="border-y border-line bg-card px-4">
          {state.data.map((survey) => (
            <SurveyRow key={survey.id} survey={survey} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
