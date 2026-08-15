import { describe, expect, it } from "vitest";
import { calculateUpgradeProration, calculateUpgradeQuota } from "./upgrade.js";

describe("calculateUpgradeProration", () => {
  it("computes remaining-period credit, charge, tax, and due now", () => {
    const periodStart = Date.parse("2026-08-01T00:00:00.000Z");
    const periodEnd = Date.parse("2026-08-31T00:00:00.000Z");
    const effectiveAt = Date.parse("2026-08-16T00:00:00.000Z");

    const quote = calculateUpgradeProration({
      periodStartMs: periodStart,
      periodEndMs: periodEnd,
      effectiveAtMs: effectiveAt,
      oldPriceMinor: 99900,
      newPriceMinor: 149900,
      taxRate: 0.18,
    });

    expect(quote.unusedOldCreditMinor).toBeGreaterThan(0);
    expect(quote.remainingNewChargeMinor).toBeGreaterThan(0);
    expect(quote.dueNowMinor).toBe(
      Math.max(0, quote.subtotalDueMinor + quote.taxMinor),
    );
    expect(quote.nextRenewalMinor).toBe(149900);
  });
});

describe("calculateUpgradeQuota (BILL-02)", () => {
  it("preserves usage and increases available by delta minus reservations", () => {
    const result = calculateUpgradeQuota({
      currentLimit: 50,
      newLimit: 100,
      quotaUsed: 20,
      quotaReserved: 0,
    });

    expect(result.quotaDelta).toBe(50);
    expect(result.quotaUsed).toBe(20);
    expect(result.newAvailable).toBe(80);
  });

  it("accounts for active reservations in available projection", () => {
    const result = calculateUpgradeQuota({
      currentLimit: 50,
      newLimit: 100,
      quotaUsed: 20,
      quotaReserved: 2,
    });

    expect(result.newAvailable).toBe(78);
  });
});
