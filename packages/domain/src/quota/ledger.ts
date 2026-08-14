export type QuotaEntryType =
  | "GRANT"
  | "RESERVE"
  | "RELEASE"
  | "CONSUME"
  | "REVERSE"
  | "EXPIRE"
  | "ADMIN_ADJUSTMENT"
  | "REFERRAL_GRANT";

export type QuotaLedgerEntry = {
  entryType: QuotaEntryType;
  units: number;
  operationKey: string;
};

export type QuotaSummary = {
  granted: number;
  reserved: number;
  consumed: number;
  reversed: number;
  expired: number;
  adminAdjusted: number;
};

export function calculateQuotaSummary(entries: QuotaLedgerEntry[]): QuotaSummary {
  const summary: QuotaSummary = {
    granted: 0,
    reserved: 0,
    consumed: 0,
    reversed: 0,
    expired: 0,
    adminAdjusted: 0,
  };

  for (const entry of entries) {
    switch (entry.entryType) {
      case "GRANT":
      case "REFERRAL_GRANT":
        summary.granted += entry.units;
        break;
      case "RESERVE":
        summary.reserved += entry.units;
        break;
      case "RELEASE":
        summary.reserved -= entry.units;
        break;
      case "CONSUME":
        summary.consumed += entry.units;
        break;
      case "REVERSE":
        summary.reversed += entry.units;
        break;
      case "EXPIRE":
        summary.expired += entry.units;
        break;
      case "ADMIN_ADJUSTMENT":
        summary.adminAdjusted += entry.units;
        break;
    }
  }

  return summary;
}

export function calculateAvailableQuota(entries: QuotaLedgerEntry[]): number {
  const s = calculateQuotaSummary(entries);
  const available =
    s.granted +
    s.reversed +
    s.adminAdjusted -
    s.consumed -
    s.expired -
    s.reserved;
  return Math.max(0, available);
}

export function canReserveQuota(entries: QuotaLedgerEntry[], units = 1): boolean {
  return calculateAvailableQuota(entries) >= units;
}
