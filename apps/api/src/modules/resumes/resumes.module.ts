import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";

@Controller()
@UseGuards(AuthGuard)
class ResumesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("resumes")
  async listResumes(@CurrentUserId() userId: string) {
    return this.prisma.client.resume.findMany({
      where: { userId, status: { not: "DELETED" } },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Post("documents/upload-intents")
  async createUploadIntent(
    @CurrentUserId() userId: string,
    @Body() body: { filename: string; mimeType: string; sizeBytes: number },
  ) {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(body.mimeType)) {
      return { error: "UNSUPPORTED_MIME", message: "Only PDF and DOCX are supported." };
    }
    if (body.sizeBytes > 10 * 1024 * 1024) {
      return { error: "FILE_TOO_LARGE", message: "Maximum file size is 10MB." };
    }

    const objectKey = `quarantine/${userId}/${crypto.randomUUID()}`;
    const doc = await this.prisma.client.document.create({
      data: {
        userId,
        objectKey,
        originalName: body.filename,
        contentHash: "pending",
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        scanStatus: "PENDING",
      },
    });

    return {
      documentId: doc.id,
      uploadUrl: `/v1/documents/${doc.id}/upload`,
      objectKey,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  @Post("documents/:id/complete")
  async completeUpload(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: { contentBase64?: string; textContent?: string },
  ) {
    const doc = await this.prisma.client.document.findFirstOrThrow({ where: { id, userId } });
    const content = body.textContent ?? body.contentBase64 ?? "";
    const hash = createHash("sha256").update(content).digest("hex");

    await this.prisma.client.document.update({
      where: { id },
      data: {
        contentHash: hash,
        scanStatus: "CLEAN",
        extractionStatus: "COMPLETE",
      },
    });

    return { documentId: id, scanStatus: "CLEAN", extractionStatus: "COMPLETE" };
  }

  @Post("resumes")
  async createResume(
    @CurrentUserId() userId: string,
    @Body() body: { name: string; documentId: string; extractedText?: string },
  ) {
    const resume = await this.prisma.client.resume.create({
      data: {
        userId,
        name: body.name,
        versions: {
          create: {
            versionNumber: 1,
            documentId: body.documentId,
            extractedText: body.extractedText,
            extractionStatus: "COMPLETE",
            extractionData: body.extractedText ? { rawText: body.extractedText } : undefined,
          },
        },
      },
      include: { versions: true },
    });

    return resume;
  }

  @Post("resumes/:id/activate")
  async activateResume(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.prisma.client.resume.findFirstOrThrow({ where: { id, userId } });
    const version = await this.prisma.client.resumeVersion.findFirst({
      where: { resumeId: id },
      orderBy: { versionNumber: "desc" },
    });

    await this.prisma.client.$transaction([
      this.prisma.client.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.client.resume.update({
        where: { id },
        data: {
          isActive: true,
          activeVersionId: version?.id,
        },
      }),
    ]);

    return { activated: true, resumeId: id, activeVersionId: version?.id };
  }
}

@Module({ controllers: [ResumesController] })
export class ResumesModule {}
