import { describe, expect, it } from "vitest";
import { OTHER_OPTION_ID, type PublicQuestion, type Survey, type SurveyResponse } from "@/lib/schema/survey";
import { cleanAnswers } from "./answerValidation";
import { describeResponse } from "./responseView";

const questions: PublicQuestion[] = [
  {
    id: "c",
    type: "multiple_choice",
    text: "c",
    required: false,
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    allowOther: true,
  },
  { id: "t", type: "open_text", text: "t", required: false, options: [] },
  { id: "n", type: "nps", text: "n", required: false, options: [] },
  { id: "e", type: "open_text", text: "e", required: false, options: [] },
];

describe("cleanAnswers", () => {
  it("drops empty answers, trims text and only keeps otherText for a picked other", () => {
    const cleaned = cleanAnswers(questions, {
      c: { optionIds: ["a"], otherText: "  stale  " },
      t: { text: "  xin chào  " },
      n: { value: 0 },
      e: { text: "   " },
    });
    expect(cleaned).toEqual({
      c: { optionIds: ["a"] },
      t: { text: "xin chào" },
      n: { value: 0 },
    });
  });

  it("keeps trimmed other text and drops empty selections", () => {
    expect(
      cleanAnswers(questions, { c: { optionIds: [OTHER_OPTION_ID], otherText: " khác " } }),
    ).toEqual({ c: { optionIds: [OTHER_OPTION_ID], otherText: "khác" } });
    expect(cleanAnswers(questions, { c: { optionIds: [] } })).toEqual({});
  });
});

describe("responseView treats blank text as no answer", () => {
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
      { id: "t", type: "open_text", text: "t", required: false, options: [], objective: "o", analyze: true },
    ],
  };
  const response = (text: string): SurveyResponse => ({
    id: "r",
    surveyId: "s",
    version: 1,
    answers: { t: { text } },
    submittedAt: NOW,
  });

  it("returns no labels for whitespace-only text and trims real text", () => {
    expect(describeResponse(survey, response("  \n ")).answers[0]?.labels).toEqual([]);
    expect(describeResponse(survey, response("  ok ")).answers[0]?.labels).toEqual(["ok"]);
  });
});
