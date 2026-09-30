import { afterEach, describe, expect, it } from "vitest";
import { makeClient } from "@/test/helpers";
import { getApiClient, setApiClient } from "./index";
import { createMockApiClient } from "./mock/client";

describe("active ApiClient", () => {
  afterEach(() => setApiClient(null));

  it("lazily creates one shared client", () => {
    const first = getApiClient();
    expect(getApiClient()).toBe(first);
  });

  it("can be swapped without touching callers", () => {
    const replacement = makeClient();
    setApiClient(replacement);
    expect(getApiClient()).toBe(replacement);
  });

  it("default mock client applies simulated latency", async () => {
    const client = createMockApiClient({ latencyMs: 1 });
    expect(await client.getCurrentUser()).toBeNull();
    window.localStorage.clear();
  });
});
