import { Tag } from "@/components/ui/Sticker";
import { vi } from "@/i18n/vi";
import { NPS_SCALE, RATING_SCALE, type Question } from "@/lib/schema/survey";

function scaleHint(question: Question): string | null {
  if (question.type === "rating") {
    return vi.review.scaleRange(RATING_SCALE.min, RATING_SCALE.max);
  }
  if (question.type === "nps") return vi.review.scaleRange(NPS_SCALE.min, NPS_SCALE.max);
  return null;
}

const BUBBLE: readonly string[] = ["bg-brand-soft", "bg-sun", "bg-pink-soft", "bg-mint-soft"];

export function QuestionPreview({ question, index }: { question: Question; index: number }) {
  const hint = scaleHint(question);
  const options = [
    ...question.options.map((option) => ({ id: option.id, label: option.label })),
    ...(question.allowOther ? [{ id: "__other", label: vi.respondent.otherLabel }] : []),
  ];
  return (
    <li className="animate-rise py-3" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="flex gap-3 rounded-bubble border-2 border-line bg-card p-4 shadow-card sm:gap-4 sm:p-5">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-lg font-extrabold ${BUBBLE[index % BUBBLE.length]}`}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-display text-lg leading-snug font-bold">
            {question.text}
            {question.required ? (
              <span className="ml-1 text-danger" aria-label={vi.review.requiredLabel}>
                *
              </span>
            ) : null}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Tag tone="lilac">{vi.review.types[question.type]}</Tag>
            {question.standardScale ? <Tag tone="sun">{question.standardScale}</Tag> : null}
            {question.segment ? <Tag tone="pink">{vi.review.segmentTag(question.segment)}</Tag> : null}
            {question.analyze ? <Tag tone="mint">{vi.review.analyzeTag}</Tag> : null}
            {question.maxSelections ? (
              <Tag tone="sun">{vi.review.maxSelections(question.maxSelections)}</Tag>
            ) : null}
          </div>
          {options.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {options.map((option) => (
                <li
                  key={option.id}
                  className="rounded-full border-2 border-edge px-3 py-1 text-sm font-semibold"
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : null}
          {hint ? (
            <p>
              <Tag tone="white">{hint}</Tag>
            </p>
          ) : null}
          <p className="rounded-2xl bg-sun-soft px-3 py-2 text-sm font-semibold text-ink">
            {vi.review.objective(question.objective)}
          </p>
        </div>
      </div>
    </li>
  );
}
