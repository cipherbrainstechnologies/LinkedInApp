import { describe, expect, it } from "vitest";
import { canPublishAiRoute, AI_ROUTE_MIN_EVAL_SCORE } from "./route-publish.js";

describe("AI-05 route publish eval threshold", () => {
  it("blocks publish when eval score is below threshold", () => {
    const result = canPublishAiRoute({ evalScore: 0.5 });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("EVAL_THRESHOLD_FAILED");
  });

  it("allows publish when eval score meets threshold", () => {
    const result = canPublishAiRoute({ evalScore: AI_ROUTE_MIN_EVAL_SCORE });
    expect(result.allowed).toBe(true);
  });
});
