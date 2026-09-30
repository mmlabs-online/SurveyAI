import {
  NPS_SCALE,
  OTHER_OPTION_ID,
  RATING_SCALE,
  type AnswerValue,
  type Answers,
  type PublicQuestion,
} from "@/lib/schema/survey";

export type AnswerErrorCode =
  | "required"
  | "max_selections"
  | "other_required"
  | "invalid";

export type AnswerErrors = Readonly<Record<string, AnswerErrorCode>>;

function isChoiceAnswer(a: AnswerValue): a is Extract<AnswerValue, { optionIds: string[] }> {
  return "optionIds" in a;
}
function isNumberAnswer(a: AnswerValue): a is Extract<AnswerValue, { value: number }> {
  return "value" in a;
}
function isTextAnswer(a: AnswerValue): a is Extract<AnswerValue, { text: string }> {
  return "text" in a;
}

function matchesShape(question: PublicQuestion, answer: AnswerValue): boolean {
  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
      return isChoiceAnswer(answer);
    case "rating":
    case "nps":
      return isNumberAnswer(answer);
    case "open_text":
      return isTextAnswer(answer);
  }
}

/** True when the question has no usable answer yet (used for progress and required checks). */
export function isAnswerEmpty(question: PublicQuestion, answer: AnswerValue | undefined): boolean {
  if (!answer) return true;
  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
      return !isChoiceAnswer(answer) || answer.optionIds.length === 0;
    case "rating":
    case "nps":
      return !isNumberAnswer(answer);
    case "open_text":
      return !isTextAnswer(answer) || answer.text.trim().length === 0;
  }
}

function validateChoice(
  question: PublicQuestion,
  answer: Extract<AnswerValue, { optionIds: string[] }>,
): AnswerErrorCode | null {
  const known = new Set(question.options.map((o) => o.id));
  const picked = answer.optionIds;
  if (new Set(picked).size !== picked.length) return "invalid";
  for (const id of picked) {
    const isOther = id === OTHER_OPTION_ID;
    if (isOther ? !question.allowOther : !known.has(id)) return "invalid";
  }
  if (question.type === "single_choice" && picked.length > 1) return "invalid";
  if (
    question.type === "multiple_choice" &&
    question.maxSelections !== undefined &&
    picked.length > question.maxSelections
  ) {
    return "max_selections";
  }
  if (picked.includes(OTHER_OPTION_ID) && !(answer.otherText ?? "").trim()) {
    return "other_required";
  }
  return null;
}

function validateNumber(question: PublicQuestion, value: number): AnswerErrorCode | null {
  const scale = question.type === "nps" ? NPS_SCALE : RATING_SCALE;
  if (!Number.isInteger(value) || value < scale.min || value > scale.max) return "invalid";
  return null;
}

/** Validates one question's answer. Returns null when it is acceptable. */
export function validateAnswer(
  question: PublicQuestion,
  answer: AnswerValue | undefined,
): AnswerErrorCode | null {
  if (answer && !matchesShape(question, answer)) return "invalid";
  if (isAnswerEmpty(question, answer)) {
    return question.required ? "required" : null;
  }
  if (!answer) return null;
  if (isChoiceAnswer(answer)) return validateChoice(question, answer);
  if (isNumberAnswer(answer)) return validateNumber(question, answer.value);
  return null;
}

/** RSP-03: returns a map of questionId -> error for every invalid/missing answer. */
export function validateAnswers(
  questions: ReadonlyArray<PublicQuestion>,
  answers: Answers,
): AnswerErrors {
  const errors: Record<string, AnswerErrorCode> = {};
  for (const question of questions) {
    const error = validateAnswer(question, answers[question.id]);
    if (error) errors[question.id] = error;
  }
  return errors;
}

/** Answers referencing unknown question ids are rejected by the API. */
export function findUnknownQuestionIds(
  questions: ReadonlyArray<PublicQuestion>,
  answers: Answers,
): string[] {
  const known = new Set(questions.map((q) => q.id));
  return Object.keys(answers).filter((id) => !known.has(id));
}

/**
 * Prepares answers for submission: drops empty answers, trims text, and only keeps
 * `otherText` when the "other" option is actually picked.
 */
export function cleanAnswers(
  questions: ReadonlyArray<PublicQuestion>,
  answers: Answers,
): Answers {
  const cleaned: Record<string, AnswerValue> = {};
  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer || isAnswerEmpty(question, answer)) continue;
    if ("text" in answer) {
      cleaned[question.id] = { text: answer.text.trim() };
    } else if ("optionIds" in answer) {
      const otherText = answer.otherText?.trim();
      cleaned[question.id] =
        answer.optionIds.includes(OTHER_OPTION_ID) && otherText
          ? { optionIds: answer.optionIds, otherText }
          : { optionIds: answer.optionIds };
    } else {
      cleaned[question.id] = answer;
    }
  }
  return cleaned;
}
