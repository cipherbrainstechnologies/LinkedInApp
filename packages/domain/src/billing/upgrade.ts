export type UpgradeProrationInput = {
  periodStartMs: number;
  periodEndMs: number;
  effectiveAtMs: number;
  oldPriceMinor: number;
  newPriceMinor: number;
  taxRate?: number;
};

export type UpgradeProrationQuote = {
  periodStartMs: number;
  periodEndMs: number;
  effectiveAtMs: number;
  unusedOldCreditMinor: number;
  remainingNewChargeMinor: number;
  subtotalDueMinor: number;
  taxMinor: number;
  dueNowMinor: number;
  nextRenewalMinor: number;
};

export type UpgradeQuotaInput = {
  currentLimit: number;
  newLimit: number;
  quotaUsed: number;
  quotaReserved?: number;
};

export type UpgradeQuotaResult = {
  quotaDelta: number;
  newLimit: number;
  quotaUsed: number;
  quotaReserved: number;
  newAvailable: number;
};

const MS_PER_SECOND = 1000;

function clampRemainingSeconds(
  periodStartMs: number,
  periodEndMs: number,
  effectiveAtMs: number,
): number {
  const periodSeconds = Math.max(1, Math.floor((periodEndMs - periodStartMs) / MS_PER_SECOND));
  const remainingSeconds = Math.floor((periodEndMs - effectiveAtMs) / MS_PER_SECOND);
  return Math.max(0, Math.min(periodSeconds, remainingSeconds));
}

export function calculateUpgradeProration(input: UpgradeProrationInput): UpgradeProrationQuote {
  const taxRate = input.taxRate ?? 0.18;
  const remainingSeconds = clampRemainingSeconds(
    input.periodStartMs,
    input.periodEndMs,
    input.effectiveAtMs,
  );
  const periodSeconds = Math.max(
    1,
    Math.floor((input.periodEndMs - input.periodStartMs) / MS_PER_SECOND),
  );

  const unusedOldCreditMinor = Math.round(
    (input.oldPriceMinor * remainingSeconds) / periodSeconds,
  );
  const remainingNewChargeMinor = Math.round(
    (input.newPriceMinor * remainingSeconds) / periodSeconds,
  );
  const subtotalDueMinor = remainingNewChargeMinor - unusedOldCreditMinor;
  const taxableBase = Math.max(0, subtotalDueMinor);
  const taxMinor = Math.round(taxableBase * taxRate);
  const dueNowMinor = Math.max(0, subtotalDueMinor + taxMinor);

  return {
    periodStartMs: input.periodStartMs,
    periodEndMs: input.periodEndMs,
    effectiveAtMs: input.effectiveAtMs,
    unusedOldCreditMinor,
    remainingNewChargeMinor,
    subtotalDueMinor,
    taxMinor,
    dueNowMinor,
    nextRenewalMinor: input.newPriceMinor,
  };
}

export function calculateUpgradeQuota(input: UpgradeQuotaInput): UpgradeQuotaResult {
  const quotaReserved = input.quotaReserved ?? 0;
  const quotaDelta = Math.max(0, input.newLimit - input.currentLimit);
  const newAvailable = Math.max(0, input.newLimit - input.quotaUsed - quotaReserved);

  return {
    quotaDelta,
    newLimit: input.newLimit,
    quotaUsed: input.quotaUsed,
    quotaReserved,
    newAvailable,
  };
}
