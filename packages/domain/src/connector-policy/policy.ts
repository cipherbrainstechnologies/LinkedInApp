export type DomainCapability =
  | "DISCOVER"
  | "IMPORT_PUBLIC_JOB"
  | "EXTRACT_PUBLIC_JOB"
  | "PREFILL"
  | "CREATE_ACCOUNT"
  | "UPLOAD_RESUME"
  | "ANSWER_SCREENING"
  | "SUBMIT"
  | "VERIFY"
  | "STATUS_SYNC";

export type ExecutionMode = "AUTO" | "CONFIRM_EACH" | "ASSISTED" | "TRACK_ONLY";

export type DomainPolicyCheck = {
  domain: string;
  capabilities: DomainCapability[];
  mode: ExecutionMode;
  enabled: boolean;
  killSwitchActive: boolean;
};

export function resolveExecutionMode(
  policy: DomainPolicyCheck,
  requestedMode?: ExecutionMode,
): ExecutionMode {
  if (policy.killSwitchActive || !policy.enabled) {
    return "TRACK_ONLY";
  }

  if (!policy.capabilities.includes("SUBMIT")) {
    return policy.capabilities.includes("PREFILL") ? "ASSISTED" : "TRACK_ONLY";
  }

  if (requestedMode === "AUTO" && policy.capabilities.includes("SUBMIT")) {
    return "AUTO";
  }

  return requestedMode ?? "CONFIRM_EACH";
}

export function isLinkedInDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

export function blockedUrlReason(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "0.0.0.0" ||
      host.endsWith(".internal") ||
      host === "metadata.google.internal"
    ) {
      return "URL resolves to a private or unsafe destination.";
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "Only HTTP and HTTPS URLs are supported.";
    }

    return null;
  } catch {
    return "Invalid URL format.";
  }
}
