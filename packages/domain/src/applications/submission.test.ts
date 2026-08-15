import { describe, expect, it } from "vitest";
import { validateApplicationSubmit } from "./submission.js";

describe("APP-02/03 application submit validation", () => {
  it("blocks submit when answers need confirmation", () => {
    const blockers = validateApplicationSubmit([
      { questionKey: "q1", confirmationState: "NEEDS_CONFIRMATION", answerValue: "draft" },
    ]);
    expect(blockers.some((b) => b.code === "ANSWERS_NEED_CONFIRMATION")).toBe(true);
  });

  it("blocks submit when required answers are empty", () => {
    const blockers = validateApplicationSubmit([
      { questionKey: "q1", confirmationState: "CONFIRMED", answerValue: "" },
    ]);
    expect(blockers.some((b) => b.code === "ANSWERS_INCOMPLETE")).toBe(true);
  });
});
