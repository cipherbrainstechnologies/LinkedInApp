"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PipelineHero,
  Skeleton,
} from "@applyflow/ui-web";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";

type Resume = {
  id: string;
  name: string;
  isActive: boolean;
  versions: Array<{ id: string; extractionStatus: string }>;
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("My Resume");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extraction, setExtraction] = useState<Record<string, unknown> | null>(null);

  function load() {
    setLoading(true);
    api<Resume[]>("/resumes")
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadResume() {
    setUploading(true);
    setStatus("Creating upload intent…");
    try {
      const sampleText =
        "%PDF-1.4\n(Jane Doe)\n(Software Engineer at TechCorp)\n(Skills: TypeScript PostgreSQL React)\n";
      const samplePdf = btoa(sampleText);

      const intent = await api<{ documentId: string }>("/documents/upload-intents", {
        method: "POST",
        json: {
          filename: "resume.pdf",
          mimeType: "application/pdf",
          sizeBytes: samplePdf.length,
        },
      });

      setStatus("Uploading…");
      await api(`/documents/${intent.documentId}/upload`, {
        method: "POST",
        json: { contentBase64: samplePdf },
      });

      setStatus("Scanning and extracting (draft until you confirm)…");
      await api(`/documents/${intent.documentId}/complete`, { method: "POST" });

      let ready = false;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const st = await api<{ ready: boolean; scanStatus: string; extractionStatus: string }>(
          `/documents/${intent.documentId}/status`,
        );
        setStatus(`Scan: ${st.scanStatus}, extraction: ${st.extractionStatus}`);
        if (st.ready) {
          ready = true;
          break;
        }
        if (st.scanStatus === "REJECTED") break;
      }

      if (!ready) {
        setStatus("Document not ready — check scan status or try again.");
        return;
      }

      const resume = await api<Resume>("/resumes", {
        method: "POST",
        json: { name, documentId: intent.documentId },
      });

      const versionId = resume.versions[0]?.id;
      if (versionId) {
        const ext = await api<Record<string, unknown>>(`/resume-versions/${versionId}/extraction`);
        setExtraction(ext);
        await api(`/resume-versions/${versionId}/review`, {
          method: "POST",
          json: {
            acceptedFields: ["preferredName"],
            edits: { preferredName: "Jane Doe" },
            applyToProfile: true,
          },
        });
        await api(`/resumes/${resume.id}/activate`, { method: "POST" });
        setStatus("Resume uploaded, reviewed, and activated.");
      }
      load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const active = resumes.find((r) => r.isActive);

  return (
    <CandidatePage>
      <PageHeader
        title="Resumes & profile source"
        description="One active resume powers matching and applications. AI extraction stays a draft until you confirm."
      />

      <Card highlight>
        <h2 className="af-h2">Active resume</h2>
        {loading ? (
          <Skeleton lines={2} />
        ) : active ? (
          <p>
            <strong>{active.name}</strong>
            <Badge variant="success">Active</Badge>
            <span className="af-muted"> — used for new applications</span>
          </p>
        ) : (
          <p className="af-muted">No active resume. Upload or activate one before applying.</p>
        )}
      </Card>

      <Card>
        <h2 className="af-h2">Upload demo resume</h2>
        <p className="af-muted">
          PDF only in demo. Max size enforced server-side. Extracted fields require your review before profile
          updates.
        </p>
        <label className="af-stack" style={{ marginTop: "var(--space-md)", maxWidth: "320px" }}>
          <span className="af-muted">Resume label</span>
          <input
            id="resume-name"
            className="af-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="af-btn af-btn-primary"
          style={{ marginTop: "var(--space-md)" }}
          onClick={uploadResume}
          disabled={uploading}
        >
          {uploading ? "Processing…" : "Upload demo PDF"}
        </button>
        {status && (
          <div style={{ marginTop: "var(--space-md)" }}>
            <Alert variant="info" role="status">{status}</Alert>
          </div>
        )}
      </Card>

      {extraction && (
        <Card>
          <h2 className="af-h2">Extraction review (draft)</h2>
          <Alert variant="warning">
            AI-extracted data is not confirmed until you accept fields in onboarding or resume review.
          </Alert>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", marginTop: "var(--space-md)" }}>
            {JSON.stringify(extraction.extractionData, null, 2)}
          </pre>
        </Card>
      )}

      <h2 className="af-h2">Your resumes</h2>
      {loading ? (
        <Card><Skeleton lines={3} /></Card>
      ) : resumes.length === 0 ? (
        <EmptyState
          illustration={<PipelineHero />}
          title="No resumes yet"
          description="Upload a resume to unlock better matches and faster application prep."
          action={
            <button type="button" className="af-btn af-btn-primary" onClick={uploadResume} disabled={uploading}>
              Upload demo PDF
            </button>
          }
        />
      ) : (
        <ul className="af-job-list">
          {resumes.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="af-row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{r.name}</strong>
                    {r.isActive && <Badge variant="success">Active</Badge>}
                    <p className="af-muted" style={{ margin: "var(--space-xs) 0 0" }}>
                      {r.versions.length} version{r.versions.length === 1 ? "" : "s"} · extraction{" "}
                      {r.versions[0]?.extractionStatus ?? "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </CandidatePage>
  );
}
