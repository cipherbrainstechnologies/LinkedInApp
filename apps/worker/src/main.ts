import { prisma } from "@applyflow/db";
import { createLogger } from "@applyflow/observability";

const logger = createLogger("worker");
const POLL_INTERVAL_MS = 2000;

async function processOutboxEvent(event: {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
}) {
  if (event.eventType !== "application.submit") return;

  const payload = event.payload as {
    applicationId: string;
    userId: string;
    operationKey: string;
  };

  const app = await prisma.application.findUniqueOrThrow({
    where: { id: payload.applicationId },
    include: { job: true },
  });

  const policy = await prisma.domainPolicy.findFirst({
    where: { domain: app.job?.domain ?? "mock-ats.applyflow.local" },
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

  // Simulate connector execution
  await new Promise((r) => setTimeout(r, 500));

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
  await prisma.$connect();

  setInterval(() => {
    pollOutbox().catch((err) => logger.error("Poll error", { error: String(err) }));
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  logger.error("Worker failed", { error: String(err) });
  process.exit(1);
});
