"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { Sparkle } from "@/components/ui/Sparkle";
import { Tag, type Tone } from "@/components/ui/Sticker";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import type { ApiClient, SurveySummary } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const ROW_TONES: readonly Tone[] = ["lilac", "sun", "pink", "mint"];
const ROW_BADGE: Record<Tone, string> = {
  lilac: "bg-brand-soft",
  sun: "bg-sun-soft",
  pink: "bg-pink-soft",
  mint: "bg-mint-soft",
  white: "bg-card",
};

function SurveyRow({ survey, index }: { survey: SurveySummary; index: number }) {
  const published = survey.status === "published";
  const tone = ROW_TONES[index % ROW_TONES.length] ?? "lilac";
  return (
    <li
      className="animate-rise"
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      <div className="group relative flex flex-wrap items-center gap-x-4 gap-y-3 rounded-bubble border-2 border-line bg-card p-4 shadow-card transition-transform duration-200 hover:-translate-y-1 hover:border-ink sm:flex-nowrap sm:p-5">
        <span
          aria-hidden="true"
          className={`flex size-16 shrink-0 items-center justify-center rounded-3xl border-2 border-ink ${ROW_BADGE[tone]} transition-transform group-hover:-rotate-6`}
        >
          <Mascot mood={published ? "cheer" : "sleepy"} size={52} float={false} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/surveys/${survey.id}`}
            className="block font-display text-xl leading-tight font-bold text-ink after:absolute after:inset-0 hover:text-brand-ink"
          >
            {survey.title}
          </Link>
          <p className="text-sm text-muted">
            {vi.dashboard.questions(survey.questionCount)} · {vi.dashboard.updated(formatDateTime(survey.updatedAt))}
          </p>
        </div>
        <div className="relative z-10 flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
          <Tag tone={published ? "mint" : "sun"}>{vi.dashboard.status[survey.status]}</Tag>
          <Link
            href={`/surveys/${survey.id}/responses`}
            className="inline-flex min-h-11 items-center rounded-full px-3 font-display text-base font-bold text-brand-ink underline decoration-2 underline-offset-4 hover:bg-brand-soft"
          >
            {vi.dashboard.responses(survey.responseCount)}
          </Link>
        </div>
      </div>
    </li>
  );
}

export function DashboardView() {
  const fetcher = useCallback((api: ApiClient) => api.listSurveys(), []);
  const { state, refreshError, reload } = useApiQuery(fetcher, { live: true });

  return (
    <section aria-labelledby="dashboard-title" className="space-y-8">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-[2.25rem] border-2 border-ink bg-brand-soft p-5 shadow-pop sm:p-8">
        <Sparkle className="absolute right-40 top-5 hidden text-sun sm:block" size={26} />
        <Sparkle className="absolute bottom-5 right-72 hidden text-pink [animation-delay:1s] sm:block" size={18} />
        <div className="min-w-0 flex-1">
          <h1 id="dashboard-title" className="font-display text-3xl leading-tight font-extrabold text-brand-ink sm:text-4xl">
            {vi.dashboard.title}
          </h1>
          <p className="mt-1 text-lg text-ink/80">{vi.dashboard.subtitle}</p>
          {state.status === "success" && state.data.length === 0 ? null : (
            <Link href="/surveys/new" className={buttonClasses("primary", "mt-4")}>
              {vi.dashboard.newSurvey}
            </Link>
          )}
        </div>
        <Mascot mood="happy" size={112} className="hidden min-[440px]:block sm:size-36" />
      </div>

      {refreshError && state.status === "success" ? (
        <Alert tone="info">{vi.dashboard.refreshFailed}</Alert>
      ) : null}
      {state.status === "loading" ? <LoadingState /> : null}
      {state.status === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : null}
      {state.status === "success" && state.data.length === 0 ? (
        <div className="flex flex-col items-center rounded-bubble border-2 border-dashed border-ink/50 bg-card px-6 py-8 text-center">
          <Mascot mood="sleepy" size={116} />
          <h2 className="mt-4 font-display text-2xl font-bold">{vi.dashboard.empty.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">{vi.dashboard.empty.body}</p>
          <Link href="/surveys/new" className={buttonClasses("sun", "mt-6")}>
            {vi.dashboard.empty.cta}
          </Link>
        </div>
      ) : null}
      {state.status === "success" && state.data.length > 0 ? (
        <ul className="relative space-y-4">
          {state.data.map((survey, index) => (
            <SurveyRow key={survey.id} survey={survey} index={index} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
