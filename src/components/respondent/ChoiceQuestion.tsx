import { useId } from "react";
import { vi } from "@/i18n/vi";
import { OTHER_OPTION_ID, type AnswerValue, type PublicQuestion } from "@/lib/schema/survey";
import { CONTROL } from "@/components/ui/Field";
import { QuestionFrame } from "./QuestionFrame";

interface ChoiceQuestionProps {
  question: PublicQuestion;
  index: number;
  answer: AnswerValue | undefined;
  error: string | null;
  onChange: (answer: AnswerValue) => void;
}

interface ChoiceEntry {
  id: string;
  label: string;
}

const ROW =
  "group flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-edge bg-card px-4 py-2.5 " +
  "transition-[transform,background-color,border-color,box-shadow] duration-150 ease-boing " +
  "hover:-translate-y-0.5 hover:border-ink hover:bg-sun-soft active:scale-[0.98] " +
  "has-[:checked]:border-ink has-[:checked]:bg-brand-soft has-[:checked]:shadow-pop-brand " +
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand " +
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55 has-[:disabled]:hover:translate-y-0 has-[:disabled]:hover:bg-card";

function Indicator({ multiple }: { multiple: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "flex size-7 shrink-0 items-center justify-center border-2 border-edge bg-card text-transparent transition-colors " +
        "group-has-[:checked]:border-ink group-has-[:checked]:bg-brand group-has-[:checked]:text-white " +
        (multiple ? "rounded-lg" : "rounded-full")
      }
    >
      <svg
        viewBox="0 0 16 16"
        width={16}
        height={16}
        className="scale-50 transition-transform duration-200 ease-boing group-has-[:checked]:scale-100"
      >
        <path
          d="M3 8.5l3.2 3L13 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ChoiceQuestion({ question, index, answer, error, onChange }: ChoiceQuestionProps) {
  const groupName = useId();
  const multiple = question.type === "multiple_choice";
  const picked = answer && "optionIds" in answer ? answer.optionIds : [];
  const otherText = answer && "optionIds" in answer ? (answer.otherText ?? "") : "";
  const atLimit =
    multiple && question.maxSelections !== undefined && picked.length >= question.maxSelections;

  const entries: ChoiceEntry[] = [
    ...question.options,
    ...(question.allowOther ? [{ id: OTHER_OPTION_ID, label: vi.respondent.otherLabel }] : []),
  ];

  function toggle(id: string): void {
    if (!multiple) {
      onChange({ optionIds: [id], ...(id === OTHER_OPTION_ID ? { otherText } : {}) });
      return;
    }
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    onChange({
      optionIds: next,
      ...(next.includes(OTHER_OPTION_ID) ? { otherText } : {}),
    });
  }

  function changeOtherText(text: string): void {
    onChange({ optionIds: picked, otherText: text });
  }

  const hint =
    multiple && question.maxSelections
      ? vi.respondent.chooseUpTo(question.maxSelections)
      : undefined;
  const otherPicked = picked.includes(OTHER_OPTION_ID);

  return (
    <QuestionFrame question={question} index={index} error={error} hint={hint}>
      <div className="space-y-2.5">
        {entries.map((entry) => {
          const checked = picked.includes(entry.id);
          return (
            <label key={entry.id} className={ROW}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={groupName}
                checked={checked}
                disabled={multiple && atLimit && !checked}
                onChange={() => toggle(entry.id)}
                className="peer sr-only"
              />
              <Indicator multiple={multiple} />
              <span className="text-lg leading-snug font-semibold">{entry.label}</span>
            </label>
          );
        })}
      </div>
      {otherPicked ? (
        <input
          type="text"
          value={otherText}
          onChange={(e) => changeOtherText(e.target.value)}
          aria-label={vi.respondent.otherTextLabel(question.text)}
          placeholder={vi.respondent.otherPlaceholder}
          maxLength={200}
          className={`${CONTROL} border-edge`}
        />
      ) : null}
    </QuestionFrame>
  );
}
