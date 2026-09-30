import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from "vitest";
import { vi } from "@/i18n/vi";
import { setApiClient } from "@/lib/api";
import { defaultGenerator, type SurveyGenerator } from "@/lib/api/mock/generator";
import { IDEA, answerAll, generated, otherRespondent, published, signedInClient } from "@/test/helpers";
import { DashboardView } from "./DashboardView";
import { IdeaForm } from "./IdeaForm";
import { ResponsesOverview } from "./ResponsesOverview";
import { SurveyReview } from "./SurveyReview";

const nav = vitest.hoisted(() => {
  const router = { replace: vitest.fn(), push: vitest.fn() };
  return { router, params: {} as Record<string, string> };
});

vitest.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  useParams: () => nav.params,
}));

beforeEach(() => {
  nav.router.push.mockReset();
  nav.params = {};
});
afterEach(() => setApiClient(null));

describe("IdeaForm (GEN-01/04)", () => {
  it("asks for more detail under 10 characters and does not generate", async () => {
    const client = await signedInClient();
    setApiClient(client);
    const user = userEvent.setup();
    render(<IdeaForm />);
    await user.type(screen.getByLabelText(vi.idea.ideaLabel), "ngắn");
    await user.click(screen.getByRole("button", { name: vi.idea.submit }));
    expect(await screen.findByText(vi.errors.ideaTooShort)).toBeInTheDocument();
    expect(await client.listSurveys()).toEqual([]);
  });

  it("blocks ideas over 2000 characters", async () => {
    setApiClient(await signedInClient());
    render(<IdeaForm />);
    const box = screen.getByLabelText(vi.idea.ideaLabel);
    // paste is much faster than typing 2001 characters
    await userEvent.setup().click(box);
    await userEvent.setup().paste("a".repeat(2001));
    expect(screen.getByText(vi.errors.ideaTooLong)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: vi.idea.submit })).toBeDisabled();
  });

  it("generates with quick picks and opens the review page", async () => {
    const client = await signedInClient();
    setApiClient(client);
    const user = userEvent.setup();
    render(<IdeaForm />);
    await user.type(screen.getByLabelText(vi.idea.ideaLabel), IDEA);
    const spa = screen.getByRole("button", { name: vi.idea.industries.spa });
    await user.click(spa);
    expect(spa).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: vi.idea.surveyTypes.root_cause }));
    await user.click(screen.getByRole("button", { name: vi.idea.submit }));
    await waitFor(() => expect(nav.router.push).toHaveBeenCalled());
    const [saved] = await client.listSurveys();
    expect(nav.router.push).toHaveBeenCalledWith(`/surveys/${saved?.id}`);
    expect((await client.getSurvey(saved?.id ?? "")).survey.source).toMatchObject({
      industry: "spa",
      surveyType: "root_cause",
    });
  });

  it("does not save or navigate when the page is left while generating", async () => {
    const client = await signedInClient({ latencyMs: 15 });
    setApiClient(client);
    const user = userEvent.setup();
    const { unmount } = render(<IdeaForm />);
    await user.type(screen.getByLabelText(vi.idea.ideaLabel), IDEA);
    await user.click(screen.getByRole("button", { name: vi.idea.submit }));
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(nav.router.push).not.toHaveBeenCalled();
    expect(client.store.read().surveys).toEqual([]);
  });

  it("shows the error with a working Thử lại button after retries are exhausted", async () => {
    let healthy = false;
    const generator: SurveyGenerator = (input, ctx) =>
      healthy ? defaultGenerator(input, ctx) : { broken: true };
    setApiClient(await signedInClient({ generator }));
    const user = userEvent.setup();
    render(<IdeaForm />);
    await user.type(screen.getByLabelText(vi.idea.ideaLabel), IDEA);
    await user.click(screen.getByRole("button", { name: vi.idea.submit }));
    expect(await screen.findByText(vi.errors.generationFailed)).toBeInTheDocument();
    healthy = true;
    await user.click(screen.getByRole("button", { name: vi.common.retry }));
    await waitFor(() => expect(nav.router.push).toHaveBeenCalled());
  });
});

