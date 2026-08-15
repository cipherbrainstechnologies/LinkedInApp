import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
loadDotenv({ path: resolve(import.meta.dirname, "../../../.env") });

import { prisma } from "@applyflow/db";
import { createLogger } from "@applyflow/observability";
import { getConfig } from "@applyflow/config";
import { AiGateway } from "@applyflow/ai";
import {
  LocalFileStore,
  scanDocumentBuffer,
  extractTextFromBuffer,
} from "@applyflow/storage";
import { createHash } from "node:crypto";

const logger = createLogger("worker");
const POLL_INTERVAL_MS = 2000;

const config = getConfig();
const fileStore = new LocalFileStore(config.LOCAL_STORAGE_PATH);
const aiGateway = new AiGateway({
  mockEnabled: true,
  openaiEnabled: config.OPENAI_ENABLED,
  anthropicEnabled: config.ANTHROPIC_ENABLED,
});

async function processDocumentEvent(payload: { documentId: string; userId: string }) {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: payload.documentId } });

  await prisma.document.update({
    where: { id: doc.id },
    data: { scanStatus: "SCANNING" },
  });

  let buffer: Buffer;
  try {
    buffer = await fileStore.readQuarantine(doc.objectKey);
  } catch {
    await prisma.document.update({
      where: { id: doc.id },
      data: { scanStatus: "REJECTED", extractionStatus: "FAILED" },
    });
    return;
  }

  const contentHash = createHash("sha256").update(buffer).digest("hex");
  const scan = scanDocumentBuffer(buffer, doc.mimeType, contentHash);

  if (scan.status === "REJECTED") {
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        scanStatus: "REJECTED",
        extractionStatus: "FAILED",
        contentHash,
      },
    });
    logger.warn("Document rejected", { documentId: doc.id, code: scan.code });
    return;
  }

  const protectedKey = await fileStore.promoteToProtected(doc.objectKey, buffer);

  await prisma.document.update({
    where: { id: doc.id },
    data: {
      scanStatus: "CLEAN",
      contentHash,
      objectKey: protectedKey,
      pages: scan.pages,
      extractionStatus: "PROCESSING",
    },
  });

  const text = extractTextFromBuffer(buffer, scan.detectedMime);
  const aiResult = await aiGateway.runResumeExtract(text);

  const route = await prisma.aiTaskRoute.findFirst({
    where: { taskType: "RESUME_EXTRACTION", status: "PUBLISHED" },
    include: { provider: true },
  });

  let aiRunId: string | undefined;
  if (route) {
    const run = await prisma.aiRun.create({
      data: {
        routeId: route.id,
        userId: payload.userId,
        taskType: "RESUME_EXTRACT",
        status: aiResult.status,
        inputHash: createHash("sha256").update(text).digest("hex"),
        outputHash:
          aiResult.status === "COMPLETED"
            ? createHash("sha256").update(JSON.stringify(aiResult.value)).digest("hex")
            : undefined,
        errorCode: aiResult.status === "FAILED" ? aiResult.code : undefined,
      },
    });
    aiRunId = run.id;
  }

  if (aiResult.status !== "COMPLETED") {
    await prisma.document.update({
      where: { id: doc.id },
      data: { extractionStatus: "FAILED" },
    });
    return;
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { extractionStatus: "COMPLETE" },
  });

  const versions = await prisma.resumeVersion.findMany({ where: { documentId: doc.id } });
  for (const version of versions) {
    await prisma.resumeVersion.update({
      where: { id: version.id },
      data: {
        extractedText: text.slice(0, 50000),
        extractionStatus: "COMPLETE",
        extractionData: {
          ...aiResult.value,
          aiRunId,
          warnings: aiResult.warnings,
        },
      },
    });
  }

  logger.info("Document processed", { documentId: doc.id, aiRunId });
}

