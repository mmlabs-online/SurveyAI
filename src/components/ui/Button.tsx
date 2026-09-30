import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "sun" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const BASE =
  "inline-flex min-h-12 select-none items-center justify-center gap-2 rounded-full px-6 py-2 font-display text-lg font-bold leading-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink " +
  "transition-[transform,box-shadow,background-color] duration-150 ease-boing";

const SOLID =
  "border-2 border-ink shadow-pop hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-ink)] " +
  "active:translate-y-[3px] active:scale-[0.97] active:shadow-[0_1px_0_0_var(--color-ink)] " +
  "disabled:translate-y-[3px] disabled:shadow-none disabled:hover:translate-y-[3px]";

const VARIANTS: Record<Variant, string> = {
  primary: `${SOLID} bg-brand text-white hover:bg-brand-dark`,
  secondary: `${SOLID} bg-card text-ink hover:bg-brand-soft`,
  sun: `${SOLID} bg-sun text-ink hover:bg-[#ffdd66]`,
  ghost: "text-brand-ink underline decoration-2 underline-offset-4 hover:bg-brand-soft active:scale-95",
};

/** Class string so links (next/link) can look exactly like buttons. */
export function buttonClasses(variant: Variant = "primary", className?: string): string {
  return cn(BASE, VARIANTS[variant], className);
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-end gap-0.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-dot rounded-full bg-current"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonClasses(variant),
        "disabled:cursor-not-allowed disabled:opacity-65",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
