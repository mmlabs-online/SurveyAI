import { describe, expect, it, vi as vitest } from "vitest";
import { answerAll, otherRespondent, published, signedInClient } from "@/test/helpers";
import { vi } from "@/i18n/vi";
import { OTHER_OPTION_ID, type Answers, type Question } from "@/lib/schema/survey";

async function setup() {
  const client = await signedInClient();
  const { survey, result } = await published(client);
  return { client, survey, slug: result.slug };
}

function byType(questions: Question[], type: Question["type"]): Question {
  const found = questions.find((q) => q.type === type);
  if (!found) throw new Error(`no ${type} question`);
  return found;
}

describe("respondent access (RSP-01)", () => {
  it("returns a friendly not-found for an unknown slug", async () => {
    const { client } = await setup();
    await expect(client.getPublicSurvey("nope123")).rejects.toMatchObject({
      code: "not_found",
      message: vi.errors.publicNotFound,
    });
    await expect(client.startResponse("nope123")).rejects.toMatchObject({ code: "not_found" });
    await expect(client.submitResponse("nope123", "x", {})).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("serves the survey without a session", async () => {
    const { client, survey, slug } = await setup();
    await client.logout();
    const publicSurvey = await client.getPublicSurvey(slug);
    expect(publicSurvey.questions).toHaveLength(survey.questions.length);
  });
});

describe("respondent validation (RSP-03)", () => {
  it("rejects missing required answers, highlights them, and stores nothing", async () => {
    const { client, survey, slug } = await setup();
    const { sessionId } = await client.startResponse(slug);
    const error = await client.submitResponse(slug, sessionId, {}).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "invalid_answers" });
    const requiredIds = survey.questions.filter((q) => q.required).map((q) => q.id);
    expect(Object.keys((error as { details: { answerErrors: object } }).details.answerErrors).sort()).toEqual(
      [...requiredIds].sort(),
    );
    expect(client.store.read().responses).toHaveLength(0);
    expect((await client.getResponseOverview(survey.id)).total).toBe(0);
  });

  it("enforces maxSelections on multiple choice", async () => {
    const { client, survey, slug } = await setup();
    const multi = byType(survey.questions, "multiple_choice");
    const tooMany: Answers = {
      ...answerAll(survey.questions),
      [multi.id]: { optionIds: multi.options.slice(0, (multi.maxSelections ?? 1) + 1).map((o) => o.id) },
    };
    await expect(client.submitResponse(slug, "s", tooMany)).rejects.toMatchObject({
      code: "invalid_answers",
      details: { answerErrors: { [multi.id]: "max_selections" } },
    });
    expect(client.store.read().responses).toHaveLength(0);
  });

  it("requires text when Khác is chosen and accepts it with text", async () => {
    const { client, survey, slug } = await setup();
    const multi = byType(survey.questions, "multiple_choice");
    const noText: Answers = {
      ...answerAll(survey.questions),
      [multi.id]: { optionIds: [OTHER_OPTION_ID] },
    };
    await expect(client.submitResponse(slug, "s", noText)).rejects.toMatchObject({
      details: { answerErrors: { [multi.id]: "other_required" } },
    });
    const withText: Answers = {
      ...noText,
      [multi.id]: { optionIds: [OTHER_OPTION_ID], otherText: "Trà đá miễn phí" },
    };
    await expect(client.submitResponse(slug, "s", withText)).resolves.toHaveProperty("responseId");
    const overview = await client.getResponseOverview(survey.id);
    const row = overview.responses[0]?.answers.find((a) => a.questionId === multi.id);
    expect(row?.labels).toEqual([`${vi.respondent.otherLabel}: Trà đá miễn phí`]);
  });

  it("rejects answers to unknown questions", async () => {
    const { client, survey, slug } = await setup();
    const answers: Answers = { ...answerAll(survey.questions), ghost: { text: "x" } };
    await expect(client.submitResponse(slug, "s", answers)).rejects.toMatchObject({
      code: "invalid_answers",
    });
  });

  it("rejects submitting twice on the same session", async () => {
    const { client, survey, slug } = await setup();
    const { sessionId } = await client.startResponse(slug);
    await client.submitResponse(slug, sessionId, answerAll(survey.questions));
    await expect(
      client.submitResponse(slug, sessionId, answerAll(survey.questions)),
    ).rejects.toMatchObject({ code: "already_submitted" });
    expect(client.store.read().responses).toHaveLength(1);
  });
});

