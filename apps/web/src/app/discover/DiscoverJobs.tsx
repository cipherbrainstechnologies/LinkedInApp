"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Card,
  EmptyState,
  JobsEmptyIllustration,
  PageHeader,
  PolicyBadge,
  Skeleton,
} from "@applyflow/ui-web";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  policyMode: string;
};

const WORK_MODES = [
  { value: "", label: "Any work mode" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

export default function DiscoverJobs() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [remote, setRemote] = useState(searchParams.get("remote") ?? "");

  const [importUrl, setImportUrl] = useState("");
  const [importResult, setImportResult] = useState<{ type: "info" | "error"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const syncUrl = useCallback(
    (nextQ: string, nextLocation: string, nextRemote: string) => {
      const params = new URLSearchParams();
      if (nextQ) params.set("q", nextQ);
      if (nextLocation) params.set("location", nextLocation);
      if (nextRemote) params.set("remote", nextRemote);
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/discover?${qs}` : "/discover");
    },
    [],
  );

  const loadJobs = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (remote) params.set("remote", remote);

    api<{ items: Job[]; total: number }>(`/jobs?${params}`)
      .then((data) => {
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load jobs"))
      .finally(() => setLoading(false));
  }, [q, location, remote]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function applyFilters() {
    syncUrl(q, location, remote);
    loadJobs();
  }

  function clearFilters() {
    setQ("");
    setLocation("");
    setRemote("");
    syncUrl("", "", "");
    setLoading(true);
    api<{ items: Job[]; total: number }>("/jobs")
      .then((data) => {
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load jobs"))
      .finally(() => setLoading(false));
  }

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api<{ success: boolean; mode?: string; message?: string; error?: string }>(
        "/jobs/import",
        { method: "POST", json: { url: importUrl.trim() } },
      );
      if (result.success) {
        setImportResult({
          type: "info",
          text: `Imported (${result.mode ?? "AUTO"}). No scraping — assisted sources require your confirmation.`,
        });
        setImportUrl("");
        loadJobs();
      } else {
        setImportResult({ type: "error", text: result.error ?? "Import failed" });
      }
    } catch (e) {
      setImportResult({
        type: "error",
        text: e instanceof Error ? e.message : "Import failed",
      });
    } finally {
      setImporting(false);
    }
  }

  const hasFilters = q || location || remote;

  return (
    <CandidatePage>
      <PageHeader
        title="Find jobs"
        description="Search seeded roles or import a URL. Match scores and assisted boundaries are shown before you apply."
      />

      <Card>
        <div className="af-stack">
          <div className="af-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="af-stack" style={{ flex: "1 1 200px", minWidth: 0 }}>
              <span className="af-muted">Keywords</span>
              <input
                id="discover-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Role, company, skills…"
                className="af-input"
              />
            </label>
            <label className="af-stack" style={{ flex: "1 1 160px" }}>
              <span className="af-muted">Location</span>
              <input
                id="discover-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or region"
                className="af-input"
              />
            </label>
            <label className="af-stack" style={{ flex: "0 1 140px" }}>
              <span className="af-muted">Work mode</span>
              <select
                id="discover-remote"
                value={remote}
                onChange={(e) => setRemote(e.target.value)}
                className="af-input"
              >
                {WORK_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="af-btn af-btn-primary" onClick={applyFilters}>
              Search
            </button>
            {hasFilters && (
              <button type="button" className="af-btn af-btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="af-muted" role="status">
              Active filters: {[
                q && `keywords “${q}”`,
                location && `location “${location}”`,
                remote && WORK_MODES.find((m) => m.value === remote)?.label,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="af-h2">Import job URL</h2>
        <p className="af-muted">
          Paste a mock ATS or LinkedIn job URL. LinkedIn imports are always assisted — ApplyFlow prepares your
          application but does not auto-submit.
        </p>
        <div className="af-row" style={{ flexWrap: "wrap", marginTop: "var(--space-sm)" }}>
          <input
            id="import-url"
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://mock-ats.applyflow.local/jobs/…"
            className="af-input"
            style={{ flex: "1 1 280px" }}
          />
          <button
            type="button"
            className="af-btn af-btn-secondary"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
          >
            {importing ? "Importing…" : "Import URL"}
          </button>
        </div>
        {importResult && (
          <Alert variant={importResult.type === "error" ? "error" : "info"} role={importResult.type === "error" ? "alert" : "status"}>
            {importResult.text}
          </Alert>
        )}
      </Card>

      <div className="af-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-sm)" }}>
        <h2 className="af-h2" style={{ margin: 0 }}>
          Results
        </h2>
        {!loading && (
          <span className="af-muted" role="status">
            {total} job{total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <Alert variant="error" role="alert">{error}</Alert>}

      {loading ? (
        <Card><Skeleton lines={4} /></Card>
      ) : jobs.length === 0 ? (
        <EmptyState
          illustration={<JobsEmptyIllustration />}
          title="No matching jobs"
          description={
            hasFilters
              ? "Try broader keywords or clear filters to see all seeded roles."
              : "Seed data may be empty — run pnpm db:seed or import a job URL above."
          }
          action={
            hasFilters ? (
              <button type="button" className="af-btn af-btn-primary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link href="/help" className="af-btn af-btn-secondary">Open demo guide</Link>
            )
          }
        />
      ) : (
        <ul className="af-job-list">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card className="af-job-card">
                <Link href={`/jobs/${job.id}`} className="af-job-card" style={{ display: "block" }}>
                  <div className="af-job-card-header">
                    <h3 className="af-job-card-title">{job.title}</h3>
                    <PolicyBadge mode={job.policyMode} />
                  </div>
                  <p className="af-muted" style={{ margin: "0 0 var(--space-xs)" }}>{job.company}</p>
                  <div className="af-job-card-meta">
                    {job.location && <span>{job.location}</span>}
                    {job.workMode && <span>· {job.workMode.replace(/_/g, " ")}</span>}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </CandidatePage>
  );
}
