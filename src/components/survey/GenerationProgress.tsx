import { vi } from "@/i18n/vi";
import type { GenerationProgress as Progress } from "@/lib/api";

const STAGE_PERCENT = { analyzing: 20, drafting: 55, validating: 85 } as const;

export function GenerationProgress({ progress }: { progress: Progress | null }) {
  const stage = progress?.stage ?? "analyzing";
  const percent = STAGE_PERCENT[stage];
  const retrying = progress !== null && progress.attempt > 1;
  return (
    <div className="space-y-3 border border-line bg-card p-5" aria-live="polite">
      <p className="font-serif text-lg font-bold">{vi.idea.generating.title}</p>
      <div
        role="progressbar"
        aria-label={vi.idea.generating.title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full bg-line"
      >
        <div
          className="h-full bg-brand transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted">{vi.idea.generating.stages[stage]}</p>
      {retrying ? (
        <p className="text-sm font-medium text-accent">
          {vi.idea.generating.retrying(progress.attempt, progress.maxAttempts)}
        </p>
      ) : null}
    </div>
  );
}
