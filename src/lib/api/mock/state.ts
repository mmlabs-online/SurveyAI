import { z } from "zod";
import { aiCallLogSchema } from "@/lib/schema/aiLog";
import {
  publishedVersionSchema,
  responseSchema,
  surveySchema,
} from "@/lib/schema/survey";

export const storedUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  mockPasswordHash: z.string().min(1),
  createdAt: z.iso.datetime(),
});

/** A respondent session: created when the first question is answered. */
export const responseSessionSchema = z.object({
  id: z.string().min(1),
  surveyId: z.string().min(1),
  version: z.number().int().min(1),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});

export const STATE_SCHEMA_VERSION = 1;

export const mockStateSchema = z.object({
  schemaVersion: z.literal(STATE_SCHEMA_VERSION),
  idCounter: z.number().int().min(0),
  users: z.array(storedUserSchema),
  sessionUserId: z.string().nullable(),
  surveys: z.array(surveySchema),
  versions: z.array(publishedVersionSchema),
  responses: z.array(responseSchema),
  sessions: z.array(responseSessionSchema),
  aiLog: z.array(aiCallLogSchema),
});

export type StoredUser = z.infer<typeof storedUserSchema>;
export type ResponseSession = z.infer<typeof responseSessionSchema>;
export type MockState = z.infer<typeof mockStateSchema>;

export const EMPTY_STATE: MockState = {
  schemaVersion: STATE_SCHEMA_VERSION,
  idCounter: 0,
  users: [],
  sessionUserId: null,
  surveys: [],
  versions: [],
  responses: [],
  sessions: [],
  aiLog: [],
};
