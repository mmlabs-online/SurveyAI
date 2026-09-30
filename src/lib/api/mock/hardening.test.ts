import { describe, expect, it, vi as vitest } from "vitest";
import { IDEA, answerAll, generated, published, signedInClient } from "@/test/helpers";
import { createMockApiClient } from "./client";
import { defaultGenerator, type SurveyGenerator } from "./generator";
import { createMemoryStorage, createBrowserStorage } from "./storage";
import { CORRUPT_KEY_PREFIX, createMockStore, STORAGE_KEY } from "./store";

describe("generator output is not trusted", () => {
  it("forces draft status, server id and owner id", async () => {
    const hostile: SurveyGenerator = (input, ctx) => ({
      ...(defaultGenerator(input, ctx) as object),
      id: "srv_attacker",
      ownerId: "usr_someone_else",
      status: "published",
    });
    const client = await signedInClient({ generator: hostile });
    const me = await client.getCurrentUser();
    const survey = await generated(client);
    expect(survey.status).toBe("draft");
    expect(survey.ownerId).toBe(me?.id);
    expect(survey.id).not.toBe("srv_attacker");
    expect(survey.id).toMatch(/^srv_/);
    expect(client.store.read().versions).toEqual([]);
    const [saved] = await client.listSurveys();
    expect(saved).toMatchObject({ id: survey.id, status: "draft" });
  });
});

describe("cancellation", () => {
  it("stops between attempts when aborted and saves nothing", async () => {
    const controller = new AbortController();
    const calls: number[] = [];
    const generator: SurveyGenerator = (input, ctx) => {
      calls.push(ctx.attempt);
      controller.abort();
      return defaultGenerator(input, ctx);
    };
    const client = await signedInClient({ generator });
    await expect(
      client.generateSurvey({ idea: IDEA }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toEqual([1]);
    expect(await client.listSurveys()).toEqual([]);
  });

  it("does not start when already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const generator = vitest.fn(defaultGenerator);
    const client = await signedInClient({ generator });
    await expect(
      client.generateSurvey({ idea: IDEA }, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(generator).not.toHaveBeenCalled();
  });
});

describe("mock store corruption safety", () => {
  it("does not touch unreadable data on read", () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: "{broken" });
    createMockStore(storage).read();
    expect(storage.getItem(STORAGE_KEY)).toBe("{broken");
  });

  it("backs up unparseable JSON before the first write resets it", () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: "{broken" });
    createMockStore(storage, Math.random, () => 42).update((s) => s);
    expect(storage.getItem(`${CORRUPT_KEY_PREFIX}42`)).toBe("{broken");
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null")).toMatchObject({ schemaVersion: 1 });
  });

  it("backs up data from another schema version instead of wiping it", () => {
    const old = JSON.stringify({ users: [{ email: "old@example.com" }], surveys: [] });
    const storage = createMemoryStorage({ [STORAGE_KEY]: old });
    createMockStore(storage, Math.random, () => 7).update((s) => s);
    expect(storage.getItem(`${CORRUPT_KEY_PREFIX}7`)).toBe(old);
  });

  it("writes no backup when nothing was stored or data is valid", () => {
    const storage = createMemoryStorage();
    const store = createMockStore(storage, Math.random, () => 1);
    store.update((s) => s);
    store.update((s) => s);
    expect(storage.getItem(`${CORRUPT_KEY_PREFIX}1`)).toBeNull();
  });

  it("supports a session-scoped browser adapter", () => {
    const storage = createBrowserStorage("session");
    storage.setItem("sess", "1");
    expect(window.sessionStorage.getItem("sess")).toBe("1");
    window.sessionStorage.clear();
  });
});

describe("respondent sessions across reloads", () => {
  async function setup() {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    return { client, survey, slug: result.slug };
  }

  it("reuses the remembered session so a reload does not inflate started", async () => {
    const { client, survey, slug } = await setup();
    const respondentStorage = createMemoryStorage();
    const tab = () =>
      createMockApiClient({ storage: client.storage, respondentStorage, latencyMs: 0 });
    const first = await tab().startResponse(slug);
    const afterReload = await tab().startResponse(slug);
    expect(afterReload.sessionId).toBe(first.sessionId);
    expect((await client.getResponseOverview(survey.id)).started).toBe(1);
  });

  it("starts a fresh session once the previous one was submitted", async () => {
    const { client, survey, slug } = await setup();
    const first = await client.startResponse(slug);
    await client.submitResponse(slug, first.sessionId, answerAll(survey.questions));
    const next = await client.startResponse(slug);
    expect(next.sessionId).not.toBe(first.sessionId);
  });

  it("keeps sessions separate per published version", async () => {
    const { client, survey, slug } = await setup();
    const v1 = await client.startResponse(slug);
    await client.publishSurvey(survey.id);
    const v2 = await client.startResponse(slug);
    expect(v2.sessionId).not.toBe(v1.sessionId);
  });
});

describe("public survey hides internal tags", () => {
  it("strips objective, segment, analyze, scale and source", async () => {
    const client = await signedInClient();
    const { result } = await published(client);
    const publicSurvey = await client.getPublicSurvey(result.slug);
    for (const q of publicSurvey.questions) {
      for (const hidden of ["objective", "segment", "analyze", "standardScale"]) {
        expect(q).not.toHaveProperty(hidden);
      }
    }
    expect(JSON.stringify(publicSurvey)).not.toContain("visit_frequency");
    expect(publicSurvey).not.toHaveProperty("source");
  });
});
