import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getProfile(@CurrentUserId() userId: string) {
    const profile = await this.prisma.client.candidateProfile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { sortOrder: "asc" } },
        educations: { orderBy: { sortOrder: "asc" } },
        projects: { orderBy: { sortOrder: "asc" } },
        skills: true,
        jobTargets: true,
        preferences: true,
        workAuthorisations: true,
      },
    });

    return profile ?? { userId };
  }

  @Patch()
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() body: { summary?: string; noticePeriodDays?: number },
  ) {
    const profile = await this.prisma.client.candidateProfile.upsert({
      where: { userId },
      create: { userId, ...body },
      update: body,
    });
    return profile;
  }

  @Post("experiences")
  async addExperience(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      employer: string;
      title: string;
      isCurrent?: boolean;
      description?: string;
      source?: string;
      confirmationState?: string;
    },
  ) {
    return this.prisma.client.experience.create({
      data: {
        userId,
        employer: body.employer,
        title: body.title,
        isCurrent: body.isCurrent,
        description: body.description,
        source: body.source ?? "USER",
        confirmationState: body.confirmationState ?? "CONFIRMED",
      },
    });
  }

  @Post("educations")
  async addEducation(
    @CurrentUserId() userId: string,
    @Body() body: { institution: string; degree?: string; field?: string },
  ) {
    return this.prisma.client.education.create({
      data: { userId, ...body, confirmationState: "CONFIRMED" },
    });
  }

  @Post("projects")
  async addProject(
    @CurrentUserId() userId: string,
    @Body() body: { name: string; description?: string; url?: string },
  ) {
    return this.prisma.client.project.create({
      data: { userId, ...body, confirmationState: "CONFIRMED" },
    });
  }

  @Post("skills")
  async addSkill(@CurrentUserId() userId: string, @Body() body: { name: string; level?: string }) {
    return this.prisma.client.candidateSkill.create({
      data: { userId, ...body, confirmationState: "CONFIRMED" },
    });
  }

  @Post("work-authorisations")
  async addWorkAuthorisation(
    @CurrentUserId() userId: string,
    @Body() body: { country: string; status: string; sponsorshipRequired?: boolean },
  ) {
    const record = await this.prisma.client.workAuthorisation.create({
      data: {
        userId,
        country: body.country,
        status: body.status,
        sponsorshipRequired: body.sponsorshipRequired ?? false,
        confirmationState: "CONFIRMED",
      },
    });

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { onboardingStep: "consent" },
    });

    return record;
  }
}

@Module({ controllers: [ProfileController] })
export class ProfileModule {}
