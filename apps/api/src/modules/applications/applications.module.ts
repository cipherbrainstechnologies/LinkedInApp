import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { Module } from "@nestjs/common";
import {
  DEFAULT_SCREENING_QUESTIONS,
  resolveExecutionMode,
  validateApplicationSubmit,
} from "@applyflow/domain";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

const ACTIVE_DUPLICATE_STATES = [
  "NEEDS_REVIEW",
  "READY",
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_USER",
  "SUBMISSION_UNCERTAIN",
  "SUBMITTED",
];

@Controller("applications")
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  @Get()
  async listApplications(
    @CurrentUserId() userId: string,
    @Query("q") q?: string,
    @Query("state") state?: string,
    @Query("sort") sort?: string,
  ) {
    const where: Record<string, unknown> = { userId };
    if (state) where.state = state;
    if (q) {
      where.job = {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const orderBy =
      sort === "created"
        ? { createdAt: "asc" as const }
        : { updatedAt: "desc" as const };

    const apps = await this.prisma.client.application.findMany({
      where,
      include: { job: true },
      orderBy,
    });

    return { items: apps };
  }

  @Get(":id")
  async getApplication(@CurrentUserId() userId: string, @Param("id") id: string) {
    const app = await this.prisma.client.application.findFirstOrThrow({
      where: { id, userId },
      include: {
        job: true,
        answers: true,
        events: { orderBy: { createdAt: "asc" } },
        evidence: true,
      },
    });

    const resumeVersion = app.resumeVersionId
      ? await this.prisma.client.resumeVersion.findUnique({
          where: { id: app.resumeVersionId },
          select: { id: true, versionNumber: true, resumeId: true },
        })
      : null;

    return {
      ...app,
      snapshot: {
        jobSnapshotId: app.jobSnapshotId,
        profileVersion: app.profileVersion,
        resumeVersion,
        connectorId: app.connectorId,
        connectorVersion: app.connectorVersion,
        domainPolicyId: app.domainPolicyId,
        domainPolicyVersion: app.domainPolicyVersion,
      },
    };
  }

  @Post()
  async createDraft(@CurrentUserId() userId: string, @Body() body: { jobId: string }) {
    const existing = await this.prisma.client.application.findFirst({
      where: {
        userId,
        jobId: body.jobId,
        state: { in: ACTIVE_DUPLICATE_STATES },
      },
    });
    if (existing) {
      return {
        duplicate: true,
        applicationId: existing.id,
        state: existing.state,
        code: "DUPLICATE_APPLICATION",
      };
    }

    const job = await this.prisma.client.job.findUniqueOrThrow({ where: { id: body.jobId } });
    const snapshot = await this.prisma.client.jobSnapshot.findFirst({
      where: { jobId: body.jobId },
      orderBy: { capturedAt: "desc" },
    });
    const profile = await this.prisma.client.candidateProfile.findUnique({ where: { userId } });
    const activeResume = await this.prisma.client.resume.findFirst({
      where: { userId, isActive: true },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    const domain = job.domain ?? "mock-ats.applyflow.local";
    const policy = await this.prisma.client.domainPolicy.findFirst({
      where: { domain, status: "ENABLED" },
      orderBy: { version: "desc" },
    });

    const connector = await this.prisma.client.connector.findFirst({
      where: { targetDomain: domain, status: "ACTIVE" },
    });

    const mode = resolveExecutionMode({
      domain,
      capabilities: (policy?.capabilities ?? []) as never[],
      mode: job.policyMode as "AUTO" | "CONFIRM_EACH" | "ASSISTED" | "TRACK_ONLY",
      enabled: policy?.status === "ENABLED",
      killSwitchActive: policy?.killSwitchActive ?? false,
    });

    const app = await this.prisma.client.application.create({
      data: {
        userId,
        jobId: body.jobId,
        jobSnapshotId: snapshot?.id,
        resumeVersionId: activeResume?.versions[0]?.id,
        mode,
        state: "NEEDS_REVIEW",
        profileVersion: profile?.profileVersion ?? 1,
        connectorId: connector?.id,
        connectorVersion: connector?.currentVersion,
        domainPolicyId: policy?.id,
        domainPolicyVersion: policy ? String(policy.version) : null,
      },
    });

    await this.prisma.client.applicationEvent.create({
      data: {
        applicationId: app.id,
        eventType: "DRAFT_CREATED",
        actorType: "USER",
        actorId: userId,
        metadata: {
          jobSnapshotId: snapshot?.id,
          resumeVersionId: activeResume?.versions[0]?.id,
          profileVersion: profile?.profileVersion ?? 1,
        },
      },
    });

    return {
      applicationId: app.id,
      mode,
      state: app.state,
      snapshot: {
        jobSnapshotId: snapshot?.id,
        resumeVersionId: activeResume?.versions[0]?.id,
        profileVersion: profile?.profileVersion ?? 1,
        domainPolicyVersion: policy?.version,
        connectorVersion: connector?.currentVersion,
      },
    };
  }

  @Post(":id/prepare")
  async prepare(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.prisma.client.application.findFirstOrThrow({ where: { id, userId } });

    const created: Array<{ questionKey: string; confirmationState: string }> = [];

    for (const question of DEFAULT_SCREENING_QUESTIONS) {
      const existing = await this.prisma.client.applicationAnswer.findFirst({
        where: { applicationId: id, questionKey: question.questionKey },
      });

      if (!existing) {
        await this.prisma.client.applicationAnswer.create({
          data: {
            applicationId: id,
            questionKey: question.questionKey,
            questionText: question.questionText,
            answerType: question.answerType,
            answerValue: "",
            sensitivity: question.sensitivity,
            confirmationState: "NEEDS_CONFIRMATION",
            source: "SYSTEM",
          },
        });
        created.push({ questionKey: question.questionKey, confirmationState: "NEEDS_CONFIRMATION" });
      } else {
        created.push({
          questionKey: question.questionKey,
          confirmationState: existing.confirmationState,
        });
      }
    }

    await this.prisma.client.application.update({
      where: { id },
      data: { state: "NEEDS_REVIEW" },
    });

    return {
      prepared: true,
      questions: DEFAULT_SCREENING_QUESTIONS.map((q) => ({
        questionKey: q.questionKey,
        questionText: q.questionText,
        sensitivity: q.sensitivity,
        requiresUserAnswer: q.sensitivity === "PROTECTED",
      })),
      answers: created,
    };
  }

  @Post(":id/confirm")
  async confirmAnswers(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body()
    body: {
      answers: Array<{ questionKey: string; questionText?: string; answerValue: string }>;
    },
  ) {
    await this.prisma.client.application.findFirstOrThrow({ where: { id, userId } });

    for (const answer of body.answers) {
      if (!answer.answerValue?.trim()) {
        throw new BadRequestException({
          code: "ANSWER_REQUIRED",
          message: `Answer required for ${answer.questionKey}.`,
        });
      }

      const existing = await this.prisma.client.applicationAnswer.findFirst({
        where: { applicationId: id, questionKey: answer.questionKey },
      });
      if (existing) {
        await this.prisma.client.applicationAnswer.update({
          where: { id: existing.id },
          data: {
            answerValue: answer.answerValue,
            confirmationState: "CONFIRMED",
            confirmedAt: new Date(),
            source: "USER",
          },
        });
      } else {
        await this.prisma.client.applicationAnswer.create({
          data: {
            applicationId: id,
            questionKey: answer.questionKey,
            questionText: answer.questionText ?? answer.questionKey,
            answerType: "TEXT",
            answerValue: answer.answerValue,
            confirmationState: "CONFIRMED",
            confirmedAt: new Date(),
            source: "USER",
          },
        });
      }
    }

    await this.prisma.client.application.update({
      where: { id },
      data: { state: "READY" },
    });

    return { confirmed: true, state: "READY" };
  }

  @Post(":id/submit")
  async submit(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const key = idempotencyKey ?? `submit:${id}`;
    const requestPath = `POST /applications/${id}/submit`;

    const existingRecord = await this.prisma.client.idempotencyRecord.findUnique({
      where: { key_requestPath: { key, requestPath } },
    });
    if (existingRecord?.responseBody) {
      return existingRecord.responseBody;
    }

    const app = await this.prisma.client.application.findFirstOrThrow({
      where: { id, userId },
      include: { job: true, answers: true },
    });

    const submitBlockers = validateApplicationSubmit(
      app.answers.map((a) => ({
        questionKey: a.questionKey,
        confirmationState: a.confirmationState,
        answerValue: a.answerValue,
      })),
    );
    if (submitBlockers.length > 0) {
      throw new BadRequestException({ code: "SUBMIT_BLOCKED", blockers: submitBlockers });
    }

    if (app.mode === "ASSISTED" || app.mode === "TRACK_ONLY") {
      const response = {
        state: "WAITING_FOR_USER",
        nextAction: "COMPLETE_EXTERNAL_APPLICATION",
        message: "Complete the application on the external site. ApplyFlow cannot auto-submit to this domain.",
      };
      await this.prisma.client.application.update({
        where: { id },
        data: {
          state: "WAITING_FOR_USER",
          nextAction: "COMPLETE_EXTERNAL_APPLICATION",
        },
      });
      await this.persistIdempotency(userId, key, requestPath, response);
      return response;
    }

    const operationKey = `reserve:${key}`;
    const reserved = await this.quota.reserveQuota(userId, id, operationKey);
    if (!reserved) {
      const response = { error: "QUOTA_EXHAUSTED", code: "QUOTA_EXHAUSTED", status: 409 };
      return response;
    }

    await this.prisma.client.application.update({
      where: { id },
      data: { state: "QUEUED", idempotencyKey: key },
    });

    await this.prisma.client.applicationEvent.create({
      data: {
        applicationId: id,
        eventType: "QUEUED",
        actorType: "SYSTEM",
        metadata: { idempotencyKey: key },
      },
    });

    await this.prisma.client.outboxEvent.create({
      data: {
        eventType: "application.submit",
        aggregateId: id,
        payload: { applicationId: id, userId, operationKey: key },
      },
    });

    const response = { state: "QUEUED", idempotencyKey: key };
    await this.persistIdempotency(userId, key, requestPath, response);
    return response;
  }

  @Post(":id/resolve-waiting")
  async resolveWaiting(@CurrentUserId() userId: string, @Param("id") id: string) {
    const app = await this.prisma.client.application.findFirstOrThrow({
      where: { id, userId },
      include: { job: true },
    });

    if (app.state !== "WAITING_FOR_USER") {
      throw new BadRequestException({
        code: "NOT_WAITING",
        message: "Application is not waiting for user action.",
      });
    }

    const operationKey = app.idempotencyKey
      ? `reserve:${app.idempotencyKey}`
      : `reserve:resolve:${id}`;
    if (!app.idempotencyKey) {
      const reserved = await this.quota.reserveQuota(userId, id, operationKey);
      if (!reserved) {
        return { error: "QUOTA_EXHAUSTED", code: "QUOTA_EXHAUSTED" };
      }
    }

    await this.prisma.client.application.update({
      where: { id },
      data: { state: "QUEUED" },
    });

    await this.prisma.client.outboxEvent.create({
      data: {
        eventType: "application.submit",
        aggregateId: id,
        payload: { applicationId: id, userId, operationKey },
      },
    });

    return { state: "QUEUED", resumed: true };
  }

  @Post(":id/complete-external")
  async completeExternal(@CurrentUserId() userId: string, @Param("id") id: string) {
    const app = await this.prisma.client.application.findFirstOrThrow({ where: { id, userId } });
    const operationKey = app.idempotencyKey ? `reserve:${app.idempotencyKey}` : `reserve:submit:${id}`;

    if (!app.idempotencyKey) {
      const reserved = await this.quota.reserveQuota(userId, id, `reserve:${id}`);
      if (!reserved) {
        return { error: "QUOTA_EXHAUSTED" };
      }
    }

    await this.quota.consumeQuota(userId, id, operationKey);

    await this.prisma.client.application.update({
      where: { id },
      data: {
        state: "SUBMITTED",
        submittedAt: new Date(),
        evidenceLevel: "USER_CONFIRMED",
        nextAction: null,
      },
    });

    await this.prisma.client.submissionEvidence.create({
      data: {
        applicationId: id,
        evidenceLevel: "USER_CONFIRMED",
        receiptId: `manual-${id}`,
      },
    });

    await this.prisma.client.applicationEvent.create({
      data: {
        applicationId: id,
        eventType: "SUBMITTED",
        actorType: "USER",
        actorId: userId,
      },
    });

    return { state: "SUBMITTED" };
  }

  private async persistIdempotency(
    userId: string,
    key: string,
    requestPath: string,
    response: Record<string, unknown>,
  ) {
    await this.prisma.client.idempotencyRecord.create({
      data: {
        key,
        userId,
        requestPath,
        responseBody: response as object,
        statusCode: 200,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }
}

@Module({ controllers: [ApplicationsController] })
export class ApplicationsModule {}
