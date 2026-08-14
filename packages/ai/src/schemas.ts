import { z } from "zod";

export const resumeExtractFieldSchema = z.object({
  value: z.string(),
  source: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
  confirmed: z.boolean().default(false),
});

export const resumeExtractOutputSchema = z.object({
  preferredName: resumeExtractFieldSchema.optional(),
  summary: resumeExtractFieldSchema.optional(),
  experiences: z.array(
    z.object({
      employer: z.string(),
      title: z.string(),
      description: resumeExtractFieldSchema.optional(),
    }),
  ).default([]),
  educations: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
    }),
  ).default([]),
  skills: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export type ResumeExtractOutput = z.infer<typeof resumeExtractOutputSchema>;

export const AI_TASKS = [
  "RESUME_EXTRACT",
  "JOB_EXTRACT",
  "MATCH_EXPLAIN",
  "SCREENING_DRAFT",
] as const;

export type AiTaskName = (typeof AI_TASKS)[number];

export type AiTaskResult<T> =
  | { status: "COMPLETED"; value: T; runId: string; warnings: string[] }
  | { status: "REFUSED"; runId: string; safeReason: string }
  | { status: "FAILED"; runId: string; retryable: boolean; code: string };
