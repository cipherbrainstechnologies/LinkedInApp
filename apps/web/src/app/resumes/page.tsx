"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Resume = {
  id: string;
  name: string;
  isActive: boolean;
  versions: Array<{ id: string; extractionStatus: string }>;
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [name, setName] = useState("My Resume");
  const [status, setStatus] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Record<string, unknown> | null>(null);

  function load() {
    api<Resume[]>("/resumes").then(setResumes).catch(console.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadResume() {
    setStatus("Creating upload intent…");
    const sampleText = "%PDF-1.4\n(Jane Doe)\n(Software Engineer at TechCorp)\n(Skills: TypeScript PostgreSQL React)\n";
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

    setStatus("Queuing scan and extraction…");
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
      setStatus("Document not ready — check scan status.");
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
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Resumes</h1>
        <div className="card">
          <div className="form-group">
            <label htmlFor="resume-name">Resume name</label>
            <input id="resume-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={uploadResume}>
            Upload demo resume (PDF)
          </button>
          {status && <p role="status">{status}</p>}
        </div>
        {extraction && (
          <div className="card">
            <h2>Extraction review</h2>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
              {JSON.stringify(extraction.extractionData, null, 2)}
            </pre>
            <p><em>Fields require confirmation before profile write.</em></p>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {resumes.map((r) => (
            <li key={r.id} className="card">
              <strong>{r.name}</strong>
              {r.isActive && <span className="status-badge"> Active</span>}
              <br />
              <small>Versions: {r.versions.length}</small>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
