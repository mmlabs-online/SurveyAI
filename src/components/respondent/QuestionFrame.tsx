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

const BUBBLE: readonly string[] = ["bg-brand-soft", "bg-sun", "bg-pink-soft", "bg-mint-soft"];

/** Shared fieldset chrome: numbered bubble legend, required marker, error highlight. */
export function QuestionFrame({ question, index, error, children, hint }: QuestionFrameProps) {
  const errorId = `err-${question.id}`;
  return (
    <fieldset
      id={`q-${question.id}`}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      className={cn(
        "min-w-0 animate-rise space-y-3 rounded-bubble border-2 bg-card p-4 shadow-card sm:p-6",
        error ? "animate-shake border-danger shadow-[0_5px_0_0_var(--color-danger-soft)]" : "border-line",
      )}
      style={error ? undefined : { animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <legend className="float-left flex w-full items-start gap-3 text-lg leading-snug font-bold">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-base font-extrabold",
            BUBBLE[index % BUBBLE.length],
          )}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <span className="pt-0.5 font-display text-xl leading-tight">
          {question.text}
          {question.required ? (
            <span className="ml-1 text-danger" aria-label={vi.respondent.requiredLabel}>
              *
            </span>
          ) : (
            <span className="ml-2 font-sans text-sm font-semibold text-muted">
              {vi.respondent.optional}
            </span>
          )}
        </span>
      </legend>
      <div className="clear-both space-y-3 pt-1">
        {hint ? <p className="text-sm font-semibold text-muted">{hint}</p> : null}
        {children}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-2 rounded-2xl bg-danger-soft px-3 py-2 text-sm font-bold text-danger"
          >
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger font-display text-xs text-white"
            >
              !
            </span>
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
