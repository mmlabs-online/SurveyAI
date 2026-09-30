import { describe, expect, it } from "vitest";
import { IDEA, answerAll, generated, published, signedInClient } from "@/test/helpers";
import { SLUG_PATTERN, type Survey } from "@/lib/schema/survey";
import { defaultGenerator, type SurveyGenerator } from "./generator";

function withQuestionText(text: string, optionLabel?: string): SurveyGenerator {
  return (input, ctx) => {
    const survey = defaultGenerator(input, ctx) as Survey;
    const targetIndex = optionLabel ? survey.questions.findIndex((q) => q.options.length > 0) : 0;
    return {
      ...survey,
      questions: survey.questions.map((q, index) => {
        if (index !== targetIndex) return q;
        if (!optionLabel) return { ...q, text };
        return { ...q, options: q.options.map((o, i) => (i === 0 ? { ...o, label: optionLabel } : o)) };
      }),
    };
  };
}

describe("publish (PUB-01)", () => {
  it("creates a version 1 snapshot with a url-safe slug and share path", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    expect(result.version).toBe(1);
    expect(result.slug).toMatch(SLUG_PATTERN);
    expect(result.path).toBe(`/s/${result.slug}`);
    expect(result.survey.status).toBe("published");

    const detail = await client.getSurvey(survey.id);
    expect(detail.survey.status).toBe("published");
    expect(detail.published).toMatchObject({ version: 1, slug: result.slug });
    const [version] = client.store.read().versions;
    expect(version).toMatchObject({ surveyId: survey.id, version: 1, slug: result.slug });
    expect(version?.snapshot.questions).toEqual(survey.questions);
  });

  it("keeps the snapshot immutable when the survey changes afterwards", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);

    client.store.update((state) => ({
      ...state,
      surveys: state.surveys.map((s) =>
        s.id === survey.id
          ? { ...s, title: "Tiêu đề đã bị sửa", questions: s.questions.slice(0, 2) }
          : s,
      ),
    }));

    const snapshot = client.store.read().versions[0]?.snapshot;
    expect(snapshot?.title).toBe(survey.title);
    expect(snapshot?.questions).toHaveLength(survey.questions.length);
    const publicSurvey = await client.getPublicSurvey(result.slug);
    expect(publicSurvey.title).toBe(survey.title);
    expect(publicSurvey.questions).toHaveLength(survey.questions.length);
  });

  it("returns frozen public data so callers cannot mutate a snapshot", async () => {
    const client = await signedInClient();
    const { result } = await published(client);
    const publicSurvey = await client.getPublicSurvey(result.slug);
    expect(Object.isFrozen(publicSurvey)).toBe(true);
    expect(Object.isFrozen(publicSurvey.questions[0])).toBe(true);
    expect(() => {
      (publicSurvey as { title: string }).title = "hack";
    }).toThrow();
    expect((await client.getPublicSurvey(result.slug)).title).toBe(publicSurvey.title);
  });

  it("does not leak owner data to respondents", async () => {
    const client = await signedInClient();
    const { result } = await published(client);
    const publicSurvey = await client.getPublicSurvey(result.slug);
    expect(Object.keys(publicSurvey).sort()).toEqual(
      ["intro", "questions", "slug", "thankYou", "title", "version"].sort(),
    );
  });

  it("re-publishing creates a new version on the same slug and keeps v1 intact", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    const again = await client.publishSurvey(survey.id);
    expect(again.version).toBe(2);
    expect(again.slug).toBe(result.slug);
    const versions = client.store.read().versions;
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect((await client.getPublicSurvey(result.slug)).version).toBe(2);
  });

  it("keeps earlier responses tied to their version after re-publish", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    const { sessionId } = await client.startResponse(result.slug);
    await client.publishSurvey(survey.id);
    // Respondent who saw v1 submits after v2 went live.
    await client.submitResponse(result.slug, sessionId, answerAll(survey.questions));
    const fresh = await client.startResponse(result.slug);
    await client.submitResponse(result.slug, fresh.sessionId, answerAll(survey.questions));

    const responses = client.store.read().responses;
    expect(responses.map((r) => r.version)).toEqual([1, 2]);
    const overview = await client.getResponseOverview(survey.id);
    expect(overview.responses.map((r) => r.version).sort()).toEqual([1, 2]);
  });

  it("generates unique slugs across many surveys", async () => {
    const client = await signedInClient();
    const slugs = new Set<string>();
    for (let i = 0; i < 25; i += 1) {
      const survey = await generated(client);
      slugs.add((await client.publishSurvey(survey.id)).slug);
    }
    expect(slugs.size).toBe(25);
  });

  it("never reuses a slug that belongs to another survey", async () => {
    const client = await signedInClient({ random: () => 0 });
    const first = await generated(client);
    await client.publishSurvey(first.id);
    const second = await generated(client);
    await expect(client.publishSurvey(second.id)).rejects.toBeInstanceOf(Error);
    expect(client.store.read().versions).toHaveLength(1);
  });

  it("lists response counts and slug on the dashboard", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    const { sessionId } = await client.startResponse(result.slug);
    await client.submitResponse(result.slug, sessionId, answerAll(survey.questions));
    const [summary] = await client.listSurveys();
    expect(summary).toMatchObject({ status: "published", responseCount: 1, slug: result.slug });
  });
});

describe("abuse check blocks publish (GEN-07)", () => {
  it.each([
    "Vui lòng nhập mật khẩu email của bạn",
    "Bạn cho chúng tôi mã OTP vừa gửi nhé?",
    "Số thẻ tín dụng của bạn là gì?",
    "Mã xác thực gồm 6 số là gì?",
    "What is your password?",
    "Please share your card number and CVV",
  ])("blocks and names the question: %s", async (text) => {
    const client = await signedInClient({ generator: withQuestionText(text) });
    const survey = await client.generateSurvey({ idea: IDEA });
    await expect(client.publishSurvey(survey.id)).rejects.toMatchObject({
      code: "abuse_blocked",
      details: { violations: [expect.objectContaining({ questionText: text })] },
    });
    await expect(client.publishSurvey(survey.id)).rejects.toThrow(text);
    expect(client.store.read().versions).toHaveLength(0);
    expect((await client.getSurvey(survey.id)).survey.status).toBe("draft");
  });

  it("also blocks sensitive option labels", async () => {
    const client = await signedInClient({ generator: withQuestionText("", "Số CVV") });
    const survey = await client.generateSurvey({ idea: IDEA });
    await expect(client.publishSurvey(survey.id)).rejects.toMatchObject({ code: "abuse_blocked" });
  });
});
