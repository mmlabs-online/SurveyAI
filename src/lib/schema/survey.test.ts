import { describe, expect, it } from "vitest";
import { createIdGenerator } from "./ids";
import { aiCallLogSchema } from "./aiLog";
import {
  publishedVersionSchema,
  questionSchema,
  responseSchema,
  surveySchema,
  type Question,
  type Survey,
} from "./survey";

const NOW = "2026-01-01T00:00:00.000Z";

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    type: "single_choice",
    text: "Bạn thích màu nào?",
    required: true,
    options: [
      { id: "o1", label: "Đỏ" },
      { id: "o2", label: "Xanh" },
    ],
    objective: "Hiểu sở thích màu sắc",
    analyze: false,
    ...overrides,
  };
}

function survey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: "s1",
    ownerId: "u1",
    title: "Khảo sát",
    intro: "",
    thankYou: "Cảm ơn",
    questions: [question()],
    source: { idea: "ý tưởng", clarifyAnswers: {} },
    goal: "other",
    status: "draft",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("questionSchema", () => {
  it("accepts a valid choice question", () => {
    expect(questionSchema.safeParse(question()).success).toBe(true);
  });

  it("requires objective (AR-02)", () => {
    expect(questionSchema.safeParse({ ...question(), objective: undefined }).success).toBe(false);
    expect(questionSchema.safeParse(question({ objective: "  " })).success).toBe(false);
  });

  it("requires at least 2 options and unique option ids for choice questions", () => {
    expect(
      questionSchema.safeParse(question({ options: [{ id: "o1", label: "Chỉ một" }] })).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse(
        question({
          options: [
            { id: "o1", label: "A" },
            { id: "o1", label: "B" },
          ],
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects options on non-choice questions", () => {
    const result = questionSchema.safeParse(
      question({ type: "rating", options: [{ id: "o1", label: "A" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("validates maxSelections only for multiple_choice within option count", () => {
    expect(
      questionSchema.safeParse(question({ type: "multiple_choice", maxSelections: 2 })).success,
    ).toBe(true);
    expect(
      questionSchema.safeParse(question({ type: "multiple_choice", maxSelections: 3 })).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse(question({ type: "single_choice", maxSelections: 1 })).success,
    ).toBe(false);
  });

  it("ties NPS/CSAT scales to matching types (AR-03)", () => {
    const nps = question({ type: "nps", options: [], standardScale: "NPS" });
    expect(questionSchema.safeParse(nps).success).toBe(true);
    expect(questionSchema.safeParse({ ...nps, standardScale: undefined }).success).toBe(false);
    const csat = question({ type: "rating", options: [], standardScale: "CSAT" });
    expect(questionSchema.safeParse(csat).success).toBe(true);
    expect(questionSchema.safeParse({ ...csat, type: "open_text", analyze: true }).success).toBe(
      false,
    );
    expect(questionSchema.safeParse({ ...csat, standardScale: "NPS" }).success).toBe(false);
  });

  it("forces analyze=true on open_text (AR-04)", () => {
    const open = question({ type: "open_text", options: [], analyze: false });
    expect(questionSchema.safeParse(open).success).toBe(false);
    expect(questionSchema.safeParse({ ...open, analyze: true }).success).toBe(true);
  });

  it("accepts a segment dimension (AR-06)", () => {
    const parsed = questionSchema.parse(question({ segment: "visit_frequency" }));
    expect(parsed.segment).toBe("visit_frequency");
  });
});

describe("surveySchema", () => {
  it("accepts a complete survey with source (AR-01)", () => {
    const parsed = surveySchema.parse(
      survey({ source: { idea: "x", clarifyAnswers: { a: "b" }, industry: "spa", surveyType: "satisfaction" } }),
    );
    expect(parsed.source.industry).toBe("spa");
  });

  it("rejects duplicate question ids (AR-07)", () => {
    expect(surveySchema.safeParse(survey({ questions: [question(), question()] })).success).toBe(
      false,
    );
  });

  it("rejects empty question lists, bad status and bad timestamps", () => {
    expect(surveySchema.safeParse(survey({ questions: [] })).success).toBe(false);
    expect(surveySchema.safeParse({ ...survey(), status: "archived" }).success).toBe(false);
    expect(surveySchema.safeParse(survey({ createdAt: "yesterday" })).success).toBe(false);
  });
});

describe("publishedVersionSchema / responseSchema / aiCallLogSchema", () => {
  it("validates a published version with slug format", () => {
    const base = { surveyId: "s1", version: 1, slug: "abc234x", snapshot: survey(), publishedAt: NOW };
    expect(publishedVersionSchema.safeParse(base).success).toBe(true);
    expect(publishedVersionSchema.safeParse({ ...base, slug: "AB" }).success).toBe(false);
    expect(publishedVersionSchema.safeParse({ ...base, version: 0 }).success).toBe(false);
  });

  it("validates responses keyed by question id with raw answers (AR-08)", () => {
    const response = {
      id: "r1",
      surveyId: "s1",
      version: 1,
      answers: { q1: { optionIds: ["o1"] }, q2: { value: 5 }, q3: { text: "ok" } },
      submittedAt: NOW,
    };
    expect(responseSchema.safeParse(response).success).toBe(true);
    expect(responseSchema.safeParse({ ...response, answers: { q1: "x" } }).success).toBe(false);
  });

  it("validates AI call log entries", () => {
    const entry = {
      id: "a1",
      userId: "u1",
      taskType: "generate_survey",
      model: "mock-llm",
      tokensIn: 10,
      tokensOut: 20,
      durationMs: 5,
      estimatedCost: 0.001,
      status: "ok",
      createdAt: NOW,
    };
    expect(aiCallLogSchema.safeParse(entry).success).toBe(true);
    expect(aiCallLogSchema.safeParse({ ...entry, status: "weird" }).success).toBe(false);
  });
});

describe("createIdGenerator", () => {
  it("never reuses ids, even when resumed from the persisted counter", () => {
    const first = createIdGenerator(0, () => 0.5);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) seen.add(first.next("q"));
    expect(seen.size).toBe(500);
    const resumed = createIdGenerator(first.current(), () => 0.5);
    expect(seen.has(resumed.next("q"))).toBe(false);
    expect(first.current()).toBe(500);
  });

  it("prefixes ids", () => {
    expect(createIdGenerator().next("srv")).toMatch(/^srv_/);
  });
});