describe("dashboard, review, publish and responses", () => {
  it("shows an empty state, then the survey list with status and response count", async () => {
    const client = await signedInClient();
    setApiClient(client);
    const { unmount } = render(<DashboardView />);
    expect(await screen.findByText(vi.dashboard.empty.title)).toBeInTheDocument();
    unmount();

    const { survey, result } = await published(client);
    const { sessionId } = await client.startResponse(result.slug);
    await client.submitResponse(result.slug, sessionId, answerAll(survey.questions));
    render(<DashboardView />);
    expect(await screen.findByText(survey.title)).toBeInTheDocument();
    expect(screen.getByText(vi.dashboard.status.published)).toBeInTheDocument();
    expect(screen.getByText(vi.dashboard.responses(1))).toBeInTheDocument();
  });

  it("reviews a draft, publishes it and shows the share link", async () => {
    const client = await signedInClient();
    const survey = await generated(client);
    setApiClient(client);
    nav.params = { id: survey.id };
    const user = userEvent.setup();
    render(<SurveyReview />);
    expect(await screen.findByRole("heading", { level: 1, name: survey.title })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(survey.questions.length);
    await user.click(screen.getByRole("button", { name: vi.review.publish.action }));
    const link = await screen.findByRole("link", { name: /\/s\// });
    const [version] = client.store.read().versions;
    expect(link).toHaveAttribute("href", `/s/${version?.slug}`);
    expect(screen.getByRole("button", { name: vi.common.copy })).toBeInTheDocument();
  });

  it("explains an abuse block by naming the question", async () => {
    const abusive: SurveyGenerator = (input, ctx) => {
      const base = defaultGenerator(input, ctx) as ReturnType<typeof defaultGenerator> & {
        questions: Array<{ text: string }>;
      };
      return {
        ...base,
        questions: base.questions.map((q, i) =>
          i === 0 ? { ...q, text: "Cho biết mật khẩu của bạn" } : q,
        ),
      };
    };
    const client = await signedInClient({ generator: abusive });
    const survey = await generated(client);
    setApiClient(client);
    nav.params = { id: survey.id };
    const user = userEvent.setup();
    render(<SurveyReview />);
    await user.click(await screen.findByRole("button", { name: vi.review.publish.action }));
    expect(
      await screen.findByText(vi.errors.abuseBlocked("Cho biết mật khẩu của bạn")),
    ).toBeInTheDocument();
    expect(client.store.read().versions).toHaveLength(0);
  });

  it("shows not-found for someone else's survey", async () => {
    setApiClient(await signedInClient());
    nav.params = { id: "srv_missing" };
    render(<SurveyReview />);
    expect(await screen.findByText(vi.errors.surveyNotFound)).toBeInTheDocument();
  });

  it("shows totals, completion rate and option labels on the responses page", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    const { sessionId } = await client.startResponse(result.slug);
    await otherRespondent(client).startResponse(result.slug);
    await client.submitResponse(result.slug, sessionId, answerAll(survey.questions));
    setApiClient(client);
    nav.params = { id: survey.id };
    render(<ResponsesOverview />);
    expect(await screen.findByText("50%")).toBeInTheDocument();
    const firstOption = survey.questions.find((q) => q.options.length > 0)?.options[0];
    expect(screen.getAllByText(firstOption?.label ?? "").length).toBeGreaterThan(0);
    expect(screen.queryByText(firstOption?.id ?? "###")).not.toBeInTheDocument();
  });

  it("refreshes the count without reload when a response arrives", async () => {
    const client = await signedInClient();
    const { survey, result } = await published(client);
    setApiClient(client);
    nav.params = { id: survey.id };
    render(<ResponsesOverview />);
    expect(await screen.findByText(vi.responses.empty.title)).toBeInTheDocument();
    const { sessionId } = await client.startResponse(result.slug);
    await client.submitResponse(result.slug, sessionId, answerAll(survey.questions));
    await waitFor(() => expect(screen.queryByText(vi.responses.empty.title)).not.toBeInTheDocument());
    expect(screen.getByText(vi.responses.responseHeading(1), { exact: false })).toBeInTheDocument();
  });
});
