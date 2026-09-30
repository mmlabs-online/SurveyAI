import { useId } from "react";
import { vi } from "@/i18n/vi";
import type { AnswerValue, PublicQuestion } from "@/lib/schema/survey";
import { QuestionFrame } from "./QuestionFrame";

export const OPEN_TEXT_MAX_CHARS = 2000;

interface OpenTextQuestionProps {
  question: PublicQuestion;
  index: number;
  answer: AnswerValue | undefined;
  error: string | null;
  onChange: (answer: AnswerValue) => void;
}

export function OpenTextQuestion({
  question,
  index,
  answer,
  error,
  onChange,
}: OpenTextQuestionProps) {
  const id = useId();
  const text = answer && "text" in answer ? answer.text : "";
  return (
    <QuestionFrame question={question} index={index} error={error}>
      <label htmlFor={id} className="sr-only">
        {vi.respondent.openTextLabel(question.text)}
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        maxLength={OPEN_TEXT_MAX_CHARS}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={vi.respondent.openTextPlaceholder}
        className="w-full border border-line bg-card px-3 py-2 text-base"
      />
    </QuestionFrame>
  );
}
