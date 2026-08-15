"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Answer = {
  questionKey: string;
  questionText: string;
  answerValue: string;
  confirmationState: string;
  sensitivity: string;
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});

  function refresh() {
    api<Record<string, unknown>>(`/applications/${id}`)
      .then((data) => {
        setApp(data);
        const answers = (data.answers as Answer[]) ?? [];
        const drafts: Record<string, string> = {};
        for (const a of answers) {
          drafts[a.questionKey] = a.answerValue;
        }
        setDraftAnswers(drafts);
      })
      .catch(console.error);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [id]);

  async function prepare() {
    await api(`/applications/${id}/prepare`, { method: "POST" });
    setStatus("Screening questions prepared.");
    refresh();
  }

  async function confirmAndSubmit() {
    const answers = (app?.answers as Answer[]) ?? [];
    const payload = answers.map((a) => ({
      questionKey: a.questionKey,
      questionText: a.questionText,
      answerValue: draftAnswers[a.questionKey] ?? a.answerValue,
    }));
    await api(`/applications/${id}/confirm`, { method: "POST", json: { answers: payload } });
    const result = await api<Record<string, unknown>>(`/applications/${id}/submit`, {
      method: "POST",
      headers: { "Idempotency-Key": `submit-${id}` },
    });
    setStatus(JSON.stringify(result));
    refresh();
  }

  async function resolveWaiting() {
    await api(`/applications/${id}/resolve-waiting`, { method: "POST" });
    setStatus("Resumed after user action.");
    refresh();
  }

  async function completeExternal() {
    await api(`/applications/${id}/complete-external`, { method: "POST" });
    refresh();
  }

  if (!app) return <main className="container">Loading…</main>;

  const job = app.job as { title: string; company: string };
  const events = (app.events as Array<{ eventType: string; createdAt: string }>) ?? [];
  const answers = (app.answers as Answer[]) ?? [];
  const snapshot = app.snapshot as Record<string, unknown> | undefined;
  const evidence = (app.evidence as Array<{ receiptId: string; evidenceLevel: string }>) ?? [];

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>{job.title} at {job.company}</h1>
        <p>State: <span className="status-badge">{app.state as string}</span> · Mode: {app.mode as string}</p>
        {app.nextAction && (
          <div className="alert alert-info" role="status">
            Next action: {app.nextAction as string}
          </div>
        )}
        {status && <pre className="alert alert-info">{status}</pre>}

        {snapshot && (
          <div className="card">
            <h2>Snapshot</h2>
            <ul>
              <li>Profile version: {String(snapshot.profileVersion)}</li>
              <li>Job snapshot: {String(snapshot.jobSnapshotId ?? "—")}</li>
              <li>Resume version: {(snapshot.resumeVersion as { versionNumber?: number })?.versionNumber ?? "—"}</li>
              <li>Connector: {String(snapshot.connectorVersion ?? "—")}</li>
            </ul>
          </div>
        )}

        <div className="card">
          <h2>Screening answers</h2>
          {answers.length === 0 && (
            <button className="btn btn-secondary" onClick={prepare}>Prepare screening questions</button>
          )}
          {answers.map((a) => (
            <div key={a.questionKey} className="form-group">
              <label>{a.questionText} ({a.confirmationState})</label>
              <input
                value={draftAnswers[a.questionKey] ?? ""}
                onChange={(e) =>
                  setDraftAnswers((prev) => ({ ...prev, [a.questionKey]: e.target.value }))
                }
                disabled={a.sensitivity === "PROTECTED" && !draftAnswers[a.questionKey]}
                placeholder={a.sensitivity === "PROTECTED" ? "Enter your answer (never prefilled)" : ""}
              />
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Timeline</h2>
          <ul>
            {events.map((e, i) => (
              <li key={i}>{e.eventType} — {new Date(e.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>

        {evidence.length > 0 && (
          <div className="card">
            <h2>Evidence</h2>
            <ul>
              {evidence.map((e, i) => (
                <li key={i}>{e.evidenceLevel}: {e.receiptId}</li>
              ))}
            </ul>
          </div>
        )}

        {(app.state === "NEEDS_REVIEW" || app.state === "READY") && answers.length > 0 && (
          <button className="btn btn-primary" onClick={confirmAndSubmit}>Confirm and submit</button>
        )}
        {app.state === "WAITING_FOR_USER" && (
          <>
            <button className="btn btn-primary" onClick={resolveWaiting}>
              I completed the required action — resume
            </button>
            <button className="btn btn-secondary" onClick={completeExternal}>
              Mark assisted application complete
            </button>
          </>
        )}
      </div>
    </main>
  );
}
