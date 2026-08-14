import { describe, expect, it } from "vitest";
import { calculateAvailableQuota, canReserveQuota } from "./ledger.js";

describe("quota ledger", () => {
  it("calculates available quota from entries", () => {
    const entries = [
      { entryType: "GRANT" as const, units: 5, operationKey: "grant-1" },
      { entryType: "CONSUME" as const, units: 2, operationKey: "consume-1" },
      { entryType: "RESERVE" as const, units: 1, operationKey: "reserve-1" },
    ];
    expect(calculateAvailableQuota(entries)).toBe(2);
    expect(canReserveQuota(entries, 2)).toBe(true);
    expect(canReserveQuota(entries, 3)).toBe(false);
  });

  it("never returns negative available quota", () => {
    const entries = [
      { entryType: "GRANT" as const, units: 1, operationKey: "grant-1" },
      { entryType: "CONSUME" as const, units: 5, operationKey: "consume-1" },
    ];
    expect(calculateAvailableQuota(entries)).toBe(0);
  });
});
