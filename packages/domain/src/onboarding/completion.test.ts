import { describe, expect, it } from "vitest";
import { validateOnboardingCompletion } from "./completion.js";

const baseExperienced = {
  onboardingState: "IN_PROGRESS",
  hasVerifiedEmail: true,
  hasContact: true,
  hasTargetTitle: true,
  targetCount: 2,
  hasLocationPreference: true,
  hasActiveResume: true,
  hasRequiredConsent: true,
  hasWorkAuthorisation: true,
  hasUnconfirmedRequiredFields: false,
  path: "EXPERIENCED" as const,
  experienceCount: 1,
  educationCount: 0,
  projectCount: 0,
  skillCount: 0,
};

describe("ONB onboarding completion", () => {
  it("passes experienced path when requirements met", () => {
    expect(validateOnboardingCompletion(baseExperienced)).toEqual([]);
  });

  it("ONB-02 fresher completes without experience", () => {
    const blockers = validateOnboardingCompletion({
      ...baseExperienced,
      path: "FRESHER",
      experienceCount: 0,
      educationCount: 1,
      projectCount: 1,
      skillCount: 0,
      targetCount: 2,
    });
    expect(blockers).toEqual([]);
  });

  it("ONB-02 fresher requires education and project or skill", () => {
    const blockers = validateOnboardingCompletion({
      ...baseExperienced,
      path: "FRESHER",
      experienceCount: 0,
      educationCount: 0,
      projectCount: 0,
      skillCount: 0,
      targetCount: 2,
    });
    expect(blockers.map((b) => b.code)).toContain("EDUCATION_REQUIRED");
    expect(blockers.map((b) => b.code)).toContain("PROJECT_OR_SKILL_REQUIRED");
  });

  it("ONB-03 blocks unconfirmed extracted fields", () => {
    const blockers = validateOnboardingCompletion({
      ...baseExperienced,
      hasUnconfirmedRequiredFields: true,
    });
    expect(blockers.some((b) => b.code === "UNCONFIRMED_FIELDS")).toBe(true);
  });
});
