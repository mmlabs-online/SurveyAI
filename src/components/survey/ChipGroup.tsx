import { useId } from "react";
import { cn } from "@/components/ui/cn";

interface ChipGroupProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

/** Optional single pick. Buttons with aria-pressed: keyboard operable, can be un-picked. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2">
      <p id={labelId} className="pl-1 font-display text-base font-bold">
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const pressed = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(pressed ? undefined : option.value)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-base font-bold",
                "transition-[transform,box-shadow,background-color] duration-150 ease-boing active:scale-95",
                pressed
                  ? "-rotate-1 scale-105 border-ink bg-sun text-ink shadow-pop-sm"
                  : "border-edge bg-card text-ink hover:-translate-y-0.5 hover:border-ink hover:bg-sun-soft",
              )}
            >
              {pressed ? (
                <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" className="animate-pop-in">
                  <path
                    d="M3 8.5l3.2 3L13 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
