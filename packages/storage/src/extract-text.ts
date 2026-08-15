/** Deterministic text extraction for demo — real PDF/DOCX parsers in production. */
export function extractTextFromBuffer(buffer: Buffer, mime: string): string {
  if (mime === "application/pdf") {
    const raw = buffer.toString("latin1");
    const textParts = raw.match(/\(([^()\\]{2,200})\)/g) ?? [];
    const extracted = textParts
      .map((p) => p.slice(1, -1))
      .filter((t) => /[a-zA-Z]{2,}/.test(t))
      .join(" ");
    if (extracted.trim()) return extracted.trim();
    return raw.slice(0, 8000);
  }

  if (mime.includes("wordprocessingml")) {
    const raw = buffer.toString("utf8");
    const stripped = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.slice(0, 8000);
  }

  return buffer.toString("utf8").slice(0, 8000);
}
