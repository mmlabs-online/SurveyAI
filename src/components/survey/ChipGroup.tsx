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
      <p id={labelId} className="text-sm font-semibold">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const pressed = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(pressed ? undefined : option.value)}
              className={cn(
                "min-h-11 border px-3.5 py-2 text-sm font-medium transition-colors",
                pressed
                  ? "border-brand bg-brand text-white"
                  : "border-ink/30 bg-card text-ink hover:bg-brand-soft",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
