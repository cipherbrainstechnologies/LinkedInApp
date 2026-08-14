export type OnboardingBlocker = {
  code: string;
  field?: string;
  message: string;
};

export type OnboardingCompletionInput = {
  onboardingState: string;
  hasVerifiedEmail: boolean;
  hasContact: boolean;
  hasTargetTitle: boolean;
  hasLocationPreference: boolean;
  hasActiveResume: boolean;
  hasRequiredConsent: boolean;
  hasUnconfirmedRequiredFields: boolean;
  path: "EXPERIENCED" | "FRESHER" | null;
  experienceCount: number;
  educationCount: number;
};

export function validateOnboardingCompletion(
  input: OnboardingCompletionInput,
): OnboardingBlocker[] {
  const blockers: OnboardingBlocker[] = [];

  if (!input.hasVerifiedEmail) {
    blockers.push({
      code: "EMAIL_NOT_VERIFIED",
      field: "email",
      message: "Verify your email before completing onboarding.",
    });
  }

  if (!input.hasContact) {
    blockers.push({
      code: "CONTACT_INCOMPLETE",
      field: "contact",
      message: "Complete your contact information.",
    });
  }

  if (!input.path) {
    blockers.push({
      code: "PATH_NOT_SELECTED",
      field: "path",
      message: "Select an onboarding path.",
    });
  }

  if (input.path === "FRESHER" && input.educationCount === 0) {
    blockers.push({
      code: "EDUCATION_REQUIRED",
      field: "education",
      message: "Add at least one education entry.",
    });
  }

  if (input.path === "EXPERIENCED" && input.experienceCount === 0) {
    blockers.push({
      code: "EXPERIENCE_REQUIRED",
      field: "experience",
      message: "Add at least one work experience or confirm your resume extraction.",
    });
  }

  if (!input.hasTargetTitle) {
    blockers.push({
      code: "TARGET_TITLE_REQUIRED",
      field: "targets",
      message: "Add at least one target job title.",
    });
  }

  if (!input.hasLocationPreference) {
    blockers.push({
      code: "LOCATION_PREFERENCE_REQUIRED",
      field: "preferences",
      message: "Set your location or remote work preference.",
    });
  }

  if (!input.hasActiveResume) {
    blockers.push({
      code: "ACTIVE_RESUME_REQUIRED",
      field: "resume",
      message: "Upload and activate a resume.",
    });
  }

  if (!input.hasRequiredConsent) {
    blockers.push({
      code: "CONSENT_REQUIRED",
      field: "consent",
      message: "Accept required consents.",
    });
  }

  if (input.hasUnconfirmedRequiredFields) {
    blockers.push({
      code: "UNCONFIRMED_FIELDS",
      message: "Review and confirm all extracted profile fields.",
    });
  }

  return blockers;
}
