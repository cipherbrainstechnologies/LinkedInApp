import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";

@Controller("profile")
@UseGuards(AuthGuard)
class ProfileController {
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
  async updateProfile(@CurrentUserId() userId: string, @Body() body: { summary?: string; noticePeriodDays?: number }) {
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
    @Body() body: { employer: string; title: string; isCurrent?: boolean; description?: string },
  ) {
    return this.prisma.client.experience.create({
      data: { userId, ...body, confirmationState: "CONFIRMED" },
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
}

@Module({ controllers: [ProfileController] })
export class ProfileModule {}