async function processApplicationSubmit(payload: {
  applicationId: string;
  userId: string;
  operationKey: string;
}) {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: payload.applicationId },
    include: { job: true },
  });

  const domain = app.job?.domain ?? "mock-ats.applyflow.local";
  const policy = await prisma.domainPolicy.findFirst({
    where: { domain },
  });

  if (policy?.killSwitchActive) {
    await prisma.application.update({
      where: { id: payload.applicationId },
      data: { state: "FAILED_FINAL", nextAction: "KILL_SWITCH_ACTIVE" },
    });
    await prisma.quotaLedgerEntry.create({
      data: {
        userId: payload.userId,
        applicationId: payload.applicationId,
        entryType: "RELEASE",
        units: 1,
        operationKey: `${payload.operationKey}:release`,
        reasonCode: "KILL_SWITCH",
        actorType: "SYSTEM",
      },
    });
    return;
  }

  await prisma.application.update({
    where: { id: payload.applicationId },
    data: { state: "RUNNING" },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: payload.applicationId,
      eventType: "RUNNING",
      actorType: "SYSTEM",
    },
  });

  await new Promise((r) => setTimeout(r, 300));

  const fingerprint = app.job?.fingerprint ?? "";
  const scenario = fingerprint.includes("scenario:otp")
    ? "OTP"
    : fingerprint.includes("scenario:captcha")
      ? "CAPTCHA"
      : fingerprint.includes("scenario:uncertain")
        ? "UNCERTAIN"
        : fingerprint.includes("scenario:final-failure")
          ? "FINAL_FAILURE"
          : "SUCCESS";

  if (scenario === "OTP") {
    await prisma.application.update({
      where: { id: payload.applicationId },
      data: {
        state: "WAITING_FOR_USER",
        nextAction: "COMPLETE_OTP",
        nextActionDetail: { safeMessage: "Enter the one-time code on the employer site. ApplyFlow cannot bypass OTP." },
      },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: payload.applicationId,
        eventType: "WAITING_FOR_USER",
        actorType: "SYSTEM",
        metadata: { reason: "OTP_REQUIRED" },
      },
    });
    return;
  }

  if (scenario === "CAPTCHA") {
    await prisma.application.update({
      where: { id: payload.applicationId },
      data: {
        state: "WAITING_FOR_USER",
        nextAction: "COMPLETE_CAPTCHA",
        nextActionDetail: { safeMessage: "Complete the CAPTCHA on the employer site manually." },
      },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: payload.applicationId,
        eventType: "WAITING_FOR_USER",
        actorType: "SYSTEM",
        metadata: { reason: "CAPTCHA_REQUIRED" },
      },
    });
    return;
  }

  if (scenario === "FINAL_FAILURE") {
    await prisma.quotaLedgerEntry.create({
      data: {
        userId: payload.userId,
        applicationId: payload.applicationId,
        entryType: "RELEASE",
        units: 1,
        operationKey: `${payload.operationKey}:release`,
        reasonCode: "SUBMIT_FAILED",
        actorType: "SYSTEM",
      },
    });
    await prisma.application.update({
      where: { id: payload.applicationId },
      data: { state: "FAILED_FINAL", nextAction: "REVIEW_AND_RETRY" },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: payload.applicationId,
        eventType: "FAILED_FINAL",
        actorType: "SYSTEM",
      },
    });
    return;
  }

  if (scenario === "UNCERTAIN") {
    await prisma.application.update({
      where: { id: payload.applicationId },
      data: { state: "SUBMISSION_UNCERTAIN", nextAction: "VERIFY_SUBMISSION" },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: payload.applicationId,
        eventType: "SUBMISSION_UNCERTAIN",
        actorType: "SYSTEM",
      },
    });
    await new Promise((r) => setTimeout(r, 500));
    await completeSuccessfulSubmit(payload);
    return;
  }

  await completeSuccessfulSubmit(payload);
}

async function completeSuccessfulSubmit(payload: {
  applicationId: string;
  userId: string;
  operationKey: string;
}) {
  const period = await prisma.entitlementPeriod.findFirst({
    where: { userId: payload.userId, status: "ACTIVE" },
  });

  await prisma.quotaLedgerEntry.create({
    data: {
      userId: payload.userId,
      entitlementPeriodId: period?.id,
      applicationId: payload.applicationId,
      entryType: "CONSUME",
      units: 1,
      operationKey: payload.operationKey,
      reasonCode: "APPLICATION_SUBMITTED",
      actorType: "SYSTEM",
    },
  });

  await prisma.application.update({
    where: { id: payload.applicationId },
    data: {
      state: "SUBMITTED",
      submittedAt: new Date(),
      evidenceLevel: "RECEIPT_VERIFIED",
      nextAction: null,
    },
  });

  await prisma.submissionEvidence.create({
    data: {
      applicationId: payload.applicationId,
      receiptId: `mock-receipt-${payload.applicationId}`,
      finalUrl: `https://mock-ats.applyflow.local/applications/${payload.applicationId}`,
      evidenceLevel: "RECEIPT_VERIFIED",
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: payload.applicationId,
      eventType: "SUBMITTED",
      actorType: "SYSTEM",
      metadata: { receiptId: `mock-receipt-${payload.applicationId}` },
    },
  });

  await prisma.connectorRun.create({
    data: {
      applicationId: payload.applicationId,
      connectorId: "00000000-0000-4000-8000-000000000002",
      operationKey: payload.operationKey,
      state: "SUCCEEDED",
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  logger.info("Application submitted", { applicationId: payload.applicationId });
}

async function processOutboxEvent(event: {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
}) {
  if (event.eventType === "document.process") {
    await processDocumentEvent(event.payload as { documentId: string; userId: string });
    return;
  }

  if (event.eventType === "application.submit") {
    await processApplicationSubmit(
      event.payload as { applicationId: string; userId: string; operationKey: string },
    );
  }
}

async function pollOutbox() {
  const events = await prisma.outboxEvent.findMany({
    where: { state: "PENDING" },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    try {
      await processOutboxEvent({
        id: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      });
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { state: "PROCESSED", processedAt: new Date() },
      });
    } catch (err) {
      logger.error("Failed to process outbox event", { eventId: event.id, error: String(err) });
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { state: "FAILED", attempts: event.attempts + 1 },
      });
    }
  }
}

async function main() {
  logger.info("Worker started");
  await fileStore.ensureReady();
  await prisma.$connect();

  setInterval(() => {
    pollOutbox().catch((err) => logger.error("Poll error", { error: String(err) }));
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  logger.error("Worker failed", { error: String(err) });
  process.exit(1);
});
