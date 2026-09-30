import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from "vitest";
import { vi } from "@/i18n/vi";
import { setApiClient } from "@/lib/api";
import type { MockApiClient } from "@/lib/api/mock/client";
import type { Survey } from "@/lib/schema/survey";
import { published, signedInClient } from "@/test/helpers";
import { RespondentForm } from "./RespondentForm";

const nav = vitest.hoisted(() => ({ params: {} as Record<string, string> }));
vitest.mock("next/navigation", () => ({ useParams: () => nav.params }));

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function open(): Promise<{ client: MockApiClient; survey: Survey; slug: string }> {
  const client = await signedInClient();
  const { survey, result } = await published(client);
  setApiClient(client);
  nav.params = { slug: result.slug };
  render(<RespondentForm />);
  await screen.findByRole("heading", { level: 1, name: survey.title });
  return { client, survey, slug: result.slug };
}

function groupFor(text: string): HTMLElement {
  return screen.getByRole("group", { name: new RegExp(escapeRegExp(text)) });
}

async function fillEverything(user: UserEvent, survey: Survey): Promise<void> {
  for (const q of survey.questions) {
    const group = groupFor(q.text);
    if (q.type === "single_choice" || q.type === "multiple_choice") {
      const [first] = within(group).getAllByRole(q.type === "single_choice" ? "radio" : "checkbox");
      if (first) await user.click(first);
    } else if (q.type === "rating") {
      await user.click(within(group).getByRole("radio", { name: "4" }));
    } else if (q.type === "nps") {
      await user.click(within(group).getByRole("radio", { name: "9" }));
    } else {
      await user.type(within(group).getByRole("textbox"), "Rất ổn");
    }
  }
}

beforeEach(() => {
  nav.params = {};
});
afterEach(() => setApiClient(null));

describe("respondent page (RSP-01/03)", () => {
  it("renders every question type with labelled, keyboard-reachable inputs", async () => {
    const { survey } = await open();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    for (const q of survey.questions) expect(groupFor(q.text)).toBeInTheDocument();
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(10);
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(2);
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: vi.respondent.submit })).toBeEnabled();
  });

  it("highlights missing required answers and stores nothing", async () => {
    const { client, survey } = await open();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: vi.respondent.submit }));
    const requiredCount = survey.questions.filter((q) => q.required).length;
    expect(await screen.findAllByText(vi.respondent.errors.required)).toHaveLength(requiredCount);
    expect(screen.getByText(vi.respondent.fixErrors(requiredCount))).toBeInTheDocument();
    const firstRequired = survey.questions.find((q) => q.required);
    if (!firstRequired) throw new Error("expected a required question");
    expect(groupFor(firstRequired.text)).toHaveAttribute("aria-invalid", "true");
    expect(client.store.read().responses).toHaveLength(0);
  });

  it("tracks started on the first answer and thanks the respondent after a valid submit", async () => {
    const { client, survey } = await open();
    const user = userEvent.setup();
    expect(client.store.read().sessions).toHaveLength(0);
    await fillEverything(user, survey);
    await waitFor(() => expect(client.store.read().sessions).toHaveLength(1));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await user.click(screen.getByRole("button", { name: vi.respondent.submit }));
    expect(await screen.findByText(vi.respondent.thanksTitle)).toBeInTheDocument();
    expect(screen.getByText(survey.thankYou)).toBeInTheDocument();
    expect(client.store.read().responses).toHaveLength(1);
    expect(client.store.read().sessions).toHaveLength(1);
  });

  it("limits multiple choice to maxSelections and requires text for Khác", async () => {
    const { client, survey } = await open();
    const user = userEvent.setup();
    await fillEverything(user, survey);
    const multi = survey.questions.find((q) => q.type === "multiple_choice");
    if (!multi?.maxSelections) throw new Error("expected multiple choice with a limit");
    const group = groupFor(multi.text);
    const boxes = within(group).getAllByRole("checkbox");
    // first is already checked; check up to the limit, the rest become disabled
    for (const box of boxes.slice(1, multi.maxSelections)) await user.click(box);
    const unchecked = boxes.filter((b) => !(b as HTMLInputElement).checked);
    expect(unchecked.length).toBeGreaterThan(0);
    for (const box of unchecked) expect(box).toBeDisabled();

    // free a slot and choose "Khác" without text
    const [first] = boxes;
    if (first) await user.click(first);
    await user.click(within(group).getByRole("checkbox", { name: vi.respondent.otherLabel }));
    await user.click(screen.getByRole("button", { name: vi.respondent.submit }));
    expect(await screen.findByText(vi.respondent.errors.other_required)).toBeInTheDocument();
    expect(client.store.read().responses).toHaveLength(0);

    await user.type(
      within(group).getByRole("textbox", { name: vi.respondent.otherTextLabel(multi.text) }),
      "Lựa chọn khác",
    );
    await user.click(screen.getByRole("button", { name: vi.respondent.submit }));
    expect(await screen.findByText(vi.respondent.thanksTitle)).toBeInTheDocument();
    expect(client.store.read().responses[0]?.answers[multi.id]).toMatchObject({
      otherText: "Lựa chọn khác",
    });
  });

  it("shows a friendly message for an unknown slug", async () => {
    const client = await signedInClient();
    setApiClient(client);
    nav.params = { slug: "zzzzzzz" };
    render(<RespondentForm />);
    expect(await screen.findByText(vi.respondent.notFound.title)).toBeInTheDocument();
    expect(screen.getByText(vi.respondent.notFound.body)).toBeInTheDocument();
  });
});