describe("response overview (COL-06)", () => {
  it("shows option labels, never ids", async () => {
    const { client, survey, slug } = await setup();
    const answers = answerAll(survey.questions);
    const { sessionId } = await client.startResponse(slug);
    await client.submitResponse(slug, sessionId, answers);
    const overview = await client.getResponseOverview(survey.id);
    const single = byType(survey.questions, "single_choice");
    const row = overview.responses[0]?.answers.find((a) => a.questionId === single.id);
    expect(row?.labels).toEqual([single.options[0]?.label]);
    const flat = JSON.stringify(overview.responses);
    for (const q of survey.questions) {
      for (const o of q.options) expect(flat).not.toContain(o.id);
    }
    const nps = overview.responses[0]?.answers.find(
      (a) => a.questionId === byType(survey.questions, "nps").id,
    );
    expect(nps?.labels).toEqual(["9"]);
  });

  it("computes completion rate as completed / started", async () => {
    const { client, survey, slug } = await setup();
    expect(await client.getResponseOverview(survey.id)).toMatchObject({
      total: 0,
      started: 0,
      completionRate: 0,
    });
    const a = await client.startResponse(slug);
    await otherRespondent(client).startResponse(slug);
    await otherRespondent(client).startResponse(slug);
    await otherRespondent(client).startResponse(slug);
    await client.submitResponse(slug, a.sessionId, answerAll(survey.questions));
    const overview = await client.getResponseOverview(survey.id);
    expect(overview).toMatchObject({ total: 1, started: 4, completionRate: 0.25 });
  });

  it("makes start idempotent per session and counts direct submits as started", async () => {
    const { client, survey, slug } = await setup();
    const first = await client.startResponse(slug);
    const again = await client.startResponse(slug, first.sessionId);
    expect(again.sessionId).toBe(first.sessionId);
    await client.submitResponse(slug, "never-started", answerAll(survey.questions));
    const overview = await client.getResponseOverview(survey.id);
    expect(overview).toMatchObject({ total: 1, started: 2 });
    expect(overview.completionRate).toBe(0.5);
  });

  it("lists newest responses first", async () => {
    let now = Date.parse("2026-01-01T00:00:00.000Z");
    const client = await signedInClient({ now: () => (now += 1000) });
    const { survey, result } = await published(client);
    const a = await client.startResponse(result.slug);
    await client.submitResponse(result.slug, a.sessionId, answerAll(survey.questions));
    const b = await client.startResponse(result.slug);
    const second = await client.submitResponse(result.slug, b.sessionId, answerAll(survey.questions));
    const overview = await client.getResponseOverview(survey.id);
    expect(overview.responses[0]?.id).toBe(second.responseId);
  });

  it("notifies subscribers so the count refreshes without reload", async () => {
    const { client, survey, slug } = await setup();
    const listener = vitest.fn();
    const unsubscribe = client.subscribe(listener);
    const { sessionId } = await client.startResponse(slug);
    await client.submitResponse(slug, sessionId, answerAll(survey.questions));
    expect(listener).toHaveBeenCalled();
    const calls = listener.mock.calls.length;
    unsubscribe();
    await client.startResponse(slug);
    expect(listener.mock.calls.length).toBe(calls);
  });

  it("keeps a placeholder row when the version snapshot is missing so total matches the list", async () => {
    const { client, survey, slug } = await setup();
    const { sessionId } = await client.startResponse(slug);
    await client.submitResponse(slug, sessionId, answerAll(survey.questions));
    client.store.update((s) => ({ ...s, versions: s.versions.map((v) => ({ ...v, version: 9 })) }));
    const overview = await client.getResponseOverview(survey.id);
    expect(overview.total).toBe(1);
    expect(overview.responses).toHaveLength(overview.total);
    expect(overview.responses[0]?.answers).toEqual([]);
  });
});
