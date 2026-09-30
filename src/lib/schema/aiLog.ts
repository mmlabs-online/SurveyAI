import { z } from "zod";

export const AI_CALL_STATUSES = ["ok", "invalid_json", "timeout", "error"] as const;

export const aiCallLogSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  surveyId: z.string().min(1).optional(),
  taskType: z.string().min(1),
  model: z.literal("mock-llm"),
  tokensIn: z.number().int().min(0),
  tokensOut: z.number().int().min(0),
  durationMs: z.number().min(0),
  estimatedCost: z.number().min(0),
  status: z.enum(AI_CALL_STATUSES),
  createdAt: z.iso.datetime(),
});

export type AiCallLog = z.infer<typeof aiCallLogSchema>;
export type AiCallStatus = AiCallLog["status"];
