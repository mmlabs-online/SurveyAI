import { useId } from "react";
import { vi } from "@/i18n/vi";
import { NPS_SCALE, RATING_SCALE, type AnswerValue, type PublicQuestion } from "@/lib/schema/survey";
import { QuestionFrame } from "./QuestionFrame";

interface ScaleQuestionProps {
  question: PublicQuestion;
  index: number;
  answer: AnswerValue | undefined;
  error: string | null;
  onChange: (answer: AnswerValue) => void;
}

export function ScaleQuestion({ question, index, answer, error, onChange }: ScaleQuestionProps) {
  const groupName = useId();
  const scale = question.type === "nps" ? NPS_SCALE : RATING_SCALE;
  const selected = answer && "value" in answer ? answer.value : undefined;
  const isRating = question.type !== "nps";
  const values = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  return (
    <QuestionFrame
      question={question}
      index={index}
      error={error}
      hint={vi.respondent.scaleHint(scale.min, scale.max)}
    >
      <div className={isRating ? "grid grid-cols-5 gap-2" : "grid grid-cols-6 gap-2"}>
        {values.map((value) => (
          <label key={value} className="relative cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={value}
              checked={selected === value}
              onChange={() => onChange({ value })}
              className="peer sr-only"
            />
            {isRating ? (
              <span
                className={
                  "flex aspect-square min-h-12 w-full items-center justify-center transition-transform duration-150 ease-boing " +
                  "hover:-translate-y-0.5 hover:-rotate-6 peer-active:scale-90 peer-checked:scale-110 " +
                  "peer-checked:[&>svg>path]:fill-brand peer-checked:text-white " +
                  "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand " +
                  "relative font-display text-lg font-extrabold hover:[&>svg>path]:fill-sun"
                }
              >
                <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 size-full">
                  <path
                    d="M24 3.5 L29.9 16.4 L44 18.1 L33.5 27.7 L36.4 41.6 L24 34.6 L11.6 41.6 L14.5 27.7 L4 18.1 L18.1 16.4Z"
                    fill="#ffffff"
                    stroke="#3a2647"
                    strokeWidth={2.6}
                    strokeLinejoin="round"
                    className="transition-[fill] duration-150"
                  />
                </svg>
                <span className="relative mt-0.5">{value}</span>
              </span>
            ) : (
              <span
                className={
                  "flex aspect-square min-h-11 w-full items-center justify-center rounded-full border-2 border-edge bg-card font-display text-lg font-extrabold " +
                  "transition-[transform,background-color,border-color] duration-150 ease-boing " +
                  "hover:-translate-y-0.5 hover:border-ink hover:bg-sun peer-active:scale-90 " +
                  "peer-checked:scale-110 peer-checked:border-ink peer-checked:bg-brand peer-checked:text-white peer-checked:shadow-pop " +
                  "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
                }
              >
                {value}
              </span>
            )}
          </label>
        ))}
      </div>
    </QuestionFrame>
  );
}
