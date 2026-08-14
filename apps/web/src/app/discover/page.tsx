"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  policyMode: string;
};

export default function DiscoverPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);

  function loadJobs() {
    api<{ items: Job[] }>(`/jobs?q=${encodeURIComponent(q)}`)
      .then((data) => setJobs(data.items))
      .catch(console.error);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleImport() {
    const result = await api<{ success: boolean; mode?: string; message?: string; error?: string }>(
      "/jobs/import",
      { method: "POST", json: { url: importUrl } },
    );
    if (result.success) {
      setImportResult(`Imported (${result.mode ?? "AUTO"} mode). No scraping occurred.`);
      loadJobs();
    } else {
      setImportResult(result.error ?? "Import failed");
    }
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Discover jobs</h1>
        <div className="card">
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input id="search" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={loadJobs}>Search</button>
        </div>
        <div className="card">
          <h2>Import job URL</h2>
          <div className="form-group">
            <label htmlFor="import-url">Job URL</label>
            <input
              id="import-url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://mock-ats.applyflow.local/jobs/123 or LinkedIn URL"
            />
          </div>
          <button className="btn btn-primary" onClick={handleImport}>Import</button>
          {importResult && <p className="alert alert-info" role="status">{importResult}</p>}
        </div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {jobs.map((job) => (
            <li key={job.id} className="card">
              <Link href={`/jobs/${job.id}`}>
                <strong>{job.title}</strong> at {job.company}
              </Link>
              <br />
              <small>{job.location} · {job.workMode} · {job.policyMode}</small>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
