"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { Sticker } from "@/components/ui/Sticker";
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
    <section
      aria-labelledby="publish-title"
      className="overflow-hidden rounded-bubble border-2 border-ink bg-card shadow-pop"
    >
      <div
        className={`flex items-center gap-3 border-b-2 border-ink px-5 py-4 transition-colors ${
          published ? "bg-mint-soft" : "bg-sun-soft"
        }`}
      >
        <Mascot mood={published ? "cheer" : publishing ? "wow" : "wink"} size={84} className="-mb-2" />
        <div className="min-w-0 space-y-1.5">
          <h2 id="publish-title" className="font-display text-2xl leading-none font-extrabold">
            {vi.review.publish.title}
          </h2>
          {published ? (
            <Sticker tone="mint" tilt="left" className="bg-card">
              {vi.review.publish.liveVersion(published.version)}
            </Sticker>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
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
          <div className="space-y-3">
            <div className="space-y-2 rounded-3xl border-2 border-dashed border-ink/60 bg-cream p-3">
              <Link
                href={published.path}
                className="block break-all rounded-lg px-1 font-mono text-sm font-bold text-brand-ink underline decoration-2 underline-offset-4"
              >
                {shareUrl}
              </Link>
              <Button variant="sun" onClick={() => void copy()} className="min-h-11 w-full px-5 text-base">
                {copyState === "copied" ? vi.common.copied : vi.common.copy}
              </Button>
            </div>
            {copyState === "failed" ? (
              <p role="alert" className="text-sm font-bold text-danger">
                {vi.review.publish.copyFailed}
              </p>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {copyState === "copied" ? vi.common.copied : ""}
            </p>
          </div>
        ) : (
          <p className="text-base text-muted">{vi.review.publish.notPublished}</p>
        )}

        <Button
          onClick={() => void publish()}
          loading={publishing}
          variant={published ? "secondary" : "primary"}
          className="w-full"
        >
          {published ? vi.review.publish.republish : vi.review.publish.action}
        </Button>
        {published ? <p className="text-sm text-muted">{vi.review.publish.republishHint}</p> : null}
      </div>
    </section>
  );
}
