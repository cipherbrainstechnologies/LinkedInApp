export type DetectedMime = {
  mime: string;
  valid: boolean;
  reason?: string;
};

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // DOCX is zip-based

export function detectMimeFromBuffer(buffer: Buffer, declaredMime: string): DetectedMime {
  if (buffer.length < 4) {
    return { mime: declaredMime, valid: false, reason: "File too small to verify." };
  }

  const isPdf =
    buffer[0] === PDF_MAGIC[0] &&
    buffer[1] === PDF_MAGIC[1] &&
    buffer[2] === PDF_MAGIC[2] &&
    buffer[3] === PDF_MAGIC[3];

  const isZip =
    buffer[0] === ZIP_MAGIC[0] &&
    buffer[1] === ZIP_MAGIC[1] &&
    buffer[2] === ZIP_MAGIC[2] &&
    buffer[3] === ZIP_MAGIC[3];

  if (declaredMime === "application/pdf") {
    if (!isPdf) {
      return { mime: declaredMime, valid: false, reason: "MIME mismatch: not a valid PDF." };
    }
    return { mime: "application/pdf", valid: true };
  }

  if (declaredMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    if (!isZip) {
      return { mime: declaredMime, valid: false, reason: "MIME mismatch: not a valid DOCX." };
    }
    return { mime: declaredMime, valid: true };
  }

  return { mime: declaredMime, valid: false, reason: "Unsupported MIME type." };
}

export const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PAGES = 20;
