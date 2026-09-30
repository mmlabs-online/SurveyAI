"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { vi } from "@/i18n/vi";
import { getApiClient, type User } from "@/lib/api";
import { loginRedirectUrl } from "@/lib/navigation";

const UserContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useCurrentUser must be used inside <RequireAuth>");
  return user;
}

type AuthState = { status: "checking" } | { status: "ready"; user: User };

/** Protects owner routes: redirects to /login when there is no session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    const api = getApiClient();
    const redirectToLogin = (): void => {
      setState({ status: "checking" });
      router.replace(loginRedirectUrl(pathname));
    };
    const check = (): void => {
      api.getCurrentUser().then(
        (user) => {
          if (cancelled) return;
          if (!user) {
            redirectToLogin();
            return;
          }
          // Keep the same object unless the signed-in account actually changed.
          setState((prev) =>
            prev.status === "ready" && prev.user.id === user.id ? prev : { status: "ready", user },
          );
        },
        () => {
          if (!cancelled) redirectToLogin();
        },
      );
    };
    check();
    // The session can disappear (logout in another tab): react to store changes.
    const unsubscribe = api.subscribe(check);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router, pathname]);

  if (state.status === "checking") {
    return (
      <p role="status" className="p-8 text-center text-muted">
        {vi.common.checkingSession}
      </p>
    );
  }
  return <UserContext.Provider value={state.user}>{children}</UserContext.Provider>;
}
