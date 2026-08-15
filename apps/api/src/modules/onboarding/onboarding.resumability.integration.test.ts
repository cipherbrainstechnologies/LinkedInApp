import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@applyflow/db";
import { OnboardingController } from "../onboarding/onboarding.module.js";
import { PrismaService } from "../../platform/prisma.service.js";

describe("ONB-04 onboarding resumability", () => {
  let controller: OnboardingController;
  let userId: string;

  beforeAll(async () => {
    const prismaService = new PrismaService();
    await prismaService.onModuleInit();
    controller = new OnboardingController(prismaService);

    const user = await prisma.user.create({ data: { status: "ACTIVE" } });
    userId = user.id;
    await prisma.email.create({
      data: {
        userId,
        displayValue: "resume.test@demo.applyflow.local",
        valueHash: "hash",
        verified: true,
        isPrimary: true,
        verifiedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.consent.deleteMany({ where: { userId } });
    await prisma.jobTarget.deleteMany({ where: { userId } });
    await prisma.candidateProfile.deleteMany({ where: { userId } });
    await prisma.email.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("restores saved path, contact, and step after interruption", async () => {
    await controller.setPath(userId, { path: "FRESHER" });
    await controller.setContact(userId, { preferredName: "Resume Test" });
    await controller.setTargets(userId, {
      titles: ["Junior Developer", "Associate Engineer"],
      locations: ["Bangalore"],
      remoteModes: ["REMOTE"],
    });

    const snapshot = await controller.getOnboarding(userId);
    expect(snapshot.path).toBe("FRESHER");
    expect(snapshot.saved.preferredName).toBe("Resume Test");
    expect(snapshot.saved.targets).toEqual(["Junior Developer", "Associate Engineer"]);
    expect(snapshot.step).toBe("education");
    expect(snapshot.progress.hasTargets).toBe(true);
  });
});
