import { cn } from "./cn";

/** Tiny four-point star used as sticker-like decoration. */
export function Sparkle({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 animate-twinkle", className)}
    >
      <path
        d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4Z"
        fill="currentColor"
        stroke="#3a2647"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}
