"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { Mascot } from "@/components/ui/Mascot";
import { Tag } from "@/components/ui/Sticker";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import type { ApiClient } from "@/lib/api";
import { formatDateTime, formatPercent } from "@/lib/format";
import type { ResponseRow } from "@/lib/survey/responseView";

const POLL_MS = 4000;

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-bubble border-2 border-ink px-5 py-4 shadow-pop ${tone}`}>
      <dt className="text-base font-bold">{label}</dt>
      <dd className="font-display text-5xl leading-none font-extrabold">{value}</dd>
    </div>
  );
}

function ResponseItem({ row, index }: { row: ResponseRow; index: number }) {
  return (
    <li className="animate-rise rounded-bubble border-2 border-line bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-12 -rotate-3 items-center justify-center rounded-2xl border-2 border-ink bg-sun font-display text-xl font-extrabold shadow-pop-sm">
          <span className="sr-only">{vi.responses.responseHeading(index)}</span>
          <span aria-hidden="true">{index}</span>
        </span>
        <Tag tone="lilac">{formatDateTime(row.submittedAt)}</Tag>
        <Tag tone="pink">{vi.responses.version(row.version)}</Tag>
      </div>
      {row.answers.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{vi.responses.snapshotMissing}</p>
      ) : null}
      <dl className="mt-4 space-y-3">
        {row.answers.map((answer) => (
          <div key={answer.questionId} className="space-y-1.5">
            <dt className="text-sm font-bold text-muted">{answer.questionText}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {answer.labels.length > 0 ? (
                answer.labels.map((label, i) => (
                  <span
                    key={`${label}-${i}`}
                    className="rounded-full bg-mint-soft px-3 py-1 text-base font-bold text-mint-ink"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="rounded-full border-2 border-dashed border-edge px-3 py-1 text-base font-semibold text-muted">
                  {vi.responses.noAnswer}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

export function ResponsesOverview() {
  const { id } = useParams<{ id: string }>();
  const fetcher = useCallback((api: ApiClient) => api.getResponseOverview(id), [id]);
  const { state, refreshError, reload } = useApiQuery(fetcher, { live: true, pollMs: POLL_MS });

  return (
    <section aria-labelledby="responses-title" className="space-y-6">
      <div>
        <Link
          href={`/surveys/${id}`}
          className="inline-flex min-h-11 items-center rounded-full px-3 font-display text-base font-bold text-brand-ink underline decoration-2 underline-offset-4 hover:bg-brand-soft"
        >
          {vi.responses.backToSurvey}
        </Link>
        <h1 id="responses-title" className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
          {vi.responses.title}
        </h1>
      </div>

      {refreshError && state.status === "success" ? (
        <Alert tone="info">{vi.dashboard.refreshFailed}</Alert>
      ) : null}
      {state.status === "loading" ? <LoadingState /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={reload} /> : null}
      {state.status === "success" ? (
        <>
          <dl aria-live="polite" className="grid gap-4 sm:grid-cols-3">
            <Stat label={vi.responses.total} value={String(state.data.total)} tone="bg-brand-soft text-brand-ink" />
            <Stat label={vi.responses.started} value={String(state.data.started)} tone="bg-sun text-ink" />
            <Stat label={vi.responses.completion} value={formatPercent(state.data.completionRate)} tone="bg-mint-soft text-mint-ink" />
          </dl>
          {state.data.responses.length === 0 ? (
            <div className="flex flex-col items-center rounded-bubble border-2 border-dashed border-ink/50 bg-card px-6 py-10 text-center">
              <Mascot mood="sleepy" size={120} />
              <p className="mt-3 font-display text-xl font-bold">{vi.responses.empty.title}</p>
              <p className="mt-1 max-w-md text-muted">{vi.responses.empty.body}</p>
            </div>
          ) : (
            <ol className="space-y-4">
              {state.data.responses.map((row, index) => (
                <ResponseItem
                  key={row.id}
                  row={row}
                  index={state.data.responses.length - index}
                />
              ))}
            </ol>
          )}
        </>
      ) : null}
    </section>
  );
}
