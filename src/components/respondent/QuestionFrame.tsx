import type { ReactNode } from "react";
import { vi } from "@/i18n/vi";
import type { PublicQuestion } from "@/lib/schema/survey";
import { cn } from "@/components/ui/cn";

interface QuestionFrameProps {
  question: PublicQuestion;
  index: number;
  error: string | null;
  children: ReactNode;
  /** Extra guidance under the question text, e.g. "Choose up to 2". */
  hint?: string;
}

/** Shared fieldset chrome: numbered legend, required marker, error highlight. */
export function QuestionFrame({ question, index, error, children, hint }: QuestionFrameProps) {
  const errorId = `err-${question.id}`;
  return (
    <fieldset
      id={`q-${question.id}`}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      className={cn(
        "space-y-3 border bg-card p-4 sm:p-5",
        error ? "border-danger ring-2 ring-danger/30" : "border-line",
      )}
    >
      <legend className="float-left w-full text-base font-semibold leading-snug">
        <span className="mr-1.5 font-serif text-accent" aria-hidden="true">
          {index + 1}.
        </span>
        {question.text}
        {question.required ? (
          <span className="ml-1 text-danger" aria-label={vi.respondent.requiredLabel}>
            *
          </span>
        ) : (
          <span className="ml-2 text-sm font-normal text-muted">{vi.respondent.optional}</span>
        )}
      </legend>
      <div className="clear-both space-y-3 pt-1">
        {hint ? <p className="text-sm text-muted">{hint}</p> : null}
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
