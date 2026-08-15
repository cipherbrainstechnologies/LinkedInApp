export type ScreeningAnswer = {
  questionKey: string;
  confirmationState: string;
  answerValue: string;
};

export type SubmitBlocker = {
  code: string;
  message: string;
  field?: string;
};

export function validateApplicationSubmit(answers: ScreeningAnswer[]): SubmitBlocker[] {
  const blockers: SubmitBlocker[] = [];

  const unconfirmed = answers.filter((a) => a.confirmationState !== "CONFIRMED");
  if (unconfirmed.length > 0) {
    blockers.push({
      code: "ANSWERS_NEED_CONFIRMATION",
      field: "answers",
      message: "Confirm all screening answers before submitting.",
    });
  }

  const emptyRequired = answers.filter((a) => !a.answerValue?.trim());
  if (emptyRequired.length > 0) {
    blockers.push({
      code: "ANSWERS_INCOMPLETE",
      field: "answers",
      message: "Provide answers for all required screening questions.",
    });
  }

  return blockers;
}

export const DEFAULT_SCREENING_QUESTIONS = [
  {
    questionKey: "why_apply",
    questionText: "Why do you want this role?",
    answerType: "TEXT",
    sensitivity: "STANDARD",
  },
  {
    questionKey: "salary_expectation",
    questionText: "What is your salary expectation?",
    answerType: "TEXT",
    sensitivity: "SENSITIVE",
  },
  {
    questionKey: "work_authorization",
    questionText: "Are you authorized to work in this country?",
    answerType: "TEXT",
    sensitivity: "PROTECTED",
  },
] as const;
