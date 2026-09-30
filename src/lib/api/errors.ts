import type { AbuseViolation } from "@/lib/survey/abuse";
import type { AnswerErrors } from "@/lib/survey/answerValidation";

export type ApiErrorCode =
  | "validation"
  | "email_taken"
  | "invalid_credentials"
  | "unauthenticated"
  | "not_found"
  | "generation_failed"
  | "abuse_blocked"
  | "invalid_answers"
  | "already_submitted";

export interface ApiErrorDetails {
  violations?: AbuseViolation[];
  answerErrors?: AnswerErrors;
  field?: "email" | "password" | "idea";
}

/** Error thrown by every ApiClient implementation. `message` is user-facing Vietnamese. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details: ApiErrorDetails;

  constructor(code: ApiErrorCode, message: string, details: ApiErrorDetails = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
