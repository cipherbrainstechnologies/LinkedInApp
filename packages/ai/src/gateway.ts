import { randomUUID } from "node:crypto";
import {
  type AiTaskName,
  type AiTaskResult,
  resumeExtractOutputSchema,
  type ResumeExtractOutput,
} from "./schemas.js";

const HOSTILE_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s*:\s*you\s+are/i,
  /execute\s+tool/i,
  /delete\s+all\s+users/i,
];

function containsHostileInstructions(text: string): boolean {
  return HOSTILE_PATTERNS.some((p) => p.test(text));
}

/** Deterministic mock extraction for demo — no external API calls. */
export function mockResumeExtract(text: string, runId = randomUUID()): AiTaskResult<ResumeExtractOutput> {
  if (containsHostileInstructions(text)) {
    // Treat as data: extract bounded fields only, ignore instructions
    const sanitized = text.replace(/ignore.+$/gim, "").slice(0, 5000);
    return completeMockExtract(sanitized, runId, ["Prompt injection content was ignored and bounded to schema."]);
  }

  if (text.trim().length < 10) {
    return {
      status: "FAILED",
      runId,
      retryable: false,
      code: "INSUFFICIENT_INPUT",
    };
  }

  return completeMockExtract(text, runId, []);
}

function completeMockExtract(
  text: string,
  runId: string,
  warnings: string[],
): AiTaskResult<ResumeExtractOutput> {
  const lines = text.split(/\n|\. /).map((l) => l.trim()).filter(Boolean);

  const nameLine = lines.find((l) => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l)) ?? "Candidate Name";
  const skills = ["TypeScript", "PostgreSQL", "React"].filter((s) =>
    text.toLowerCase().includes(s.toLowerCase()),
  );

  const output: ResumeExtractOutput = {
    preferredName: {
      value: nameLine.split(" ").slice(0, 2).join(" "),
      source: "resume_text",
      confidence: "MEDIUM",
      confirmed: false,
    },
    summary: {
      value: lines.slice(0, 2).join(" ").slice(0, 300),
      source: "resume_text",
      confidence: "LOW",
      confirmed: false,
    },
    experiences: text.toLowerCase().includes("engineer")
      ? [
          {
            employer: "Previous Company",
            title: "Software Engineer",
            description: {
              value: "Developed backend services.",
              source: "resume_text",
              confidence: "MEDIUM",
              confirmed: false,
            },
          },
        ]
      : [],
    educations: text.toLowerCase().includes("bachelor") || text.toLowerCase().includes("university")
      ? [{ institution: "State University", degree: "Bachelor", field: "Computer Science" }]
      : [],
    skills: skills.length ? skills : ["Communication"],
    warnings,
  };

  const parsed = resumeExtractOutputSchema.safeParse(output);
  if (!parsed.success) {
    return { status: "FAILED", runId, retryable: false, code: "SCHEMA_VALIDATION_FAILED" };
  }

  return { status: "COMPLETED", value: parsed.data, runId, warnings };
}

export type AiGatewayConfig = {
  mockEnabled: boolean;
  openaiEnabled: boolean;
  anthropicEnabled: boolean;
};

export class AiGateway {
  constructor(private readonly config: AiGatewayConfig) {}

  async runResumeExtract(text: string): Promise<AiTaskResult<ResumeExtractOutput>> {
    if (this.config.mockEnabled || !this.config.openaiEnabled && !this.config.anthropicEnabled) {
      return mockResumeExtract(text);
    }
    return { status: "FAILED", runId: randomUUID(), retryable: false, code: "PROVIDER_NOT_CONFIGURED" };
  }

  async run<T>(task: AiTaskName, input: string): Promise<AiTaskResult<T>> {
    if (task === "RESUME_EXTRACT") {
      return this.runResumeExtract(input) as Promise<AiTaskResult<T>>;
    }
    return {
      status: "FAILED",
      runId: randomUUID(),
      retryable: false,
      code: "TASK_NOT_IMPLEMENTED",
    };
  }
}
