import { describe, expect, it } from "vitest";
import { formatDateTime, formatPercent } from "@/lib/format";
import { loginRedirectUrl } from "@/lib/navigation";
import { deepFreeze } from "./freeze";
import { generateUniqueSlug, randomSlug, SLUG_LENGTH } from "./slug";
import { SLUG_PATTERN } from "@/lib/schema/survey";

describe("slug", () => {
  it("produces url-safe slugs of 6-8 chars", () => {
    for (let i = 0; i < 200; i += 1) {
      const slug = randomSlug();
      expect(slug).toMatch(SLUG_PATTERN);
      expect(slug).toHaveLength(SLUG_LENGTH);
    }
  });

  it("skips taken slugs", () => {
    const first = randomSlug(() => 0);
    let calls = 0;
    const random = (): number => {
      calls += 1;
      return calls <= SLUG_LENGTH ? 0 : 0.5;
    };
    const slug = generateUniqueSlug(new Set([first]), random);
    expect(slug).not.toBe(first);
  });

  it("throws when it cannot find a free slug", () => {
    expect(() => generateUniqueSlug(new Set([randomSlug(() => 0)]), () => 0, 5)).toThrow();
  });
});

describe("deepFreeze", () => {
  it("freezes nested objects and arrays", () => {
    const value = deepFreeze({ a: { b: [1, { c: 2 }] } });
    expect(Object.isFrozen(value.a.b)).toBe(true);
    expect(Object.isFrozen(value.a.b[1])).toBe(true);
    expect(() => {
      (value.a as { b: unknown }).b = 1;
    }).toThrow();
  });

  it("passes primitives through", () => {
    expect(deepFreeze(5)).toBe(5);
    expect(deepFreeze(null)).toBeNull();
  });
});

describe("navigation and format helpers", () => {
  it("builds a login redirect", () => {
    expect(loginRedirectUrl("/surveys/a b")).toBe("/login?next=%2Fsurveys%2Fa%20b");
  });

  it("formats percent and dates", () => {
    expect(formatPercent(0.666)).toBe("67%");
    expect(formatDateTime("not a date")).toBe("not a date");
    expect(formatDateTime("2026-01-01T00:00:00.000Z")).toMatch(/2026|26/);
  });
});
