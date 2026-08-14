import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { validateOnboardingCompletion } from "@applyflow/domain";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";

@Controller("onboarding")
@UseGuards(AuthGuard)
class OnboardingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getOnboarding(@CurrentUserId() userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    const profile = await this.prisma.client.candidateProfile.findUnique({ where: { userId } });
    const targets = await this.prisma.client.jobTarget.count({ where: { userId } });
    const activeResume = await this.prisma.client.resume.findFirst({ where: { userId, isActive: true } });
    const consent = await this.prisma.client.consent.findFirst({
      where: { userId, purpose: "ONBOARDING", decision: "GRANTED" },
    });

    return {
      path: user.onboardingPath,
      state: user.onboardingState,
      step: user.onboardingStep,
      progress: {
        hasPath: !!user.onboardingPath,
        hasContact: !!profile,
        hasTargets: targets > 0,
        hasActiveResume: !!activeResume,
        hasConsent: !!consent,
      },
    };
  }

  @Put("path")
  async setPath(@CurrentUserId() userId: string, @Body() body: { path: "EXPERIENCED" | "FRESHER" }) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        onboardingPath: body.path,
        onboardingState: "IN_PROGRESS",
        onboardingStep: "contact",
      },
    });

    await this.prisma.client.candidateProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return { path: body.path };
  }

  @Put("contact")
  async setContact(
    @CurrentUserId() userId: string,
    @Body() body: { preferredName: string; legalName?: string },
  ) {
    await this.prisma.client.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredName: body.preferredName,
        legalName: body.legalName,
      },
      update: {
        preferredName: body.preferredName,
        legalName: body.legalName,
      },
    });

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { onboardingStep: "targets" },
    });

    return { saved: true };
  }

  @Put("targets")
  async setTargets(
    @CurrentUserId() userId: string,
    @Body() body: { titles: string[]; locations?: string[]; remoteModes?: string[] },
  ) {
    await this.prisma.client.jobTarget.deleteMany({ where: { userId } });
    await this.prisma.client.jobTarget.createMany({
      data: body.titles.map((title, i) => ({
        userId,
        title,
        priority: i,
      })),
    });

    if (body.locations || body.remoteModes) {
      await this.prisma.client.candidatePreference.upsert({
        where: { userId },
        create: {
          userId,
          locations: body.locations ?? [],
          remoteModes: body.remoteModes ?? [],
        },
        update: {
          locations: body.locations ?? [],
          remoteModes: body.remoteModes ?? [],
        },
      });
    }

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { onboardingStep: "resume" },
    });

    return { saved: true, count: body.titles.length };
  }

  @Post("consent")
  async grantConsent(@CurrentUserId() userId: string) {
    await this.prisma.client.consent.create({
      data: {
        userId,
        purpose: "ONBOARDING",
        scopeType: "USER",
        scopeId: userId,
        copyVersion: "1.0",
        decision: "GRANTED",
        grantedAt: new Date(),
      },
    });
    return { granted: true };
  }

  @Post("complete")
  async complete(@CurrentUserId() userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    const experiences = await this.prisma.client.experience.count({ where: { userId } });
    const educations = await this.prisma.client.education.count({ where: { userId } });
    const targets = await this.prisma.client.jobTarget.count({ where: { userId } });
    const prefs = await this.prisma.client.candidatePreference.findUnique({ where: { userId } });
    const activeResume = await this.prisma.client.resume.findFirst({ where: { userId, isActive: true } });
    const consent = await this.prisma.client.consent.findFirst({
      where: { userId, purpose: "ONBOARDING", decision: "GRANTED" },
    });
    const primaryEmail = await this.prisma.client.email.findFirst({
      where: { userId, isPrimary: true, verified: true },
    });

    const blockers = validateOnboardingCompletion({
      onboardingState: user.onboardingState,
      hasVerifiedEmail: !!primaryEmail,
      hasContact: !!(await this.prisma.client.candidateProfile.findUnique({ where: { userId } }))?.preferredName,
      hasTargetTitle: targets > 0,
      hasLocationPreference: (prefs?.locations?.length ?? 0) > 0 || (prefs?.remoteModes?.length ?? 0) > 0,
      hasActiveResume: !!activeResume,
      hasRequiredConsent: !!consent,
      hasUnconfirmedRequiredFields: false,
      path: user.onboardingPath as "EXPERIENCED" | "FRESHER" | null,
      experienceCount: experiences,
      educationCount: educations,
    });

    if (blockers.length > 0) {
      return { completed: false, blockers };
    }

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { onboardingState: "COMPLETED", onboardingStep: null },
    });

    return { completed: true, blockers: [] };
  }
}

@Module({ controllers: [OnboardingController] })
export class OnboardingModule {}
