import { describe, expect, it } from "vitest";
import { safeNextPath } from "./navigation";

describe("safeNextPath (open-redirect protection)", () => {
  it("keeps safe same-origin relative paths", () => {
    expect(safeNextPath("/surveys/1")).toBe("/surveys/1");
    expect(safeNextPath("/surveys/1/responses?x=1#top")).toBe("/surveys/1/responses?x=1#top");
  });

  it.each([
    ["https://evil.com"],
    ["//evil.com"],
    ["/\\evil.com"],
    ["/\t/evil.com"],
    ["/%09/evil.com"],
    ["/%5cevil.com"],
    ["/ok\nevil"],
    ["/a b"],
    ["/%E0%A4%A"],
    ["javascript:alert(1)"],
    ["evil.com"],
    ["/login"],
    ["/signup?next=/x"],
    [""],
    [null],
    [undefined],
  ])("rejects unsafe redirect target %j", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });
});
