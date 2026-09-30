import { describe, expect, it } from "vitest";
import { OTHER_OPTION_ID, type Question } from "@/lib/schema/survey";
import {
  findUnknownQuestionIds,
  isAnswerEmpty,
  validateAnswer,
  validateAnswers,
} from "./answerValidation";

const opts = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

function base(overrides: Partial<Question>): Question {
  return {
    id: "q",
    type: "single_choice",
    text: "?",
    required: true,
    options: opts,
    objective: "o",
    analyze: false,
    ...overrides,
  };
}

const single = base({ id: "single", allowOther: true });
const multi = base({ id: "multi", type: "multiple_choice", maxSelections: 2, allowOther: true });
const rating = base({ id: "rating", type: "rating", options: [], standardScale: "CSAT" });
const nps = base({ id: "nps", type: "nps", options: [], standardScale: "NPS" });
const open = base({ id: "open", type: "open_text", options: [], analyze: true });
const optional = base({ id: "optional", required: false });
const questions = [single, multi, rating, nps, open, optional];

describe("required questions", () => {
  it("flags every missing required answer and skips optional ones", () => {
    const errors = validateAnswers(questions, {});
    expect(errors).toEqual({
      single: "required",
      multi: "required",
      rating: "required",
      nps: "required",
      open: "required",
    });
  });

  it("treats blank text and empty selections as missing", () => {
    expect(validateAnswer(open, { text: "   " })).toBe("required");
    expect(validateAnswer(multi, { optionIds: [] })).toBe("required");
  });

  it("accepts NPS 0 as an answer", () => {
    expect(validateAnswer(nps, { value: 0 })).toBeNull();
    expect(isAnswerEmpty(nps, { value: 0 })).toBe(false);
  });

  it("passes a complete valid answer set", () => {
    expect(
      validateAnswers(questions, {
        single: { optionIds: ["a"] },
        multi: { optionIds: ["a", "b"] },
        rating: { value: 4 },
        nps: { value: 9 },
        open: { text: "Tốt" },
      }),
    ).toEqual({});
  });

  it("allows optional questions to stay empty", () => {
    expect(validateAnswer(optional, undefined)).toBeNull();
    expect(validateAnswer(optional, { optionIds: [] })).toBeNull();
  });
});

describe("maxSelections", () => {
  it("rejects more picks than allowed", () => {
    expect(validateAnswer(multi, { optionIds: ["a", "b", "c"] })).toBe("max_selections");
  });

  it("counts the other option towards the limit", () => {
    expect(
      validateAnswer(multi, { optionIds: ["a", "b", OTHER_OPTION_ID], otherText: "x" }),
    ).toBe("max_selections");
  });

  it("accepts up to the limit", () => {
    expect(validateAnswer(multi, { optionIds: ["a", "c"] })).toBeNull();
  });
});

describe("other (Khác) requires text", () => {
  it("rejects other without text, single and multiple", () => {
    expect(validateAnswer(single, { optionIds: [OTHER_OPTION_ID] })).toBe("other_required");
    expect(validateAnswer(single, { optionIds: [OTHER_OPTION_ID], otherText: "  " })).toBe(
      "other_required",
    );
    expect(validateAnswer(multi, { optionIds: ["a", OTHER_OPTION_ID] })).toBe("other_required");
  });

  it("accepts other with text", () => {
    expect(validateAnswer(single, { optionIds: [OTHER_OPTION_ID], otherText: "Khác nữa" })).toBeNull();
  });

  it("rejects other when the question does not allow it", () => {
    const noOther = base({ id: "n" });
    expect(validateAnswer(noOther, { optionIds: [OTHER_OPTION_ID], otherText: "x" })).toBe(
      "invalid",
    );
  });
});

describe("invalid answers", () => {
  it("rejects unknown options, duplicates and multiple picks for single choice", () => {
    expect(validateAnswer(single, { optionIds: ["zzz"] })).toBe("invalid");
    expect(validateAnswer(multi, { optionIds: ["a", "a"] })).toBe("invalid");
    expect(validateAnswer(single, { optionIds: ["a", "b"] })).toBe("invalid");
  });

  it("rejects out-of-range or fractional numbers", () => {
    expect(validateAnswer(rating, { value: 6 })).toBe("invalid");
    expect(validateAnswer(rating, { value: 0 })).toBe("invalid");
    expect(validateAnswer(nps, { value: 11 })).toBe("invalid");
    expect(validateAnswer(nps, { value: 2.5 })).toBe("invalid");
  });

  it("rejects answers of the wrong shape", () => {
    expect(validateAnswer(rating, { text: "5" })).toBe("invalid");
    expect(validateAnswer(single, { value: 1 })).toBe("invalid");
    expect(validateAnswer(open, { value: 1 })).toBe("invalid");
  });

  it("finds unknown question ids", () => {
    expect(findUnknownQuestionIds(questions, { single: { optionIds: ["a"] }, ghost: { text: "x" } })).toEqual([
      "ghost",
    ]);
  });
});
