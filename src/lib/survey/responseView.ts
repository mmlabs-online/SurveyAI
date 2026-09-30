import { vi } from "@/i18n/vi";
import {
  OTHER_OPTION_ID,
  type AnswerValue,
  type Question,
  type Survey,
  type SurveyResponse,
} from "@/lib/schema/survey";

export interface AnswerDisplay {
  questionId: string;
  questionText: string;
  /** Human-readable values: option labels (never ids), numbers, or free text. */
  labels: string[];
}

export interface ResponseRow {
  id: string;
  version: number;
  submittedAt: string;
  answers: AnswerDisplay[];
}

export interface ResponseOverview {
  total: number;
  started: number;
  /** completed / started, 0..1. 0 when nobody has started. */
  completionRate: number;
  responses: ResponseRow[];
}

export function computeCompletionRate(completed: number, started: number): number {
  if (started <= 0) return 0;
  return Math.min(1, completed / started);
}

function labelsFor(question: Question, answer: AnswerValue | undefined): string[] {
  if (!answer) return [];
  if ("optionIds" in answer) {
    return answer.optionIds.map((id) => {
      if (id === OTHER_OPTION_ID) {
        return `${vi.respondent.otherLabel}: ${(answer.otherText ?? "").trim()}`.trim();
      }
      return question.options.find((o) => o.id === id)?.label ?? id;
    });
  }
  if ("value" in answer) return [String(answer.value)];
  const text = answer.text.trim();
  return text ? [text] : [];
}

/** Renders a response against the snapshot of the version it was submitted for. */
export function describeResponse(snapshot: Survey, response: SurveyResponse): ResponseRow {
  return {
    id: response.id,
    version: response.version,
    submittedAt: response.submittedAt,
    answers: snapshot.questions.map((question) => ({
      questionId: question.id,
      questionText: question.text,
      labels: labelsFor(question, response.answers[question.id]),
    })),
  };
}

/** Row for a response whose version snapshot is unavailable: keeps totals and rows consistent. */
export function describeOrphanResponse(response: SurveyResponse): ResponseRow {
  return {
    id: response.id,
    version: response.version,
    submittedAt: response.submittedAt,
    answers: [],
  };
}
