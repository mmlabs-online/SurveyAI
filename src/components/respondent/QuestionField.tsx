import type { AnswerValue, PublicQuestion } from "@/lib/schema/survey";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { OpenTextQuestion } from "./OpenTextQuestion";
import { ScaleQuestion } from "./ScaleQuestion";

export interface QuestionFieldProps {
  question: PublicQuestion;
  index: number;
  answer: AnswerValue | undefined;
  error: string | null;
  onChange: (answer: AnswerValue) => void;
}

/** Renders the right input for each of the 5 question types. */
export function QuestionField(props: QuestionFieldProps) {
  switch (props.question.type) {
    case "single_choice":
    case "multiple_choice":
      return <ChoiceQuestion {...props} />;
    case "rating":
    case "nps":
      return <ScaleQuestion {...props} />;
    case "open_text":
      return <OpenTextQuestion {...props} />;
  }
}
