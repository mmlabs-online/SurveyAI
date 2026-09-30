import type { ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "lilac" | "sun" | "pink" | "mint" | "white";

/** Background + text pairs, each verified >= 4.5:1. */
export const TONE_BG: Record<Tone, string> = {
  lilac: "bg-brand-soft text-brand-ink",
  sun: "bg-sun-soft text-ink",
  pink: "bg-pink-soft text-pink-ink",
  mint: "bg-mint-soft text-mint-ink",
  white: "bg-card text-ink",
};

interface StickerProps {
  tone?: Tone;
  tilt?: "left" | "right" | "none";
  children: ReactNode;
  className?: string;
}

/** Sticker-style label: outlined pill, slightly tilted. */
export function Sticker({ tone = "sun", tilt = "none", children, className }: StickerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 font-display text-sm font-bold leading-tight shadow-pop-sm",
        TONE_BG[tone],
        tilt === "left" && "-rotate-2",
        tilt === "right" && "rotate-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small quiet tag for metadata. */
export function Tag({ tone = "lilac", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 font-display text-sm font-bold shadow-pop-sm",
        TONE_BG[tone],
      )}
    >
      {children}
    </span>
  );
}

interface CardProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

/** Bubbly card: big radius, soft coloured chunky shadow. */
export function Card({ tone = "white", className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-bubble border-2 border-line p-5 shadow-card",
        TONE_BG[tone],
        tone !== "white" && "border-ink/15",
        className,
      )}
    >
      {children}
    </div>
  );
}
