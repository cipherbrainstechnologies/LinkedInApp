import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { ApplicationsController } from "./applications.module.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { QuotaService } from "../../platform/quota.service.js";

describe("APP application golden path (API)", () => {
  let controller: ApplicationsController;
  let userId: string;
  let jobId: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    const quota = new QuotaService(prismaService);
    controller = new ApplicationsController(prismaService, quota);

    const user = await prisma.user.create({ data: { status: "ACTIVE", onboardingState: "COMPLETED" } });
    userId = user.id;

    await prisma.email.create({
      data: {
        userId,
        displayValue: "app.test@demo.applyflow.local",
        valueHash: "hash",
        verified: true,
        isPrimary: true,
        verifiedAt: new Date(),
      },
    });

    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    const planVersion = await prisma.planVersion.findFirst({
      where: { planId: freePlan!.id, status: "PUBLISHED" },
    });
    const period = await prisma.entitlementPeriod.create({
      data: {
        userId,
        planVersionId: planVersion!.id,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        quotaLimit: 5,
        status: "ACTIVE",
      },
    });
    await prisma.quotaLedgerEntry.create({
      data: {
        userId,
        entitlementPeriodId: period.id,
        entryType: "GRANT",
        units: 5,
        operationKey: `grant:test:${userId}`,
        reasonCode: "TEST",
        actorType: "SYSTEM",
      },
    });

    const job = await prisma.job.findFirst({ where: { fingerprint: "job:software-engineer-techcorp" } });
    if (!job) throw new Error("Seed job missing");
    jobId = job.id;

    await prisma.candidateProfile.create({ data: { userId, preferredName: "App Tester", profileVersion: 2 } });
    const doc = await prisma.document.create({
      data: {
        userId,
        objectKey: "test/resume",
        originalName: "resume.pdf",
        contentHash: "abc",
        mimeType: "application/pdf",
        sizeBytes: 100,
        scanStatus: "CLEAN",
        extractionStatus: "COMPLETE",
      },
    });
    const resume = await prisma.resume.create({ data: { userId, name: "Primary", isActive: true } });
    await prisma.resumeVersion.create({
      data: { resumeId: resume.id, versionNumber: 1, documentId: doc.id, extractionStatus: "COMPLETE" },
    });
  });

  afterAll(async () => {
    await prisma.applicationAnswer.deleteMany({ where: { application: { userId } } });
    await prisma.applicationEvent.deleteMany({ where: { application: { userId } } });
    await prisma.submissionEvidence.deleteMany({ where: { application: { userId } } });
    await prisma.connectorRun.deleteMany({ where: { application: { userId } } });
    await prisma.quotaLedgerEntry.deleteMany({ where: { userId } });
    await prisma.outboxEvent.deleteMany({});
    await prisma.idempotencyRecord.deleteMany({ where: { userId } });
    await prisma.application.deleteMany({ where: { userId } });
    await prisma.resumeVersion.deleteMany({ where: { resume: { userId } } });
    await prisma.resume.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.candidateProfile.deleteMany({ where: { userId } });
    await prisma.entitlementPeriod.deleteMany({ where: { userId } });
    await prisma.email.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("APP-12 blocks duplicate draft for same job", async () => {
    const first = await controller.createDraft(userId, { jobId });
    const second = await controller.createDraft(userId, { jobId });
    expect(first.applicationId).toBeTruthy();
    expect(second.duplicate).toBe(true);
    expect(second.applicationId).toBe(first.applicationId);
  });

  it("APP-02 blocks submit until answers confirmed", async () => {
    const job = await prisma.job.findFirst({ where: { fingerprint: "job:frontend-designfirst" } });
    const draft = await controller.createDraft(userId, { jobId: job!.id });
    await controller.prepare(userId, draft.applicationId!);

    await expect(controller.submit(userId, draft.applicationId!, "idem-blocked")).rejects.toMatchObject({
      response: { code: "SUBMIT_BLOCKED" },
    });
  });

  it("APP-05 idempotent submit returns same response", async () => {
    const job = await prisma.job.findFirst({ where: { fingerprint: "job:data-analyst-intern" } });
    const draft = await controller.createDraft(userId, { jobId: job!.id });
    await controller.prepare(userId, draft.applicationId!);
    await controller.confirmAnswers(userId, draft.applicationId!, {
      answers: [
        { questionKey: "why_apply", answerValue: "Interested in data" },
        { questionKey: "salary_expectation", answerValue: "Market rate" },
        { questionKey: "work_authorization", answerValue: "Yes" },
      ],
    });

    const key = `idem-${draft.applicationId}`;
    const first = await controller.submit(userId, draft.applicationId!, key);
    const second = await controller.submit(userId, draft.applicationId!, key);
    expect(second).toEqual(first);
  });
});
