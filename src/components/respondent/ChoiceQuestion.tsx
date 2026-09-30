import { useId } from "react";
import { vi } from "@/i18n/vi";
import { OTHER_OPTION_ID, type AnswerValue, type PublicQuestion } from "@/lib/schema/survey";
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
  "flex min-h-11 cursor-pointer items-center gap-3 border border-transparent px-2 py-1.5 hover:bg-brand-soft has-[:checked]:border-brand has-[:checked]:bg-brand-soft";

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
      <div className="space-y-1">
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
                className="size-5 accent-brand"
              />
              <span className="text-base">{entry.label}</span>
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
          className="w-full border border-line bg-card px-3 py-2 text-base"
        />
      ) : null}
    </QuestionFrame>
  );
}
