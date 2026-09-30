import { vi } from "@/i18n/vi";
import { NPS_SCALE, RATING_SCALE, type Question } from "@/lib/schema/survey";

function Tag({ children }: { children: string }) {
  return (
    <span className="border border-line bg-paper px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

function scaleHint(question: Question): string | null {
  if (question.type === "rating") {
    return vi.review.scaleRange(RATING_SCALE.min, RATING_SCALE.max);
  }
  if (question.type === "nps") return vi.review.scaleRange(NPS_SCALE.min, NPS_SCALE.max);
  return null;
}

export function QuestionPreview({ question, index }: { question: Question; index: number }) {
  const hint = scaleHint(question);
  return (
    <li className="space-y-3 border-b border-line py-5 last:border-b-0">
      <div className="flex gap-3">
        <span className="font-serif text-lg font-bold text-accent" aria-hidden="true">
          {index + 1}.
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-semibold">
            {question.text}
            {question.required ? (
              <span className="ml-1 text-danger" aria-label={vi.review.requiredLabel}>
                *
              </span>
            ) : null}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Tag>{vi.review.types[question.type]}</Tag>
            {question.standardScale ? <Tag>{question.standardScale}</Tag> : null}
            {question.segment ? <Tag>{vi.review.segmentTag(question.segment)}</Tag> : null}
            {question.analyze ? <Tag>{vi.review.analyzeTag}</Tag> : null}
            {question.maxSelections ? (
              <Tag>{vi.review.maxSelections(question.maxSelections)}</Tag>
            ) : null}
          </div>
          {question.options.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {question.options.map((option) => (
                <li key={option.id}>{option.label}</li>
              ))}
              {question.allowOther ? <li>{vi.respondent.otherLabel}</li> : null}
            </ul>
          ) : null}
          {hint ? <p className="text-sm text-muted">{hint}</p> : null}
          <p className="text-sm italic text-muted">{vi.review.objective(question.objective)}</p>
        </div>
      </div>
    </li>
  );
}
