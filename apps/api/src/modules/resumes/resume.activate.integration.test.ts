import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { PrismaService } from "../../platform/prisma.service.js";
import { StorageService } from "../../platform/storage.service.js";
import { ResumesController } from "./resumes.module.js";

async function seedResume(userId: string, name: string) {
  const doc = await prisma.document.create({
    data: {
      userId,
      objectKey: `test/${crypto.randomUUID()}`,
      originalName: `${name}.pdf`,
      contentHash: crypto.randomUUID(),
      mimeType: "application/pdf",
      sizeBytes: 1024,
      scanStatus: "CLEAN",
      extractionStatus: "COMPLETE",
    },
  });

  const resume = await prisma.resume.create({
    data: { userId, name, isActive: false },
  });

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId: resume.id,
      versionNumber: 1,
      documentId: doc.id,
      extractionStatus: "COMPLETE",
    },
  });

  return { resume, version, doc };
}

describe("RES-03 resume activation concurrency", () => {
  let controller: ResumesController;
  let userId: string;
  let resumeA: string;
  let resumeB: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    controller = new ResumesController(prismaService, {} as StorageService);

    const user = await prisma.user.create({ data: { status: "ACTIVE" } });
    userId = user.id;

    const a = await seedResume(userId, "Resume A");
    const b = await seedResume(userId, "Resume B");
    resumeA = a.resume.id;
    resumeB = b.resume.id;
  });

  afterAll(async () => {
    await prisma.resumeVersion.deleteMany({ where: { resume: { userId } } });
    await prisma.resume.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("keeps exactly one active resume under concurrent activation", async () => {
    await Promise.all([
      controller.activateResume(userId, resumeA),
      controller.activateResume(userId, resumeB),
      controller.activateResume(userId, resumeA),
      controller.activateResume(userId, resumeB),
    ]);

    const active = await prisma.resume.findMany({
      where: { userId, isActive: true },
    });

    expect(active.length).toBe(1);
    expect([resumeA, resumeB]).toContain(active[0]?.id);
    expect(active[0]?.activeVersionId).toBeTruthy();
  });

  it("switches active resume on a second activation", async () => {
    await controller.activateResume(userId, resumeA);
    await controller.activateResume(userId, resumeB);

    const active = await prisma.resume.findMany({
      where: { userId, isActive: true },
    });

    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe(resumeB);
  });
});
