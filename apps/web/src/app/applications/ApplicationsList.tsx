"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Card,
  EmptyState,
  PageHeader,
  PipelineHero,
  Skeleton,
  StatusBadge,
} from "@applyflow/ui-web";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";

type Application = {
  id: string;
  state: string;
  mode: string;
  job: { title: string; company: string };
  nextAction: string | null;
};

const STATE_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "WAITING_FOR_USER", label: "Waiting for you" },
  { value: "QUEUED", label: "Queued" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
];

export default function ApplicationsList() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    const query = params.toString();
    api<{ items: Application[] }>(`/applications${query ? `?${query}` : ""}`)
      .then((data) => setItems(data.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load applications"))
      .finally(() => setLoading(false));
  }, [q, state]);

  function updateUrl(nextQ: string, nextState: string) {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextState) params.set("state", nextState);
    const path = params.toString() ? `/applications?${params.toString()}` : "/applications";
    window.history.replaceState(null, "", path);
  }

  return (
    <CandidatePage>
      <PageHeader
        title="Applications"
        description="Track every submission, manual-action state, and draft awaiting your confirmation."
        actions={
          <Link href="/discover" className="af-btn af-btn-primary">Find jobs</Link>
        }
      />

      <Card>
        <div className="af-row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="af-stack" style={{ flex: "1 1 200px" }}>
            <span className="af-muted">Search</span>
            <input
              id="app-search"
              type="search"
              className="af-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => updateUrl(q, state)}
              placeholder="Company or role…"
            />
          </label>
          <label className="af-stack" style={{ flex: "0 1 180px" }}>
            <span className="af-muted">Status</span>
            <select
              id="app-state"
              className="af-input"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                updateUrl(q, e.target.value);
              }}
            >
              {STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {error && <Alert variant="error" role="alert">{error}</Alert>}

      {loading ? (
        <Card><Skeleton lines={4} /></Card>
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<PipelineHero />}
          title="No applications yet"
          description={
            q || state
              ? "No applications match your filters. Try clearing search or status."
              : "Start from Find jobs — assisted applications stay in your control until you confirm drafts."
          }
          action={
            <Link href="/discover" className="af-btn af-btn-primary">Browse jobs</Link>
          }
        />
      ) : (
        <>
          <p className="af-muted" role="status">{items.length} application{items.length === 1 ? "" : "s"}</p>
          <ul className="af-job-list">
            {items.map((app) => (
              <li key={app.id}>
                <Card>
                  <Link href={`/applications/${app.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="af-job-card-header">
                      <h3 className="af-job-card-title">{app.job.title}</h3>
                      <StatusBadge status={app.state} />
                    </div>
                    <p className="af-muted" style={{ margin: 0 }}>{app.job.company}</p>
                    {app.nextAction && (
                      <p className="af-muted" style={{ marginTop: "var(--space-xs)", fontSize: "var(--text-sm)" }}>
                        Next: {app.nextAction}
                      </p>
                    )}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </CandidatePage>
  );
}
