"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { Mascot } from "@/components/ui/Mascot";
import { Sparkle } from "@/components/ui/Sparkle";
import { vi } from "@/i18n/vi";
import {
  getApiClient,
  isApiError,
  type GenerationProgress as Progress,
} from "@/lib/api";
import { INDUSTRIES, SURVEY_GOALS, type Industry, type SurveyGoal } from "@/lib/schema/survey";
import { IDEA_MAX_CHARS, checkIdea, countChars } from "@/lib/survey/idea";
import { ChipGroup } from "./ChipGroup";
import { GenerationProgress } from "./GenerationProgress";

const INDUSTRY_OPTIONS = INDUSTRIES.map((value) => ({ value, label: vi.idea.industries[value] }));
const TYPE_OPTIONS = SURVEY_GOALS.map((value) => ({ value, label: vi.idea.surveyTypes[value] }));

export function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState<Industry | undefined>();
  const [surveyType, setSurveyType] = useState<SurveyGoal | undefined>();
  const [touched, setTouched] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Leaving the page cancels an in-flight generation: no state updates or navigation after.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const count = countChars(idea);
  const check = checkIdea(idea);
  const ideaError =
    check === "too_long"
      ? vi.errors.ideaTooLong
      : check === "too_short" && touched
        ? vi.errors.ideaTooShort
        : null;

  async function generate(): Promise<void> {
    setGenerating(true);
    setFailure(null);
    setProgress(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const survey = await getApiClient().generateSurvey(
        { idea, ...(industry ? { industry } : {}), ...(surveyType ? { surveyType } : {}) },
        {
          signal: controller.signal,
          onProgress: (p) => {
            if (!controller.signal.aborted) setProgress(p);
          },
        },
      );
      if (controller.signal.aborted) return;
      router.push(`/surveys/${survey.id}`);
    } catch (error) {
      if (controller.signal.aborted) return;
      setFailure(isApiError(error) ? error.message : vi.errors.unknown);
      setGenerating(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (check === "ok") void generate();
  }

  return (
    <section aria-labelledby="idea-title" className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end gap-3">
        <Mascot mood={generating ? "thinking" : "happy"} size={96} className="mb-1 hidden min-[400px]:block" />
        <div className="relative flex-1 rounded-bubble rounded-bl-md border-2 border-ink bg-sun-soft p-4 shadow-pop sm:p-5">
          <h1 id="idea-title" className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
            {vi.idea.title}
          </h1>
          <p className="mt-1 text-muted">{vi.idea.subtitle}</p>
        </div>
      </div>

      {generating ? (
        <GenerationProgress progress={progress} />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-bubble border-2 border-line bg-card p-5 shadow-card sm:p-7"
        >
          {failure ? (
            <Alert tone="error" title={vi.idea.failureTitle} className="space-y-3">
              <p>{failure}</p>
              <Button variant="secondary" onClick={() => void generate()} className="mt-2">
                {vi.common.retry}
              </Button>
            </Alert>
          ) : null}
          <div>
            <TextAreaField
              label={vi.idea.ideaLabel}
              placeholder={vi.idea.ideaPlaceholder}
              hint={vi.idea.ideaHint}
              rows={6}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onBlur={() => setTouched(true)}
              error={ideaError}
              required
            />
            <p
              className={
                check === "too_long"
                  ? "mt-1 pr-2 text-right text-sm font-bold text-danger"
                  : "mt-1 pr-2 text-right text-sm font-semibold text-muted"
              }
            >
              {vi.idea.counter(count, IDEA_MAX_CHARS)}
            </p>
          </div>
          <ChipGroup
            label={vi.idea.industryLabel}
            options={INDUSTRY_OPTIONS}
            value={industry}
            onChange={setIndustry}
          />
          <ChipGroup
            label={vi.idea.typeLabel}
            options={TYPE_OPTIONS}
            value={surveyType}
            onChange={setSurveyType}
          />
          <Button type="submit" disabled={check === "too_long"} className="w-full sm:w-auto">
            <Sparkle size={18} className="text-sun" />
            {vi.idea.submit}
          </Button>
        </form>
      )}
    </section>
  );
}
