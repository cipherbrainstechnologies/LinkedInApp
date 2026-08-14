import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { blockedUrlReason, isLinkedInDomain } from "@applyflow/domain";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";

@Controller("jobs")
@UseGuards(AuthGuard)
class JobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async searchJobs(
    @CurrentUserId() userId: string,
    @Query("q") q?: string,
    @Query("location") location?: string,
    @Query("remote") remote?: string,
    @Query("limit") limitStr?: string,
  ) {
    const limit = Math.min(parseInt(limitStr ?? "20", 10), 50);
    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (remote) {
      where.workMode = remote;
    }

    const jobs = await this.prisma.client.job.findMany({
      where,
      take: limit,
      orderBy: { postedAt: "desc" },
    });

    const hidden = await this.prisma.client.hiddenJob.findMany({
      where: { userId },
      select: { jobId: true },
    });
    const hiddenIds = new Set(hidden.map((h) => h.jobId));

    return {
      items: jobs.filter((j) => !hiddenIds.has(j.id)),
      total: jobs.length,
    };
  }

  @Get(":id")
  async getJob(@Param("id") id: string) {
    const job = await this.prisma.client.job.findUniqueOrThrow({ where: { id } });
    const assessment = await this.prisma.client.matchAssessment.findFirst({
      where: { jobId: id },
      orderBy: { generatedAt: "desc" },
    });

    return {
      job,
      match: assessment ?? {
        eligible: job.eligibilityBlockers.length === 0,
        strengths: ["Role title aligns with your targets"],
        gaps: job.eligibilityBlockers,
        unknowns: ["Final hiring decision depends on employer review"],
      },
    };
  }

  @Post("import")
  async importJob(@CurrentUserId() userId: string, @Body() body: { url: string }) {
    const blockReason = blockedUrlReason(body.url);
    if (blockReason) {
      return { success: false, error: "URL_BLOCKED", message: blockReason };
    }

    const linkedIn = isLinkedInDomain(body.url);
    const fingerprint = `url:${body.url}`;

    let job = await this.prisma.client.job.findFirst({ where: { fingerprint } });

    if (!job) {
      const domain = new URL(body.url).hostname;
      job = await this.prisma.client.job.create({
        data: {
          sourceUrl: body.url,
          title: linkedIn ? "LinkedIn Job (Assisted)" : "Imported Position",
          company: linkedIn ? "LinkedIn" : "External Company",
          location: "India",
          workMode: "HYBRID",
          employmentType: "FULL_TIME",
          description: linkedIn
            ? "This job was imported from a LinkedIn URL. ApplyFlow will assist you with preparation but cannot auto-submit to LinkedIn."
            : "Imported job posting.",
          fingerprint,
          policyMode: linkedIn ? "ASSISTED" : "AUTO",
          domain,
          eligibilityBlockers: [],
        },
      });

      await this.prisma.client.jobSnapshot.create({
        data: {
          jobId: job.id,
          snapshotData: { url: body.url, importedAt: new Date().toISOString() },
        },
      });
    }

    await this.prisma.client.jobImport.create({
      data: {
        userId,
        url: body.url,
        status: "SUCCESS",
        jobId: job.id,
      },
    });

    return {
      success: true,
      job,
      mode: linkedIn ? "ASSISTED" : job.policyMode,
      scraped: false,
    };
  }
}

@Module({ controllers: [JobsController] })
export class JobsModule {}
