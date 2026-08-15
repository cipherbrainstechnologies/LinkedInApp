"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Card,
  PageHeader,
  PolicyBadge,
  Skeleton,
} from "@applyflow/ui-web";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";

type Match = {
  eligible?: boolean;
  strengths?: string[];
  gaps?: string[];
  unknowns?: string[];
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api<{ job: Record<string, unknown>; match: Match }>(`/jobs/${jobId}`)
      .then((data) => {
        setJob(data.job);
        setMatch(data.match);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load job"));
  }, [jobId]);

  async function startApplication() {
    setStarting(true);
    setError(null);
    try {
      const result = await api<{ applicationId?: string; duplicate?: boolean }>("/applications", {
        method: "POST",
        json: { jobId },
      });
      if (result.applicationId) {
        router.push(`/applications/${result.applicationId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start application");
    } finally {
      setStarting(false);
    }
  }

  if (error && !job) {
    return (
      <CandidatePage>
        <Alert variant="error" role="alert">{error}</Alert>
        <Link href="/discover" className="af-btn af-btn-secondary">Back to jobs</Link>
      </CandidatePage>
    );
  }

  if (!job) {
    return (
      <CandidatePage>
        <Card><Skeleton lines={5} /></Card>
      </CandidatePage>
    );
  }

  const policyMode = String(job.policyMode ?? "ASSISTED");
  const eligible = match?.eligible ?? true;

  return (
    <CandidatePage>
      <PageHeader
        title={String(job.title)}
        description={`${job.company} · ${job.location ?? "Location not specified"}`}
        actions={
          <Link href="/discover" className="af-btn af-btn-ghost">Back to search</Link>
        }
      />

      <div className="af-row" style={{ marginBottom: "var(--space-md)" }}>
        <PolicyBadge mode={policyMode} />
        {job.workMode != null && job.workMode !== "" && (
          <span className="af-muted">{String(job.workMode).replace(/_/g, " ")}</span>
        )}
      </div>

      {policyMode === "ASSISTED" && (
        <Alert variant="warning">
          Assisted application — ApplyFlow prepares drafts and may open the employer site. You confirm and
          submit; we do not scrape or auto-post to LinkedIn.
        </Alert>
      )}

      <Card>
        <h2 className="af-h2">Role overview</h2>
        <p style={{ lineHeight: 1.6 }}>{String(job.description ?? "")}</p>
      </Card>

      {match && (
        <Card highlight={eligible}>
          <h2 className="af-h2">Why this might fit</h2>
          <p className="af-muted">
            Eligible to apply: <strong>{eligible ? "Yes" : "Review gaps first"}</strong>
          </p>
          {match.strengths?.length && (
            <div style={{ marginTop: "var(--space-sm)" }}>
              <strong className="af-muted">Strengths</strong>
              <ul>
                {match.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
          {match.gaps?.length && (
            <div style={{ marginTop: "var(--space-sm)" }}>
              <strong className="af-muted">Gaps to address</strong>
              <ul>
                {match.gaps.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          )}
          {match.unknowns?.length && (
            <p className="af-muted" style={{ marginTop: "var(--space-sm)" }}>
              {match.unknowns.join(" · ")}
            </p>
          )}
        </Card>
      )}

      {error && <Alert variant="error" role="alert">{error}</Alert>}

      <div className="af-row" style={{ marginTop: "var(--space-lg)" }}>
        <button
          type="button"
          className="af-btn af-btn-primary"
          onClick={startApplication}
          disabled={starting || !eligible}
        >
          {starting ? "Preparing…" : "Prepare application"}
        </button>
        {!eligible && (
          <span className="af-muted">Resolve eligibility gaps before starting.</span>
        )}
      </div>
    </CandidatePage>
  );
}
