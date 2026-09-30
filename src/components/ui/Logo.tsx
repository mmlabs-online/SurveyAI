import { vi } from "@/i18n/vi";
import { cn } from "./cn";

/** Wordmark with a tiny sprout-face badge. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="-2 -4 48 46" width={34} height={34} aria-hidden="true" focusable="false" className="shrink-0">
        <path d="M20 8 Q19 4 22 2" fill="none" stroke="#3a2647" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M21 4 Q28 -1 34 3 Q29 10 21 4Z" fill="#7ee0b5" stroke="#3a2647" strokeWidth={2} strokeLinejoin="round" />
        <path
          d="M20 8 C31 8 37 16 37 25 C37 33 31 38 20 38 C9 38 3 33 3 25 C3 16 9 8 20 8Z"
          fill="#ffd43b"
          stroke="#3a2647"
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
        <ellipse cx={14} cy={23} rx={2.2} ry={3} fill="#3a2647" />
        <ellipse cx={26} cy={23} rx={2.2} ry={3} fill="#3a2647" />
        <path d="M16.5 28.5 Q20 32 23.5 28.5" fill="none" stroke="#3a2647" strokeWidth={2.2} strokeLinecap="round" />
        <g transform="rotate(10 34 32)">
          <rect x={30} y={26} width={10} height={12} rx={2} fill="#fff" stroke="#3a2647" strokeWidth={1.8} />
          <path d="M32.5 31 l1.6 1.6 l3 -3" fill="none" stroke="#0a6b4a" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <ellipse cx={9.5} cy={28} rx={2.6} ry={1.8} fill="#ff8fb1" />
        <ellipse cx={29} cy={28} rx={2.4} ry={1.8} fill="#ff8fb1" />
      </svg>
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight text-brand-ink">
        {vi.brand}
      </span>
    </span>
  );
}
