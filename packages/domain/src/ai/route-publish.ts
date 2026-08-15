export const AI_ROUTE_MIN_EVAL_SCORE = 0.75;

export type RoutePublishInput = {
  evalScore: number;
  minScore?: number;
};

export function canPublishAiRoute(input: RoutePublishInput): { allowed: boolean; code?: string } {
  const min = input.minScore ?? AI_ROUTE_MIN_EVAL_SCORE;
  if (input.evalScore < min) {
    return { allowed: false, code: "EVAL_THRESHOLD_FAILED" };
  }
  return { allowed: true };
}
