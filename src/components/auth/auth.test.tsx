import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from "vitest";
import { vi } from "@/i18n/vi";
import { setApiClient } from "@/lib/api";
import { makeClient } from "@/test/helpers";
import { AuthForm } from "./AuthForm";
import { RequireAuth } from "./RequireAuth";

const nav = vitest.hoisted(() => {
  const router = { replace: vitest.fn(), push: vitest.fn() };
  return { router, pathname: "/surveys/abc", search: new URLSearchParams() };
});

vitest.mock("next/navigation", () => ({
  useRouter: () => nav.router,
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.search,
}));

beforeEach(() => {
  nav.router.replace.mockReset();
  nav.search = new URLSearchParams();
});
afterEach(() => setApiClient(null));

describe("RequireAuth (protected owner routes)", () => {
  it("redirects to /login with a next param when there is no session", async () => {
    setApiClient(makeClient());
    render(
      <RequireAuth>
        <p>bí mật</p>
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/login?next=%2Fsurveys%2Fabc"),
    );
    expect(screen.queryByText("bí mật")).not.toBeInTheDocument();
  });

  it("renders children when signed in", async () => {
    const client = makeClient();
    await client.signup({ email: "a@example.com", password: "password123" });
    setApiClient(client);
    render(
      <RequireAuth>
        <p>nội dung riêng</p>
      </RequireAuth>,
    );
    expect(await screen.findByText("nội dung riêng")).toBeInTheDocument();
    expect(nav.router.replace).not.toHaveBeenCalled();
  });
});

describe("RequireAuth session changes", () => {
  it("redirects to /login when the session disappears while the page is open", async () => {
    const client = makeClient();
    await client.signup({ email: "a@example.com", password: "password123" });
    setApiClient(client);
    render(
      <RequireAuth>
        <p>nội dung riêng</p>
      </RequireAuth>,
    );
    expect(await screen.findByText("nội dung riêng")).toBeInTheDocument();
    await client.logout();
    await waitFor(() =>
      expect(nav.router.replace).toHaveBeenCalledWith("/login?next=%2Fsurveys%2Fabc"),
    );
    await waitFor(() => expect(screen.queryByText("nội dung riêng")).not.toBeInTheDocument());
  });
});

describe("AuthForm demo notice", () => {
  it("warns that this is a demo and not to use real passwords", () => {
    setApiClient(makeClient());
    render(<AuthForm mode="signup" />);
    expect(screen.getByText(vi.auth.demoNotice)).toBeInTheDocument();
  });
});

describe("AuthForm", () => {
  it("shows the password rule for short passwords on signup", async () => {
    setApiClient(makeClient());
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText(vi.auth.emailLabel), "a@example.com");
    await user.type(screen.getByLabelText(vi.auth.passwordLabel), "short");
    await user.click(screen.getByRole("button", { name: vi.auth.signup.submit }));
    expect(await screen.findByText(vi.errors.passwordShort)).toBeInTheDocument();
    expect(screen.getByLabelText(vi.auth.passwordLabel)).toHaveAttribute("aria-invalid", "true");
    expect(nav.router.replace).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email and accepts a fresh signup then login", async () => {
    const client = makeClient();
    await client.signup({ email: "dup@example.com", password: "password123" });
    await client.logout();
    setApiClient(client);
    const user = userEvent.setup();
    const { unmount } = render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText(vi.auth.emailLabel), "dup@example.com");
    await user.type(screen.getByLabelText(vi.auth.passwordLabel), "password123");
    await user.click(screen.getByRole("button", { name: vi.auth.signup.submit }));
    expect(await screen.findByText(vi.errors.emailTaken)).toBeInTheDocument();
    unmount();

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(vi.auth.emailLabel), "dup@example.com");
    await user.type(screen.getByLabelText(vi.auth.passwordLabel), "password123");
    await user.click(screen.getByRole("button", { name: vi.auth.login.submit }));
    await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a generic error for wrong credentials and honours a safe next param", async () => {
    const client = makeClient();
    await client.signup({ email: "x@example.com", password: "password123" });
    await client.logout();
    setApiClient(client);
    nav.search = new URLSearchParams({ next: "/surveys/abc" });
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(vi.auth.emailLabel), "x@example.com");
    await user.type(screen.getByLabelText(vi.auth.passwordLabel), "wrong-password");
    await user.click(screen.getByRole("button", { name: vi.auth.login.submit }));
    expect(await screen.findByText(vi.errors.invalidCredentials)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(vi.auth.passwordLabel));
    await user.type(screen.getByLabelText(vi.auth.passwordLabel), "password123");
    await user.click(screen.getByRole("button", { name: vi.auth.login.submit }));
    await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith("/surveys/abc"));
  });
});
