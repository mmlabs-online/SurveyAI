import type { AiCallLog } from "@/lib/schema/aiLog";
import type {
  Answers,
  Industry,
  PublicQuestion,
  Survey,
  SurveyGoal,
} from "@/lib/schema/survey";
import type { ResponseOverview } from "@/lib/survey/responseView";

export interface User {
  id: string;
  email: string;
  createdAt: string;
  /** Mock users are auto-verified (ACC-03 comes later). */
  emailVerified: boolean;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface GenerateSurveyInput {
  idea: string;
  industry?: Industry;
  surveyType?: SurveyGoal;
}

export type GenerationStage = "analyzing" | "drafting" | "validating";

export interface GenerationProgress {
  stage: GenerationStage;
  /** 1-based attempt number (a failed validation triggers a retry). */
  attempt: number;
  maxAttempts: number;
}

export interface GenerateOptions {
  /** Aborting stops between attempts and nothing is saved. */
  signal?: AbortSignal;
  onProgress?: (progress: GenerationProgress) => void;
}

export interface SurveySummary {
  id: string;
  title: string;
  status: Survey["status"];
  questionCount: number;
  responseCount: number;
  slug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishInfo {
  version: number;
  slug: string;
  path: string;
  publishedAt: string;
}

export interface SurveyDetail {
  survey: Survey;
  published: PublishInfo | null;
}

export interface PublishResult extends PublishInfo {
  survey: Survey;
}

/** What a respondent sees: no owner data, no source idea. */
export interface PublicSurvey {
  slug: string;
  version: number;
  title: string;
  intro: string;
  thankYou: string;
  questions: PublicQuestion[];
}

/**
 * The only surface the UI talks to. A real HTTP client can replace the mock without
 * touching any component. All errors are thrown as `ApiError`.
 */
export interface ApiClient {
  signup(credentials: Credentials): Promise<User>;
  login(credentials: Credentials): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  listSurveys(): Promise<SurveySummary[]>;
  getSurvey(surveyId: string): Promise<SurveyDetail>;
  generateSurvey(input: GenerateSurveyInput, options?: GenerateOptions): Promise<Survey>;
  publishSurvey(surveyId: string): Promise<PublishResult>;

  getPublicSurvey(slug: string): Promise<PublicSurvey>;
  /** Records that a respondent started (answered the first question). Idempotent per session. */
  startResponse(slug: string, sessionId?: string): Promise<{ sessionId: string }>;
  submitResponse(
    slug: string,
    sessionId: string,
    answers: Answers,
  ): Promise<{ responseId: string }>;

  getResponseOverview(surveyId: string): Promise<ResponseOverview>;
  listAiCallLogs(): Promise<AiCallLog[]>;

  /** Notifies when stored data may have changed (also across browser tabs). */
  subscribe(listener: () => void): () => void;
}
