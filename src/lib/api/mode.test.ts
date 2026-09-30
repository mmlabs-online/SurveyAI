import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiClient, resolveApiMode, setApiClient } from "./index";

describe("API mode gating (mock auth must not ship by accident)", () => {
  afterEach(() => {
    setApiClient(null);
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it("defaults to the mock outside production", () => {
    expect(resolveApiMode({})).toBe("mock");
    expect(resolveApiMode({ NODE_ENV: "development" })).toBe("mock");
    expect(resolveApiMode({ NODE_ENV: "test" })).toBe("mock");
  });

  it("refuses the mock in production unless explicitly enabled", () => {
    expect(() => resolveApiMode({ NODE_ENV: "production" })).toThrow(/NEXT_PUBLIC_API_MODE/);
    expect(resolveApiMode({ NODE_ENV: "production", NEXT_PUBLIC_API_MODE: "mock" })).toBe("mock");
  });

  it("rejects unknown API modes", () => {
    expect(() => resolveApiMode({ NEXT_PUBLIC_API_MODE: "http" })).toThrow(/not supported/);
  });

  it("getApiClient throws a clear error in a production build without explicit mock mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "");
    expect(() => getApiClient()).toThrow(/disabled/);
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "mock");
    expect(getApiClient()).toBeDefined();
  });
});
