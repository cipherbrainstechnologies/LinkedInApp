import { detectMimeFromBuffer, MAX_FILE_BYTES, MAX_PAGES } from "./mime.js";

export type ScanResult =
  | { status: "CLEAN"; detectedMime: string; contentHash: string; pages?: number }
  | { status: "REJECTED"; reason: string; code: string };

export function scanDocumentBuffer(
  buffer: Buffer,
  declaredMime: string,
  contentHash: string,
): ScanResult {
  if (buffer.length > MAX_FILE_BYTES) {
    return { status: "REJECTED", reason: "File exceeds maximum size.", code: "FILE_TOO_LARGE" };
  }

  const mimeCheck = detectMimeFromBuffer(buffer, declaredMime);
  if (!mimeCheck.valid) {
    return {
      status: "REJECTED",
      reason: mimeCheck.reason ?? "Invalid file type.",
      code: "MIME_MISMATCH",
    };
  }

  // Mock virus scan: reject known hostile patterns in demo fixtures
  const textSample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8");
  if (textSample.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
    return { status: "REJECTED", reason: "File failed security scan.", code: "SCAN_FAILED" };
  }

  // Rough page estimate for PDF (count /Page markers)
  let pages: number | undefined;
  if (mimeCheck.mime === "application/pdf") {
    const pdfText = buffer.toString("latin1");
    pages = (pdfText.match(/\/Type\s*\/Page[^s]/g) ?? []).length || 1;
    if (pages > MAX_PAGES) {
      return { status: "REJECTED", reason: "Too many pages.", code: "TOO_MANY_PAGES" };
    }
  }

  return { status: "CLEAN", detectedMime: mimeCheck.mime, contentHash, pages };
}
