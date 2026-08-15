import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { scanDocumentBuffer } from "./scan.js";

describe("scanDocumentBuffer", () => {
  it("accepts valid PDF magic bytes", () => {
    const buf = Buffer.from("%PDF-1.4 test content");
    const hash = createHash("sha256").update(buf).digest("hex");
    const result = scanDocumentBuffer(buf, "application/pdf", hash);
    expect(result.status).toBe("CLEAN");
  });

  it("rejects MIME mismatch", () => {
    const buf = Buffer.from("not a pdf");
    const hash = createHash("sha256").update(buf).digest("hex");
    const result = scanDocumentBuffer(buf, "application/pdf", hash);
    expect(result.status).toBe("REJECTED");
    if (result.status === "REJECTED") expect(result.code).toBe("MIME_MISMATCH");
  });

  it("rejects EICAR test pattern", () => {
    const buf = Buffer.from("%PDF-1.4 EICAR-STANDARD-ANTIVIRUS-TEST-FILE");
    const hash = createHash("sha256").update(buf).digest("hex");
    const result = scanDocumentBuffer(buf, "application/pdf", hash);
    expect(result.status).toBe("REJECTED");
    if (result.status === "REJECTED") expect(result.code).toBe("SCAN_FAILED");
  });
});
