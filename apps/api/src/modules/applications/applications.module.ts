import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

@Controller("applications")
@UseGuards(AuthGuard)
class ApplicationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quota: QuotaService,
  ) {}

  @Get()
  async listApplications(
    @CurrentUserId() userId: string,
    @Query("q") q?: string,
    @Query("state") state?: string,
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

    const apps = await this.prisma.client.application.findMany({
      where,
      include: { job: true },
      orderBy: { updatedAt: "desc" },
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
    return app;
  }

  @Post()
  async createDraft(@CurrentUserId() userId: string, @Body() body: { jobId: string }) {
    const existing = await this.prisma.client.application.findFirst({
      where: {
        userId,
        jobId: body.jobId,
        state: { in: ["SUBMITTED", "QUEUED", "RUNNING", "WAITING_FOR_USER"] },
      },
    });
    if (existing) {
      return { duplicate: true, applicationId: existing.id, state: existing.state };
    }

    const job = await this.prisma.client.job.findUniqueOrThrow({ where: { id: body.jobId } });
    const snapshot = await this.prisma.client.jobSnapshot.findFirst({
      where: { jobId: body.jobId },
      orderBy: { capturedAt: "desc" },
    });
    const activeResume = await this.prisma.client.resume.findFirst({
      where: { userId, isActive: true },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    const mode = job.policyMode === "ASSISTED" ? "ASSISTED" : "CONFIRM_EACH";

    const app = await this.prisma.client.application.create({
      data: {
        userId,
        jobId: body.jobId,
        jobSnapshotId: snapshot?.id,
        resumeVersionId: activeResume?.versions[0]?.id,
        mode,
        state: "NEEDS_REVIEW",
        profileVersion: 1,
      },
    });

    await this.prisma.client.applicationEvent.create({
      data: {
        applicationId: app.id,
        eventType: "DRAFT_CREATED",
        actorType: "USER",
        actorId: userId,
      },
    });

    return { applicationId: app.id, mode, state: app.state };
  }

  @Post(":id/confirm")
  async confirmAnswers(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: { answers: Array<{ questionKey: string; questionText: string; answerValue: string }> },
  ) {
    const app = await this.prisma.client.application.findFirstOrThrow({ where: { id, userId } });

    for (const answer of body.answers) {
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
          },
        });
      } else {
        await this.prisma.client.applicationAnswer.create({
          data: {
            applicationId: id,
            questionKey: answer.questionKey,
            questionText: answer.questionText,
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

    const existingRecord = await this.prisma.client.idempotencyRecord.findUnique({
      where: { key_requestPath: { key, requestPath: `POST /applications/${id}/submit` } },
    });
    if (existingRecord?.responseBody) {
      return existingRecord.responseBody;
    }

    const app = await this.prisma.client.application.findFirstOrThrow({
      where: { id, userId },
      include: { job: true },
    });

    if (app.job.policyMode === "ASSISTED") {
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
      return response;
    }

    const operationKey = `reserve:${key}`;
    const reserved = await this.quota.reserveQuota(userId, id, operationKey);
    if (!reserved) {
      return { error: "QUOTA_EXHAUSTED", code: "QUOTA_EXHAUSTED", status: 409 };
    }

    await this.prisma.client.application.update({
      where: { id },
      data: { state: "QUEUED", quotaReservationId: operationKey, idempotencyKey: key },
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

    await this.prisma.client.idempotencyRecord.create({
      data: {
        key,
        userId,
        requestPath: `POST /applications/${id}/submit`,
        responseBody: response,
        statusCode: 200,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return response;
  }

  @Post(":id/complete-external")
  async completeExternal(@CurrentUserId() userId: string, @Param("id") id: string) {
    const app = await this.prisma.client.application.findFirstOrThrow({ where: { id, userId } });
    const operationKey = app.quotaReservationId ?? `consume:${id}`;

    if (!app.quotaReservationId) {
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
}

@Module({ controllers: [ApplicationsController] })
export class ApplicationsModule {}
