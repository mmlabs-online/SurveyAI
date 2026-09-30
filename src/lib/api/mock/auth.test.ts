import { describe, expect, it } from "vitest";
import { makeClient } from "@/test/helpers";
import { vi } from "@/i18n/vi";
import { createMemoryStorage } from "./storage";
import { mockHashPassword } from "./auth";
import { createMockApiClient } from "./client";

const CREDS = { email: "An@Example.com", password: "matkhau123" };

describe("auth (ACC-01)", () => {
  it("signs up, normalizes the email, verifies automatically and starts a session", async () => {
    const client = makeClient();
    const user = await client.signup(CREDS);
    expect(user.email).toBe("an@example.com");
    expect(user.emailVerified).toBe(true);
    expect(await client.getCurrentUser()).toMatchObject({ id: user.id });
  });

  it("rejects passwords under 8 characters", async () => {
    const client = makeClient();
    await expect(client.signup({ email: "a@b.co", password: "1234567" })).rejects.toMatchObject({
      code: "validation",
      message: vi.errors.passwordShort,
      details: { field: "password" },
    });
    expect(await client.getCurrentUser()).toBeNull();
  });

  it("accepts exactly 8 characters", async () => {
    await expect(
      makeClient().signup({ email: "a@b.co", password: "12345678" }),
    ).resolves.toBeDefined();
  });

  it("rejects malformed emails", async () => {
    await expect(makeClient().signup({ email: "khong-hop-le", password: "12345678" })).rejects.toMatchObject({
      code: "validation",
      details: { field: "email" },
    });
  });

  it("rejects duplicate emails regardless of case", async () => {
    const client = makeClient();
    await client.signup(CREDS);
    await expect(
      client.signup({ email: "an@example.COM", password: "khacmatkhau1" }),
    ).rejects.toMatchObject({ code: "email_taken", message: vi.errors.emailTaken });
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    const client = makeClient();
    await client.signup(CREDS);
    await client.logout();
    expect(await client.getCurrentUser()).toBeNull();

    await expect(client.login({ email: CREDS.email, password: "sai-mat-khau" })).rejects.toMatchObject({
      code: "invalid_credentials",
    });
    await expect(client.login({ email: "nobody@example.com", password: "matkhau123" })).rejects.toMatchObject({
      code: "invalid_credentials",
    });
    expect(await client.getCurrentUser()).toBeNull();

    const user = await client.login({ email: " AN@example.com ", password: CREDS.password });
    expect(user.email).toBe("an@example.com");
    expect((await client.getCurrentUser())?.id).toBe(user.id);
  });

  it("keeps the session in the store so a new client on the same storage stays signed in", async () => {
    const storage = createMemoryStorage();
    const first = createMockApiClient({ storage, latencyMs: 0 });
    await first.signup(CREDS);
    const second = createMockApiClient({ storage, latencyMs: 0 });
    expect((await second.getCurrentUser())?.email).toBe("an@example.com");
  });

  it("does not keep plain-text passwords", async () => {
    const client = makeClient();
    await client.signup(CREDS);
    const [stored] = client.store.read().users;
    expect(stored?.mockPasswordHash).toBe(mockHashPassword("an@example.com", CREDS.password));
    expect(JSON.stringify(client.store.read())).not.toContain(CREDS.password);
  });

  it("protects owner data behind a session", async () => {
    const client = makeClient();
    await expect(client.listSurveys()).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(client.getSurvey("x")).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(client.getResponseOverview("x")).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("hides one owner's surveys from another owner", async () => {
    const client = makeClient();
    await client.signup(CREDS);
    const survey = await client.generateSurvey({ idea: "Khảo sát mức độ hài lòng của khách" });
    await client.logout();
    await client.signup({ email: "other@example.com", password: "matkhau123" });
    expect(await client.listSurveys()).toEqual([]);
    await expect(client.getSurvey(survey.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(client.publishSurvey(survey.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(client.getResponseOverview(survey.id)).rejects.toMatchObject({ code: "not_found" });
  });
});
