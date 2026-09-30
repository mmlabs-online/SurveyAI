import type { ReactNode } from "react";
import { OwnerShell } from "@/components/auth/OwnerShell";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <OwnerShell>{children}</OwnerShell>
    </RequireAuth>
  );
}
