"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Logo } from "@/components/ui/Logo";
import { vi } from "@/i18n/vi";
import { getApiClient } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/navigation";
import { useCurrentUser } from "./RequireAuth";

export function OwnerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const [leaving, setLeaving] = useState(false);

  async function logout(): Promise<void> {
    setLeaving(true);
    await getApiClient().logout();
    router.replace(LOGIN_PATH);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 px-4 pt-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 rounded-[2rem] border-2 border-ink bg-card px-3 py-2 shadow-pop sm:px-4 md:flex-nowrap">
          <Link href="/dashboard" className="rounded-full transition-transform hover:animate-wiggle">
            <Logo />
          </Link>
          <nav
            aria-label={vi.nav.label}
            className="order-last grid w-full grid-cols-2 gap-2 md:order-none md:flex md:w-auto md:flex-1 md:justify-start"
          >
            <NavTab href="/dashboard" active={pathname === "/dashboard"} tone="bg-brand-soft">
              {vi.nav.dashboard}
            </NavTab>
            <NavTab href="/surveys/new" active={pathname === "/surveys/new"} tone="bg-sun">
              {vi.nav.newSurvey}
            </NavTab>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm md:ml-0">
            <span className="hidden max-w-48 truncate font-semibold text-muted lg:inline">{user.email}</span>
            <Button variant="secondary" onClick={logout} loading={leaving} className="min-h-11 px-4 text-base">
              {vi.nav.logout}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">{children}</div>
    </div>
  );
}

function NavTab({
  href,
  active,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  tone: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border-2 px-5 font-display text-base font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95",
        active
          ? `border-ink ${tone} text-ink shadow-pop-sm`
          : "border-ink/25 bg-cream text-ink hover:border-ink hover:bg-sun-soft",
      )}
    >
      {children}
    </Link>
  );
}
