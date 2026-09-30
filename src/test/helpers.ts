import {
  createMockApiClient,
  type MockApiClient,
  type MockClientOptions,
} from "@/lib/api/mock/client";
import { createMemoryStorage } from "@/lib/api/mock/storage";
import type { AnswerValue, Answers, Question, Survey } from "@/lib/schema/survey";
import type { PublishResult } from "@/lib/api/types";

export const IDEA = "Tôi muốn biết khách hàng có hài lòng với quán cà phê của tôi không";

export function makeClient(options: MockClientOptions = {}): MockApiClient {
  return createMockApiClient({
    storage: createMemoryStorage(),
    respondentStorage: createMemoryStorage(),
    latencyMs: 0,
    ...options,
  });
}

export async function signedInClient(options: MockClientOptions = {}): Promise<MockApiClient> {
  const client = makeClient(options);
  await client.signup({ email: "owner@example.com", password: "password123" });
  return client;
}

export async function generated(
  client: MockApiClient,
  input: Partial<Parameters<MockApiClient["generateSurvey"]>[0]> = {},
): Promise<Survey> {
  return client.generateSurvey({ idea: IDEA, ...input });
}

/** Builds a fully valid answer set for the given questions. */
export function answerAll(questions: ReadonlyArray<Question>): Answers {
  const answers: Record<string, AnswerValue> = {};
  for (const q of questions) {
    if (q.type === "single_choice" || q.type === "multiple_choice") {
      answers[q.id] = { optionIds: [q.options[0]?.id ?? ""] };
    } else if (q.type === "rating") {
      answers[q.id] = { value: 4 };
    } else if (q.type === "nps") {
      answers[q.id] = { value: 9 };
    } else {
      answers[q.id] = { text: "Rất tốt" };
    }
  }
  return answers;
}

export async function published(
  client: MockApiClient,
): Promise<{ survey: Survey; result: PublishResult }> {
  const survey = await generated(client);
  const result = await client.publishSurvey(survey.id);
  return { survey, result };
}

/** Another browser tab/visitor on the same data: separate respondent session memory. */
export function otherRespondent(client: MockApiClient): MockApiClient {
  return createMockApiClient({
    storage: client.storage,
    respondentStorage: createMemoryStorage(),
    latencyMs: 0,
  });
}
