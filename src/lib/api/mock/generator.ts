import { gen } from "@/i18n/gen.vi";
import { createIdGenerator, type IdGenerator } from "@/lib/schema/ids";
import type {
  Industry,
  Question,
  QuestionType,
  Survey,
  SurveyGoal,
} from "@/lib/schema/survey";
import { normalizeText } from "@/lib/survey/abuse";
import type { GenerateSurveyInput } from "../types";

export interface GeneratorContext {
  surveyId: string;
  ownerId: string;
  /** ISO timestamp used for createdAt/updatedAt. */
  nowIso: string;
  attempt: number;
}

/**
 * A generator returns an UNVALIDATED draft (like an LLM would). The mock client validates
 * it with the Zod schema and retries on failure, so a faulty generator can be injected.
 */
export type SurveyGenerator = (
  input: GenerateSurveyInput,
  context: GeneratorContext,
) => unknown;

/** Thrown by generators to simulate an LLM timeout. */
export class GeneratorTimeoutError extends Error {
  constructor() {
    super("Generator timed out");
    this.name = "GeneratorTimeoutError";
  }
}

const GOAL_KEYWORDS: ReadonlyArray<readonly [SurveyGoal, ReadonlyArray<string>]> = [
  ["root_cause", ["nguyen nhan", "tai sao", "vi sao", "ly do", "sut giam", "giam doanh", "why"]],
  ["new_product", ["y tuong", "san pham moi", "mon moi", "dich vu moi", "ra mat", "launch"]],
  ["satisfaction", ["hai long", "trai nghiem", "phan hoi", "feedback", "satisfaction"]],
];

/** Goal comes from the explicit pick, else from keywords in the idea, else "other". */
export function resolveGoal(input: GenerateSurveyInput): SurveyGoal {
  if (input.surveyType) return input.surveyType;
  const text = normalizeText(input.idea);
  for (const [goal, keywords] of GOAL_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) return goal;
  }
  return "other";
}

/** Small seeded PRNG so the same idea always yields the same ids. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface QuestionSpec {
  type: QuestionType;
  text: string;
  objective: string;
  required?: boolean;
  options?: ReadonlyArray<string>;
  maxSelections?: number;
  allowOther?: boolean;
  standardScale?: Question["standardScale"];
  segment?: string;
}

function buildQuestion(ids: IdGenerator, spec: QuestionSpec): Question {
  return {
    id: ids.next("q"),
    type: spec.type,
    text: spec.text,
    required: spec.required ?? true,
    options: (spec.options ?? []).map((label) => ({ id: ids.next("o"), label })),
    ...(spec.maxSelections !== undefined ? { maxSelections: spec.maxSelections } : {}),
    ...(spec.allowOther ? { allowOther: true } : {}),
    objective: spec.objective,
    ...(spec.standardScale ? { standardScale: spec.standardScale } : {}),
    analyze: spec.type === "open_text",
    ...(spec.segment ? { segment: spec.segment } : {}),
  };
}

function specsFor(goal: SurveyGoal, industry: Industry): QuestionSpec[] {
  const b = gen.business[industry];
  const priority = gen.priorityOptions[industry];
  const csat: QuestionSpec = {
    type: "rating",
    text: gen.csat.text(b),
    objective: gen.csat.objective,
    standardScale: "CSAT",
  };
  const nps: QuestionSpec = {
    type: "nps",
    text: gen.nps.text(b),
    objective: gen.nps.objective,
    standardScale: "NPS",
  };
  const frequency: QuestionSpec = {
    type: "single_choice",
    text: gen.frequency.text(b),
    objective: gen.frequency.objective,
    options: gen.frequency.options,
    segment: "visit_frequency",
  };
  const age: QuestionSpec = {
    type: "single_choice",
    text: gen.age.text,
    objective: gen.age.objective,
    options: gen.age.options,
    required: false,
    segment: "age_group",
  };

  if (goal === "root_cause") {
    const r = gen.rootCause;
    return [
      csat,
      {
        type: "multiple_choice",
        text: r.issues.text,
        objective: r.issues.objective,
        options: r.issues.options,
        maxSelections: 3,
        allowOther: true,
      },
      { type: "open_text", text: r.cause.text, objective: r.cause.objective },
      {
        type: "single_choice",
        text: r.recurrence.text,
        objective: r.recurrence.objective,
        options: r.recurrence.options,
      },
      nps,
      {
        type: "open_text",
        text: r.change.text,
        objective: r.change.objective,
        required: false,
      },
      frequency,
      age,
    ];
  }

  if (goal === "new_product") {
    const n = gen.newProduct;
    return [
      { type: "rating", text: n.interest.text, objective: n.interest.objective },
      {
        type: "multiple_choice",
        text: n.motive.text,
        objective: n.motive.objective,
        options: n.motive.options,
        maxSelections: 2,
        allowOther: true,
      },
      {
        type: "single_choice",
        text: n.price.text,
        objective: n.price.objective,
        options: n.price.options,
      },
      nps,
      {
        type: "open_text",
        text: n.expectation.text,
        objective: n.expectation.objective,
        required: false,
      },
      frequency,
      age,
    ];
  }

  return [
    csat,
    {
      type: "single_choice",
      text: gen.priority.text(b),
      objective: gen.priority.objective,
      options: priority,
    },
    {
      type: "multiple_choice",
      text: gen.likes.text,
      objective: gen.likes.objective,
      options: priority,
      maxSelections: 2,
      allowOther: true,
    },
    nps,
    {
      type: "open_text",
      text: gen.feedback.text(b),
      objective: gen.feedback.objective,
      required: false,
    },
    frequency,
    age,
  ];
}

/** Deterministic mock "LLM": same idea + picks always produce the same survey. */
export const defaultGenerator: SurveyGenerator = (input, context): Survey => {
  const industry: Industry = input.industry ?? "other";
  const goal = resolveGoal(input);
  const idea = input.idea.trim();
  const ids = createIdGenerator(0, seededRandom(`${idea}|${industry}|${goal}`));
  const business = gen.business[industry];
  return {
    id: context.surveyId,
    ownerId: context.ownerId,
    title: `${gen.goalTitle[goal]} – ${business}`,
    intro: gen.intro[goal](business),
    thankYou: gen.thankYou,
    questions: specsFor(goal, industry).map((spec) => buildQuestion(ids, spec)),
    source: {
      idea,
      clarifyAnswers: {},
      ...(input.industry ? { industry: input.industry } : {}),
      ...(input.surveyType ? { surveyType: input.surveyType } : {}),
    },
    goal,
    status: "draft",
    createdAt: context.nowIso,
    updatedAt: context.nowIso,
  };
};
