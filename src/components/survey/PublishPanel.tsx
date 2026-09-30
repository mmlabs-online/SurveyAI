"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { vi } from "@/i18n/vi";
import { getApiClient, isApiError, type PublishInfo } from "@/lib/api";
import type { AbuseViolation } from "@/lib/survey/abuse";

interface PublishPanelProps {
  surveyId: string;
  published: PublishInfo | null;
  onPublished: () => void;
}

export function PublishPanel({ surveyId, published, onPublished }: PublishPanelProps) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<AbuseViolation[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const shareUrl = published ? `${window.location.origin}${published.path}` : "";

  async function publish(): Promise<void> {
    setPublishing(true);
    setError(null);
    setViolations([]);
    try {
      await getApiClient().publishSurvey(surveyId);
      onPublished();
    } catch (err) {
      setError(isApiError(err) ? err.message : vi.errors.unknown);
      setViolations(isApiError(err) ? (err.details.violations ?? []) : []);
    } finally {
      setPublishing(false);
    }
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section aria-labelledby="publish-title" className="space-y-4 border border-line bg-card p-5">
      <h2 id="publish-title" className="font-serif text-xl font-bold">
        {vi.review.publish.title}
      </h2>

      {error ? (
        <Alert tone="error" title={vi.review.publish.blockedTitle}>
          <p>{error}</p>
          {violations.length > 1 ? (
            <ul className="mt-2 list-disc pl-5">
              {violations.map((v, i) => (
                <li key={`${v.questionId ?? v.location}-${i}`}>{v.questionText}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      {published ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">{vi.review.publish.liveVersion(published.version)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={published.path}
              className="break-all font-mono text-sm font-semibold text-brand-dark underline underline-offset-4"
            >
              {shareUrl}
            </Link>
            <Button variant="secondary" onClick={() => void copy()} className="min-h-9 text-sm">
              {copyState === "copied" ? vi.common.copied : vi.common.copy}
            </Button>
          </div>
          {copyState === "failed" ? (
            <p role="alert" className="text-sm text-danger">
              {vi.review.publish.copyFailed}
            </p>
          ) : null}
          <p aria-live="polite" className="sr-only">
            {copyState === "copied" ? vi.common.copied : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">{vi.review.publish.notPublished}</p>
      )}

      <Button onClick={() => void publish()} loading={publishing}>
        {published ? vi.review.publish.republish : vi.review.publish.action}
      </Button>
      {published ? <p className="text-xs text-muted">{vi.review.publish.republishHint}</p> : null}
    </section>
  );
}
