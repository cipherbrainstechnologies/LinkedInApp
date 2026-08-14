import { z } from "zod";

export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().length(3),
});

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  code: z.string(),
  detail: z.string().optional(),
  traceId: z.string().optional(),
  fieldErrors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    }),
  ).default([]),
  meta: z.record(z.unknown()).optional(),
});

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);
export const onboardingPathSchema = z.enum(["EXPERIENCED", "FRESHER"]);
export const onboardingStateSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

export const applicationStateSchema = z.enum([
  "DRAFT",
  "EXTRACTING",
  "NEEDS_REVIEW",
  "READY",
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_USER",
  "SUBMITTED_UNVERIFIED",
  "SUBMITTED",
  "SUBMISSION_UNCERTAIN",
  "FAILED_RETRYABLE",
  "FAILED_FINAL",
  "CANCELLED",
  "INTERVIEW",
  "REJECTED",
  "WITHDRAWN",
  "OFFER",
]);

export const executionModeSchema = z.enum([
  "AUTO",
  "CONFIRM_EACH",
  "ASSISTED",
  "TRACK_ONLY",
]);

export const quotaEntryTypeSchema = z.enum([
  "GRANT",
  "RESERVE",
  "RELEASE",
  "CONSUME",
  "REVERSE",
  "EXPIRE",
  "ADMIN_ADJUSTMENT",
  "REFERRAL_GRANT",
]);

export const subscriptionStateSchema = z.enum([
  "FREE",
  "INCOMPLETE",
  "ACTIVE",
  "PAST_DUE",
  "CHANGE_SCHEDULED",
  "CANCEL_AT_PERIOD_END",
  "CANCELED",
]);

export const meResponseSchema = z.object({
  id: z.string().uuid(),
  status: userStatusSchema,
  email: z.string().email().nullable(),
  emailVerified: z.boolean(),
  locale: z.string(),
  timeZone: z.string(),
  onboardingPath: onboardingPathSchema.nullable(),
  onboardingState: onboardingStateSchema,
  planSummary: z.object({
    planName: z.string(),
    quotaUsed: z.number().int(),
    quotaLimit: z.number().int(),
    quotaAvailable: z.number().int(),
    resetAt: z.string().datetime().nullable(),
  }),
});

export const onboardingBlockerSchema = z.object({
  code: z.string(),
  field: z.string().optional(),
  message: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string(),
  services: z.object({
    database: z.enum(["ok", "degraded", "down"]),
    redis: z.enum(["ok", "degraded", "down"]),
  }),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type OnboardingBlocker = z.infer<typeof onboardingBlockerSchema>;
