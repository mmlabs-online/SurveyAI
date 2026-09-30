"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { vi } from "@/i18n/vi";
import { getApiClient } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/navigation";
import { useCurrentUser } from "./RequireAuth";

export function OwnerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useCurrentUser();
  const [leaving, setLeaving] = useState(false);

  async function logout(): Promise<void> {
    setLeaving(true);
    await getApiClient().logout();
    router.replace(LOGIN_PATH);
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <nav aria-label={vi.nav.label} className="flex items-center gap-5">
            <Link href="/dashboard" className="font-serif text-lg font-bold text-brand-dark">
              {vi.brand}
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold hover:underline">
              {vi.nav.dashboard}
            </Link>
            <Link href="/surveys/new" className="text-sm font-semibold hover:underline">
              {vi.nav.newSurvey}
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{user.email}</span>
            <Button variant="secondary" onClick={logout} loading={leaving} className="min-h-9 text-sm">
              {vi.nav.logout}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
