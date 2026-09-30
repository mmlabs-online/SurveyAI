"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/QueryState";
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
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="font-serif text-2xl font-bold">{vi.respondent.notFound.title}</h1>
      <p className="mt-3 text-muted">{vi.respondent.notFound.body}</p>
    </main>
  );
}

function ThankYou({ survey }: { survey: PublicSurvey }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center" role="status">
      <h1 className="font-serif text-3xl font-bold">{vi.respondent.thanksTitle}</h1>
      <p className="mt-4 text-lg text-muted">{survey.thankYou}</p>
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

  return (
    <main className="mx-auto max-w-xl pb-16">
      <div className="sticky top-0 z-10 border-b border-line bg-paper px-4 pb-3 pt-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{vi.respondent.progress(answeredCount, questions.length)}</span>
          <span>{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={vi.respondent.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 h-2 bg-line"
        >
          <div
            className="h-full bg-brand transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-4 pt-6">
        <header className="space-y-2">
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">{survey.title}</h1>
          {survey.intro ? <p className="text-muted">{survey.intro}</p> : null}
          <p className="text-sm text-muted">{vi.respondent.requiredNote}</p>
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
        <Button type="submit" loading={submitting} className="w-full">
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
      <main className="mx-auto max-w-md px-5 py-20">
        <Alert tone="error">{state.message}</Alert>
      </main>
    );
  }
  return <SurveyFillForm survey={state.data} />;
}
