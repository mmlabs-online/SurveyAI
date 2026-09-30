"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { Mascot } from "@/components/ui/Mascot";
import { LoadingState } from "@/components/ui/QueryState";
import { Sparkle } from "@/components/ui/Sparkle";
import { useApiQuery } from "@/hooks/useApiQuery";
import { vi } from "@/i18n/vi";
import { getApiClient, isApiError, type ApiClient, type PublicSurvey } from "@/lib/api";
import type { AnswerValue, Answers, PublicQuestion } from "@/lib/schema/survey";
import {
  cleanAnswers,
  isAnswerEmpty,
  validateAnswers,
  type AnswerErrorCode,
  type AnswerErrors,
} from "@/lib/survey/answerValidation";
import { QuestionField } from "./QuestionField";

function errorMessage(code: AnswerErrorCode, question: PublicQuestion): string {
  if (code === "max_selections") return vi.respondent.errors.maxSelections(question.maxSelections ?? 0);
  return vi.respondent.errors[code];
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <div className="relative">
        <Sparkle className="absolute -left-6 top-2 text-pink" size={24} />
        <Sparkle className="absolute -right-4 bottom-6 text-sun [animation-delay:1s]" size={20} />
        <Mascot mood="sad" size={168} />
      </div>
      <div className="mt-6 rounded-bubble border-2 border-ink bg-card p-6 shadow-pop animate-rise">
        <h1 className="font-display text-3xl leading-tight font-extrabold">{vi.respondent.notFound.title}</h1>
        <p className="mt-3 text-lg text-muted">{vi.respondent.notFound.body}</p>
      </div>
    </main>
  );
}

function ThankYou({ survey }: { survey: PublicSurvey }) {
  return (
    <main
      className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 py-12 text-center"
      role="status"
    >
      <Confetti />
      <div className="relative z-10 flex flex-col items-center">
        <Mascot mood="cheer" size={190} className="animate-pop-in" />
        <h1 className="mt-4 -rotate-2 rounded-full border-2 border-ink bg-sun px-8 py-2 font-display text-4xl leading-tight font-extrabold shadow-pop animate-pop-in sm:text-5xl">
          {vi.respondent.thanksTitle}
        </h1>
        <p className="mt-6 max-w-md rounded-bubble border-2 border-line bg-card p-5 text-lg text-muted shadow-card">
          {survey.thankYou}
        </p>
      </div>
    </main>
  );
}

function SurveyFillForm({ survey }: { survey: PublicSurvey }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<AnswerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const sessionRef = useRef<Promise<string | undefined> | null>(null);

  const questions = survey.questions;
  const errors = useMemo<AnswerErrors>(
    () => (attempted ? validateAnswers(questions, answers) : serverErrors),
    [attempted, questions, answers, serverErrors],
  );
  const answeredCount = questions.filter((q) => !isAnswerEmpty(q, answers[q.id])).length;
  const percent = Math.round((answeredCount / questions.length) * 100);

  function setAnswer(questionId: string, value: AnswerValue): void {
    // COL-06: "started" is tracked when the respondent answers the first question.
    if (!sessionRef.current) {
      sessionRef.current = getApiClient()
        .startResponse(survey.slug)
        .then((result) => result.sessionId)
        .catch(() => undefined);
    }
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // A server-side complaint about this question is stale once the answer changes.
    setServerErrors((prev) => {
      if (!(questionId in prev)) return prev;
      return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== questionId));
    });
  }

  function focusFirstInvalid(found: AnswerErrors): void {
    const first = questions.find((q) => found[q.id]);
    const target = first ? document.getElementById(`q-${first.id}`) : null;
    target?.querySelector<HTMLElement>("input:not([disabled]), textarea")?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFailure(null);
    const found = validateAnswers(questions, answers);
    setAttempted(true);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found);
      return;
    }
    setSubmitting(true);
    try {
      const api = getApiClient();
      const sessionId = (await sessionRef.current) ?? (await api.startResponse(survey.slug)).sessionId;
      await api.submitResponse(survey.slug, sessionId, cleanAnswers(questions, answers));
      setSubmitted(true);
    } catch (error) {
      if (isApiError(error) && error.details.answerErrors) {
        setAttempted(false);
        setServerErrors(error.details.answerErrors);
      }
      setFailure(isApiError(error) ? error.message : vi.errors.unknown);
      setSubmitting(false);
    }
  }

  if (submitted) return <ThankYou survey={survey} />;

  const markerMood = percent >= 100 ? "cheer" : percent > 0 ? "happy" : "wink";
  return (
    <main className="mx-auto max-w-xl pb-16">
      <div className="sticky top-0 z-10 px-3 pt-3">
        <div className="rounded-[1.75rem] border-2 border-ink bg-card/85 px-4 pb-3 pt-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between font-display text-base font-bold">
            <span>{vi.respondent.progress(answeredCount, questions.length)}</span>
            <span className="rounded-full bg-sun px-2.5 py-0.5 text-sm">{percent}%</span>
          </div>
          <div className="relative mt-4 px-3">
            <div
              role="progressbar"
              aria-label={vi.respondent.progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-4 overflow-hidden rounded-full border-2 border-ink bg-brand-soft"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-700 ease-boing"
                style={{
                  width: `${percent}%`,
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.22) 0 8px, transparent 8px 16px)",
                }}
              />
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-3.5 -ml-3.5 transition-[left] duration-700 ease-boing"
              style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${percent} / 100)` }}
            >
              <Mascot mood={markerMood} size={30} float={false} />
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-4 pt-16">
        <header className="relative space-y-2 rounded-[2.25rem] border-2 border-ink bg-brand-soft p-5 shadow-pop sm:p-7">
          <Mascot mood="happy" size={80} className="absolute -top-[4.4rem] right-6 sm:size-24 sm:-top-[5.4rem]" />
          <h1 className="font-display text-2xl leading-tight font-extrabold text-brand-ink sm:text-3xl">{survey.title}</h1>
          {survey.intro ? <p className="text-lg text-ink">{survey.intro}</p> : null}
          <p className="text-sm font-semibold text-muted">{vi.respondent.requiredNote}</p>
        </header>

        {questions.map((question, index) => {
          const code = errors[question.id];
          return (
            <QuestionField
              key={question.id}
              question={question}
              index={index}
              answer={answers[question.id]}
              error={code ? errorMessage(code, question) : null}
              onChange={(value) => setAnswer(question.id, value)}
            />
          );
        })}

        {attempted && Object.keys(errors).length > 0 ? (
          <Alert tone="error">{vi.respondent.fixErrors(Object.keys(errors).length)}</Alert>
        ) : null}
        {failure ? <Alert tone="error">{failure}</Alert> : null}
        <Button type="submit" loading={submitting} className="w-full min-h-14 text-xl">
          {submitting ? vi.common.processing : vi.respondent.submit}
        </Button>
      </form>
    </main>
  );
}

export function RespondentForm() {
  const { slug } = useParams<{ slug: string }>();
  const fetcher = useCallback((api: ApiClient) => api.getPublicSurvey(slug), [slug]);
  const { state } = useApiQuery(fetcher);

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") {
    return state.code === "not_found" ? (
      <NotFound />
    ) : (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-20">
        <Mascot mood="sad" size={120} />
        <Alert tone="error" className="w-full">
          {state.message}
        </Alert>
      </main>
    );
  }
  return <SurveyFillForm survey={state.data} />;
}
