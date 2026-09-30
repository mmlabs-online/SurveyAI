import { describe, expect, it } from "vitest";
import { OTHER_OPTION_ID, type Survey, type SurveyResponse } from "@/lib/schema/survey";
import { computeCompletionRate, describeResponse } from "./responseView";

const NOW = "2026-01-01T00:00:00.000Z";
const survey: Survey = {
  id: "s",
  ownerId: "u",
  title: "t",
  intro: "",
  thankYou: "",
  goal: "other",
  status: "published",
  source: { idea: "i", clarifyAnswers: {} },
  createdAt: NOW,
  updatedAt: NOW,
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      text: "Chọn",
      required: false,
      options: [
        { id: "o1", label: "Cà phê" },
        { id: "o2", label: "Trà" },
      ],
      allowOther: true,
      objective: "o",
      analyze: false,
    },
    { id: "q2", type: "open_text", text: "Ý kiến", required: false, options: [], objective: "o", analyze: true },
    { id: "q3", type: "rating", text: "Sao", required: false, options: [], objective: "o", analyze: false },
  ],
};

function response(answers: SurveyResponse["answers"]): SurveyResponse {
  return { id: "r", surveyId: "s", version: 3, answers, submittedAt: NOW };
}

describe("computeCompletionRate", () => {
  it("is completed over started, clamped to 0..1", () => {
    expect(computeCompletionRate(1, 4)).toBe(0.25);
    expect(computeCompletionRate(0, 0)).toBe(0);
    expect(computeCompletionRate(5, 2)).toBe(1);
  });
});

describe("describeResponse", () => {
  it("resolves option ids to labels in question order", () => {
    const row = describeResponse(
      survey,
      response({ q1: { optionIds: ["o2", "o1"] }, q2: { text: "Ngon" }, q3: { value: 5 } }),
    );
    expect(row.version).toBe(3);
    expect(row.answers.map((a) => a.labels)).toEqual([["Trà", "Cà phê"], ["Ngon"], ["5"]]);
  });

  it("shows other text and falls back to the id for unknown options", () => {
    const row = describeResponse(
      survey,
      response({ q1: { optionIds: [OTHER_OPTION_ID, "gone"], otherText: "Sinh tố" } }),
    );
    expect(row.answers[0]?.labels).toEqual(["Khác: Sinh tố", "gone"]);
    expect(row.answers[1]?.labels).toEqual([]);
  });
});
