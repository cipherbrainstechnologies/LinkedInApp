import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Module } from "@nestjs/common";
import { createHash } from "node:crypto";
import { ALLOWED_MIMES, MAX_FILE_BYTES } from "@applyflow/storage";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { PrismaService } from "../../platform/prisma.service.js";
import { StorageService } from "../../platform/storage.service.js";

@Controller()
@UseGuards(AuthGuard)
class ResumesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get("resumes")
  async listResumes(@CurrentUserId() userId: string) {
    return this.prisma.client.resume.findMany({
      where: { userId, status: { not: "DELETED" } },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Get("resumes/:id")
  async getResume(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.prisma.client.resume.findFirstOrThrow({
      where: { id, userId },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });
  }

  @Post("documents/upload-intents")
  async createUploadIntent(
    @CurrentUserId() userId: string,
    @Body() body: { filename: string; mimeType: string; sizeBytes: number },
  ) {
    if (!ALLOWED_MIMES.includes(body.mimeType as typeof ALLOWED_MIMES[number])) {
      throw new BadRequestException({
        code: "UNSUPPORTED_MIME",
        message: "Only PDF and DOCX are supported.",
      });
    }
    if (body.sizeBytes > MAX_FILE_BYTES) {
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        message: "Maximum file size is 10MB.",
      });
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
        extractionStatus: "PENDING",
      },
    });

    return {
      documentId: doc.id,
      uploadPath: `/v1/documents/${doc.id}/upload`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  @Post("documents/:id/upload")
  async uploadDocument(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: { contentBase64: string },
  ) {
    const doc = await this.prisma.client.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException();
    if (doc.scanStatus !== "PENDING") {
      throw new BadRequestException({ code: "ALREADY_PROCESSED", message: "Document already processed." });
    }

    const buffer = Buffer.from(body.contentBase64, "base64");
    if (buffer.length > MAX_FILE_BYTES) {
      throw new BadRequestException({ code: "FILE_TOO_LARGE", message: "File too large." });
    }

    await this.storage.getStore().writeQuarantine(doc.objectKey, buffer);

    return { documentId: id, bytesReceived: buffer.length, status: "UPLOADED" };
  }

  @Post("documents/:id/complete")
  async completeUpload(@CurrentUserId() userId: string, @Param("id") id: string) {
    const doc = await this.prisma.client.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException();

    await this.prisma.client.outboxEvent.create({
      data: {
        eventType: "document.process",
        aggregateId: id,
        payload: { documentId: id, userId },
      },
    });

    return {
      documentId: id,
      status: "QUEUED",
      message: "Scan and extraction queued. Poll /documents/:id/status.",
    };
  }

  @Get("documents/:id/status")
  async getDocumentStatus(@CurrentUserId() userId: string, @Param("id") id: string) {
    const doc = await this.prisma.client.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException();

    return {
      documentId: id,
      scanStatus: doc.scanStatus,
      extractionStatus: doc.extractionStatus,
      ready: doc.scanStatus === "CLEAN" && doc.extractionStatus === "COMPLETE",
      rejected: doc.scanStatus === "REJECTED",
    };
  }

  @Post("resumes")
  async createResume(
    @CurrentUserId() userId: string,
    @Body() body: { name: string; documentId: string },
  ) {
    const doc = await this.prisma.client.document.findFirst({ where: { id: body.documentId, userId } });
    if (!doc) throw new NotFoundException();
    if (doc.scanStatus !== "CLEAN") {
      throw new BadRequestException({
        code: "DOCUMENT_NOT_READY",
        message: "Document must pass scan before creating a resume.",
      });
    }

    const existing = await this.prisma.client.resume.count({ where: { userId } });

    const resume = await this.prisma.client.resume.create({
      data: {
        userId,
        name: body.name,
        versions: {
          create: {
            versionNumber: 1,
            documentId: body.documentId,
            extractionStatus: doc.extractionStatus,
          },
        },
      },
      include: { versions: true },
    });

    return resume;
  }

  @Get("resume-versions/:id/extraction")
  async getExtraction(@CurrentUserId() userId: string, @Param("id") id: string) {
    const version = await this.prisma.client.resumeVersion.findFirst({
      where: { id },
      include: { resume: true, document: true },
    });
    if (!version || version.resume.userId !== userId) throw new NotFoundException();

    return {
      resumeVersionId: id,
      extractionStatus: version.extractionStatus,
      extractedText: version.extractedText,
      extractionData: version.extractionData,
      reviewedAt: version.reviewedAt,
      document: {
        scanStatus: version.document.scanStatus,
        extractionStatus: version.document.extractionStatus,
      },
    };
  }

  @Post("resume-versions/:id/review")
  async reviewExtraction(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body()
    body: {
      acceptedFields?: string[];
      edits?: Record<string, string>;
      applyToProfile?: boolean;
    },
  ) {
    const version = await this.prisma.client.resumeVersion.findFirst({
      where: { id },
      include: { resume: true },
    });
    if (!version || version.resume.userId !== userId) throw new NotFoundException();

    const data = (version.extractionData as Record<string, unknown>) ?? {};
    const reviewed = {
      ...data,
      reviewedFields: body.acceptedFields ?? [],
      edits: body.edits ?? {},
      reviewedAt: new Date().toISOString(),
    };

    await this.prisma.client.resumeVersion.update({
      where: { id },
      data: {
        extractionData: reviewed,
        reviewedAt: new Date(),
        extractionStatus: "REVIEWED",
      },
    });

    if (body.applyToProfile && body.edits?.preferredName) {
      await this.prisma.client.candidateProfile.upsert({
        where: { userId },
        create: { userId, preferredName: body.edits.preferredName },
        update: { preferredName: body.edits.preferredName },
      });
    }

    const extraction = data as { experiences?: Array<{ employer: string; title: string }> };
    if (body.applyToProfile && extraction.experiences?.length) {
      for (const exp of extraction.experiences.slice(0, 3)) {
        await this.prisma.client.experience.create({
          data: {
            userId,
            employer: exp.employer,
            title: exp.title,
            confirmationState: "CONFIRMED",
            source: "RESUME_EXTRACTION",
          },
        });
      }
    }

    return { reviewed: true, resumeVersionId: id };
  }

  @Post("resumes/:id/activate")
  async activateResume(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.prisma.client.resume.findFirstOrThrow({ where: { id, userId } });
    const version = await this.prisma.client.resumeVersion.findFirst({
      where: { resumeId: id },
      orderBy: { versionNumber: "desc" },
    });

    if (!version) throw new BadRequestException({ code: "NO_VERSION", message: "Resume has no versions." });

    const doc = await this.prisma.client.document.findUnique({ where: { id: version.documentId } });
    if (doc?.scanStatus !== "CLEAN") {
      throw new BadRequestException({ code: "DOCUMENT_NOT_CLEAN", message: "Resume document not clean." });
    }

    await this.prisma.client.$transaction([
      this.prisma.client.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.client.resume.update({
        where: { id },
        data: { isActive: true, activeVersionId: version.id },
      }),
    ]);

    return { activated: true, resumeId: id, activeVersionId: version.id };
  }
}

@Module({ controllers: [ResumesController] })
export class ResumesModule {}
