"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { ErrorState, LoadingState } from "@/components/ui/QueryState";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import type { ApiClient } from "@/lib/api";
import { formatDateTime, formatPercent } from "@/lib/format";
import type { ResponseRow } from "@/lib/survey/responseView";

const POLL_MS = 4000;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-card px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-serif text-3xl font-bold">{value}</dd>
    </div>
  );
}

function ResponseItem({ row, index }: { row: ResponseRow; index: number }) {
  return (
    <li className="space-y-2 border border-line bg-card p-4">
      <p className="text-sm font-semibold text-muted">
        {vi.responses.responseHeading(index)} · {formatDateTime(row.submittedAt)} ·{" "}
        {vi.responses.version(row.version)}
      </p>
      {row.answers.length === 0 ? (
        <p className="text-sm text-muted">{vi.responses.snapshotMissing}</p>
      ) : null}
      <dl className="space-y-2">
        {row.answers.map((answer) => (
          <div key={answer.questionId}>
            <dt className="text-sm font-semibold">{answer.questionText}</dt>
            <dd className="text-sm">
              {answer.labels.length > 0 ? answer.labels.join(", ") : vi.responses.noAnswer}
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
          className="text-sm font-semibold text-brand-dark underline underline-offset-4"
        >
          {vi.responses.backToSurvey}
        </Link>
        <h1 id="responses-title" className="mt-2 font-serif text-3xl font-bold">
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
          <dl aria-live="polite" className="grid gap-3 sm:grid-cols-3">
            <Stat label={vi.responses.total} value={String(state.data.total)} />
            <Stat label={vi.responses.started} value={String(state.data.started)} />
            <Stat label={vi.responses.completion} value={formatPercent(state.data.completionRate)} />
          </dl>
          {state.data.responses.length === 0 ? (
            <div className="border border-dashed border-ink/40 bg-card px-6 py-10 text-center">
              <p className="font-serif text-lg font-bold">{vi.responses.empty.title}</p>
              <p className="mt-1 text-muted">{vi.responses.empty.body}</p>
            </div>
          ) : (
            <ol className="space-y-3">
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
