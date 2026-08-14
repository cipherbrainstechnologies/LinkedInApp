"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api<{ job: Record<string, unknown>; match: Record<string, unknown> }>(`/jobs/${jobId}`)
      .then((data) => {
        setJob(data.job);
        setMatch(data.match);
      })
      .catch(console.error);
  }, [jobId]);

  async function startApplication() {
    const result = await api<{ applicationId?: string; duplicate?: boolean }>("/applications", {
      method: "POST",
      json: { jobId },
    });
    if (result.applicationId) {
      router.push(`/applications/${result.applicationId}`);
    }
  }

  if (!job) return <main className="container">Loading…</main>;

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>{job.title as string}</h1>
        <p>{job.company as string} · {job.location as string}</p>
        <div className="card">
          <p>{job.description as string}</p>
        </div>
        {match && (
          <div className="card">
            <h2>Match assessment</h2>
            <p>Eligible: {match.eligible ? "Yes" : "No"}</p>
            {Array.isArray(match.gaps) && match.gaps.length > 0 && (
              <p>Gaps: {(match.gaps as string[]).join(", ")}</p>
            )}
            <p><em>Match explanations reference your profile facts. No guaranteed outcome.</em></p>
          </div>
        )}
        <button className="btn btn-primary" onClick={startApplication}>
          Prepare application
        </button>
      </div>
    </main>
  );
}
