"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function refresh() {
    api<Record<string, unknown>>(`/applications/${id}`)
      .then(setApp)
      .catch(console.error);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [id]);

  async function confirmAndSubmit() {
    await api(`/applications/${id}/confirm`, {
      method: "POST",
      json: {
        answers: [
          { questionKey: "why_apply", questionText: "Why do you want this role?", answerValue: "Confirmed by user" },
        ],
      },
    });
    const result = await api<Record<string, unknown>>(`/applications/${id}/submit`, {
      method: "POST",
      headers: { "Idempotency-Key": `submit-${id}` },
    });
    setStatus(JSON.stringify(result));
    refresh();
  }

  async function completeExternal() {
    await api(`/applications/${id}/complete-external`, { method: "POST" });
    refresh();
  }

  if (!app) return <main className="container">Loading…</main>;

  const job = app.job as { title: string; company: string };
  const events = (app.events as Array<{ eventType: string; createdAt: string }>) ?? [];

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>{job.title} at {job.company}</h1>
        <p>State: <span className="status-badge">{app.state as string}</span></p>
        {app.nextAction && (
          <div className="alert alert-info" role="status">
            Next action: {app.nextAction as string}
          </div>
        )}
        {status && <pre>{status}</pre>}
        <div className="card">
          <h2>Timeline</h2>
          <ul>
            {events.map((e, i) => (
              <li key={i}>{e.eventType} — {new Date(e.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
        {app.state === "NEEDS_REVIEW" && (
          <button className="btn btn-primary" onClick={confirmAndSubmit}>Confirm and submit</button>
        )}
        {app.state === "WAITING_FOR_USER" && (
          <button className="btn btn-primary" onClick={completeExternal}>
            Mark external application complete
          </button>
        )}
      </div>
    </main>
  );
}
