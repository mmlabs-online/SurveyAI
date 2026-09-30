import { describe, expect, it } from "vitest";
import { checkIdea, countChars, IDEA_MAX_CHARS } from "./idea";

describe("idea length", () => {
  it("rejects under 10 characters", () => {
    expect(checkIdea("ngắn quá")).toBe("too_short");
    expect(checkIdea("         ")).toBe("too_short");
  });

  it("accepts exactly 10 and exactly 2000 characters", () => {
    expect(checkIdea("a".repeat(10))).toBe("ok");
    expect(checkIdea("a".repeat(IDEA_MAX_CHARS))).toBe("ok");
  });

  it("blocks over 2000 characters", () => {
    expect(checkIdea("a".repeat(IDEA_MAX_CHARS + 1))).toBe("too_long");
  });

  it("counts Vietnamese text the same with or without diacritics or decomposition", () => {
    const withMarks = "Tôi muốn khảo sát";
    const without = "Toi muon khao sat";
    const decomposed = withMarks.normalize("NFD");
    expect(countChars(withMarks)).toBe(countChars(without));
    expect(countChars(decomposed)).toBe(countChars(withMarks));
  });

  it("counts astral characters as one", () => {
    expect(countChars("😀".repeat(10))).toBe(10);
    expect(checkIdea("😀".repeat(10))).toBe("ok");
  });
});
