import type { ReactNode } from "react";
import { cn } from "./cn";

interface AlertProps {
  tone?: "error" | "info" | "success";
  title?: string;
  children?: ReactNode;
  className?: string;
}

const TONES = {
  error: { box: "border-danger bg-danger-soft text-danger animate-shake", chip: "bg-danger text-white" },
  info: { box: "border-brand bg-brand-soft text-brand-ink", chip: "bg-brand text-white" },
  success: { box: "border-mint-ink bg-mint-soft text-mint-ink", chip: "bg-mint-ink text-white" },
} as const;

const GLYPH = { error: "!", info: "i", success: "✓" } as const;

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const style = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-3xl border-2 px-4 py-3 text-sm", style.box, className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold",
          style.chip,
        )}
      >
        {GLYPH[tone]}
      </span>
      <div className="min-w-0 flex-1 text-base leading-snug sm:text-sm">
        {title ? <p className="font-display text-lg font-bold leading-tight">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
