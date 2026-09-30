import { describe, expect, it } from "vitest";
import { IDEA, generated, signedInClient } from "@/test/helpers";
import {
  INDUSTRIES,
  SURVEY_GOALS,
  surveySchema,
  type Industry,
  type Survey,
  type SurveyGoal,
} from "@/lib/schema/survey";
import { defaultGenerator, resolveGoal } from "./generator";

const context = {
  surveyId: "srv_1",
  ownerId: "usr_1",
  nowIso: "2026-01-01T00:00:00.000Z",
  attempt: 1,
};

function build(goal: SurveyGoal | undefined, industry?: Industry, idea = IDEA): Survey {
  return surveySchema.parse(
    defaultGenerator(
      { idea, ...(goal ? { surveyType: goal } : {}), ...(industry ? { industry } : {}) },
      context,
    ),
  );
}

const combos = SURVEY_GOALS.flatMap((goal) =>
  INDUSTRIES.map((industry) => [goal, industry] as const),
);

describe("mock generator satisfies the analysis-ready rules", () => {
  it.each(combos)("goal=%s industry=%s produces a valid survey with 6-8 questions", (goal, industry) => {
    const survey = build(goal, industry);
    expect(survey.questions.length).toBeGreaterThanOrEqual(6);
    expect(survey.questions.length).toBeLessThanOrEqual(8);
  });

  it.each(combos)("AR-02 objective on every question (%s/%s)", (goal, industry) => {
    for (const q of build(goal, industry).questions) {
      expect(q.objective.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(combos)("AR-03 has an NPS question with the NPS scale (%s/%s)", (goal, industry) => {
    const nps = build(goal, industry).questions.filter((q) => q.type === "nps");
    expect(nps).toHaveLength(1);
    expect(nps[0]?.standardScale).toBe("NPS");
  });

  it.each(INDUSTRIES)("AR-03 satisfaction ratings use CSAT (%s)", (industry) => {
    const ratings = build("satisfaction", industry).questions.filter((q) => q.type === "rating");
    expect(ratings.length).toBeGreaterThan(0);
    expect(ratings.every((q) => q.standardScale === "CSAT")).toBe(true);
  });

  it.each(combos)("AR-04 open_text always has analyze=true (%s/%s)", (goal, industry) => {
    const open = build(goal, industry).questions.filter((q) => q.type === "open_text");
    expect(open.every((q) => q.analyze)).toBe(true);
  });

  it.each(INDUSTRIES)("AR-05 root-cause goal has an analyzed open_text (%s)", (industry) => {
    const open = build("root_cause", industry).questions.filter(
      (q) => q.type === "open_text" && q.analyze,
    );
    expect(open.length).toBeGreaterThanOrEqual(1);
  });

  it.each(combos)("AR-06 has a segment-tagged question (%s/%s)", (goal, industry) => {
    const segments = build(goal, industry).questions.filter((q) => q.segment);
    expect(segments.length).toBeGreaterThanOrEqual(1);
    expect(segments.some((q) => q.segment === "visit_frequency")).toBe(true);
  });

  it.each(combos)("AR-07 question and option ids are stable and unique (%s/%s)", (goal, industry) => {
    const survey = build(goal, industry);
    const ids = survey.questions.flatMap((q) => [q.id, ...q.options.map((o) => o.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(build(goal, industry).questions.map((q) => q.id)).toEqual(
      survey.questions.map((q) => q.id),
    );
  });

  it("AR-01 stores the idea and picks in source", () => {
    const survey = build("satisfaction", "spa", `  ${IDEA}  `);
    expect(survey.source).toEqual({
      idea: IDEA,
      clarifyAnswers: {},
      industry: "spa",
      surveyType: "satisfaction",
    });
    expect(survey.goal).toBe("satisfaction");
    expect(survey.status).toBe("draft");
  });

  it("omits picks that were not made", () => {
    const survey = build(undefined, undefined, "Ý tưởng khảo sát chung chung");
    expect(survey.source).toEqual({ idea: "Ý tưởng khảo sát chung chung", clarifyAnswers: {} });
  });

  it("is deterministic for the same input", () => {
    expect(build("root_cause", "fnb")).toEqual(build("root_cause", "fnb"));
  });
});

describe("goal inference", () => {
  it("prefers the explicit pick", () => {
    expect(resolveGoal({ idea: "tìm nguyên nhân", surveyType: "new_product" })).toBe("new_product");
  });

  it.each([
    ["Tôi muốn tìm nguyên nhân khách bỏ đi", "root_cause"],
    ["Khách có hài lòng với dịch vụ không", "satisfaction"],
    ["Tôi có ý tưởng món mới cho thực đơn", "new_product"],
    ["Chỉ là một câu hỏi thăm dò thông thường", "other"],
  ] as const)("%s -> %s", (idea, goal) => {
    expect(resolveGoal({ idea })).toBe(goal);
  });
});

describe("generation through the client", () => {
  it("saves a validated draft that shows up in the survey list", async () => {
    const client = await signedInClient();
    const survey = await generated(client, { industry: "fnb", surveyType: "root_cause" });
    const list = await client.listSurveys();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: survey.id, status: "draft", responseCount: 0 });
    expect((await client.getSurvey(survey.id)).survey).toEqual(survey);
  });
});
