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
  const values = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  return (
    <QuestionFrame
      question={question}
      index={index}
      error={error}
      hint={vi.respondent.scaleHint(scale.min, scale.max)}
    >
      <div className="flex flex-wrap gap-2">
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
            <span className="flex size-11 items-center justify-center border border-ink/40 bg-card text-base font-semibold transition-colors hover:bg-brand-soft peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
              {value}
            </span>
          </label>
        ))}
      </div>
    </QuestionFrame>
  );
}
