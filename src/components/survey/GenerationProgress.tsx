import { Mascot, type MascotMood } from "@/components/ui/Mascot";
import { Sparkle } from "@/components/ui/Sparkle";
import { vi } from "@/i18n/vi";
import type { GenerationProgress as Progress } from "@/lib/api";

const STAGE_PERCENT = { analyzing: 20, drafting: 55, validating: 85 } as const;
const STAGE_MOOD: Record<keyof typeof STAGE_PERCENT, MascotMood> = {
  analyzing: "thinking",
  drafting: "wink",
  validating: "wow",
};
const STAGES = ["analyzing", "drafting", "validating"] as const;

export function GenerationProgress({ progress }: { progress: Progress | null }) {
  const stage = progress?.stage ?? "analyzing";
  const percent = STAGE_PERCENT[stage];
  const retrying = progress !== null && progress.attempt > 1;
  const stageIndex = STAGES.indexOf(stage);
  return (
    <div
      className="relative overflow-hidden rounded-[2.25rem] border-2 border-ink bg-brand-soft p-6 text-center shadow-pop sm:p-8"
      aria-live="polite"
    >
      <Sparkle className="absolute left-6 top-6 text-sun" size={24} />
      <Sparkle className="absolute right-8 top-10 text-pink [animation-delay:0.8s]" size={18} />
      <Sparkle className="absolute bottom-10 right-10 text-mint [animation-delay:1.4s]" size={22} />
      <div className="flex justify-center">
        <Mascot mood={STAGE_MOOD[stage]} size={148} />
      </div>
      <p className="mt-2 font-display text-2xl leading-tight font-extrabold text-brand-ink">
        {vi.idea.generating.title}
      </p>
      <div
        role="progressbar"
        aria-label={vi.idea.generating.title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mx-auto mt-5 h-6 w-full max-w-md overflow-hidden rounded-full border-2 border-ink bg-card"
      >
        <div
          className="h-full animate-stripes rounded-full border-r-2 border-ink bg-brand transition-[width] duration-700 ease-boing"
          style={{
            width: `${percent}%`,
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.22) 0 10px, transparent 10px 20px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      <ol aria-hidden="true" className="mt-3 flex justify-center gap-2">
        {STAGES.map((name, i) => (
          <li
            key={name}
            className={
              i <= stageIndex
                ? "size-3 rounded-full border-2 border-ink bg-sun transition-colors"
                : "size-3 rounded-full border-2 border-edge bg-card transition-colors"
            }
          />
        ))}
      </ol>
      <p className="mt-3 text-base font-bold text-ink">{vi.idea.generating.stages[stage]}</p>
      {retrying ? (
        <p className="mt-1 text-sm font-bold text-pink-ink">
          {vi.idea.generating.retrying(progress.attempt, progress.maxAttempts)}
        </p>
      ) : null}
    </div>
  );
}
