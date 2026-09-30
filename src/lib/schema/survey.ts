import { z } from "zod";

export const QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "rating",
  "nps",
  "open_text",
] as const;
export const STANDARD_SCALES = ["NPS", "CSAT", "CES"] as const;
export const SURVEY_GOALS = [
  "satisfaction",
  "root_cause",
  "new_product",
  "other",
] as const;
export const INDUSTRIES = ["fnb", "spa", "retail", "clinic", "other"] as const;
export const SURVEY_STATUSES = ["draft", "published"] as const;

/** Reserved option id used in answers when the respondent picks the "other" choice. */
export const OTHER_OPTION_ID = "__other__";
export const RATING_SCALE = { min: 1, max: 5 } as const;
export const NPS_SCALE = { min: 0, max: 10 } as const;
export const SLUG_PATTERN = /^[a-z0-9]{6,8}$/;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const standardScaleSchema = z.enum(STANDARD_SCALES);
export const surveyGoalSchema = z.enum(SURVEY_GOALS);
export const industrySchema = z.enum(INDUSTRIES);

export const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(120),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    type: questionTypeSchema,
    text: z.string().trim().min(1).max(300),
    required: z.boolean(),
    options: z.array(optionSchema),
    maxSelections: z.number().int().min(1).optional(),
    allowOther: z.boolean().optional(),
    /** AR-02: what the question is meant to find out. */
    objective: z.string().trim().min(1).max(300),
    /** AR-03 */
    standardScale: standardScaleSchema.optional(),
    /** AR-04: true for open_text so answers get analyzed later. */
    analyze: z.boolean(),
    /** AR-06: segment dimension, e.g. "visit_frequency". */
    segment: z.string().trim().min(1).max(60).optional(),
  })
  .superRefine((q, ctx) => {
    const isChoice = q.type === "single_choice" || q.type === "multiple_choice";
    const fail = (path: string, message: string): void => {
      ctx.addIssue({ code: "custom", path: [path], message });
    };
    if (isChoice) {
      if (q.options.length < 2) {
        fail("options", "Choice questions need at least 2 options");
      }
      if (new Set(q.options.map((o) => o.id)).size !== q.options.length) {
        fail("options", "Option ids must be unique");
      }
    } else if (q.options.length > 0 || q.allowOther) {
      fail("options", "Only choice questions can have options");
    }
    if (q.maxSelections !== undefined) {
      const limit = q.options.length + (q.allowOther ? 1 : 0);
      if (q.type !== "multiple_choice" || q.maxSelections > limit) {
        fail(
          "maxSelections",
          "maxSelections is only valid for multiple_choice and within the option count",
        );
      }
    }
    if (q.type === "nps" && q.standardScale !== "NPS") {
      fail("standardScale", "NPS questions must use the NPS standard scale");
    }
    if (q.standardScale === "NPS" && q.type !== "nps") {
      fail("standardScale", "The NPS scale is only valid for nps questions");
    }
    if (
      (q.standardScale === "CSAT" || q.standardScale === "CES") &&
      q.type !== "rating"
    ) {
      fail("standardScale", "CSAT/CES scales are only valid for rating questions");
    }
    if (q.type === "open_text" && !q.analyze) {
      fail("analyze", "open_text questions must set analyze=true");
    }
  });

/** AR-01: where the survey came from. */
export const surveySourceSchema = z.object({
  idea: z.string().min(1),
  clarifyAnswers: z.record(z.string(), z.string()),
  industry: industrySchema.optional(),
  surveyType: surveyGoalSchema.optional(),
});

export const surveySchema = z
  .object({
    id: z.string().min(1),
    ownerId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    intro: z.string().max(1000),
    thankYou: z.string().max(1000),
    questions: z.array(questionSchema).min(1).max(30),
    source: surveySourceSchema,
    goal: surveyGoalSchema,
    status: z.enum(SURVEY_STATUSES),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .superRefine((s, ctx) => {
    if (new Set(s.questions.map((q) => q.id)).size !== s.questions.length) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question ids must be unique",
      });
    }
  });

export const publishedVersionSchema = z.object({
  surveyId: z.string().min(1),
  version: z.number().int().min(1),
  slug: z.string().regex(SLUG_PATTERN),
  snapshot: surveySchema,
  publishedAt: z.iso.datetime(),
});

export const answerValueSchema = z.union([
  z.object({
    optionIds: z.array(z.string()),
    otherText: z.string().optional(),
  }),
  z.object({ value: z.number() }),
  z.object({ text: z.string() }),
]);

export const answersSchema = z.record(z.string(), answerValueSchema);

export const responseSchema = z.object({
  id: z.string().min(1),
  surveyId: z.string().min(1),
  version: z.number().int().min(1),
  answers: answersSchema,
  submittedAt: z.iso.datetime(),
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type StandardScale = z.infer<typeof standardScaleSchema>;
export type SurveyGoal = z.infer<typeof surveyGoalSchema>;
export type Industry = z.infer<typeof industrySchema>;
export type SurveyOption = z.infer<typeof optionSchema>;
export type Question = z.infer<typeof questionSchema>;
/** What respondents see: no objective, segment, analyze or scale tags. */
export type PublicQuestion = Pick<
  Question,
  "id" | "type" | "text" | "required" | "options" | "maxSelections" | "allowOther"
>;
export type SurveySource = z.infer<typeof surveySourceSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type PublishedVersion = z.infer<typeof publishedVersionSchema>;
export type AnswerValue = z.infer<typeof answerValueSchema>;
export type Answers = z.infer<typeof answersSchema>;
export type SurveyResponse = z.infer<typeof responseSchema>;
