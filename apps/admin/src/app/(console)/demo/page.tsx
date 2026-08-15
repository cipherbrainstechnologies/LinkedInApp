"use client";

import { useState } from "react";
import { Card, PageHeader } from "@applyflow/ui-web";

const ADMIN_STEPS = [
  "Log in via Demo Admin (server session cookie).",
  "Review dashboard KPIs and provider health.",
  "Search registered users and open a profile detail.",
  "Inspect subscription, quota ledger, and applications.",
  "Open Plans & quotas — published allowances.",
  "Configure AI provider — masked fingerprint only.",
  "Review reports and audit log.",
  "Log out to end session.",
];

const CANDIDATE_HINT =
  "Candidate demo runs on http://localhost:3000 — use Help & demo after signing in as experienced-launch.";

export default function DemoCenterPage() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("af-admin-tour-done") === "1";
  });

  function restartTour() {
    localStorage.removeItem("af-admin-tour-done");
    setDismissed(false);
  }

  function completeTour() {
    localStorage.setItem("af-admin-tour-done", "1");
    setDismissed(true);
  }

  return (
    <div className="af-stack">
      <PageHeader
        title="Demo center"
        description="Guided presentation checklist for admin stakeholders"
        actions={
          <button type="button" className="af-btn af-btn-secondary" onClick={restartTour}>
            Restart tour
          </button>
        }
      />
      <Card>
        <p className="af-muted">{CANDIDATE_HINT}</p>
        <p className="af-muted">
          Mock providers: billing webhook, OIDC, ATS connector, AI extraction. Stripe/Razorpay/OpenAI
          disabled unless env flags set.
        </p>
      </Card>
      {!dismissed && (
        <Card highlight>
          <h2 className="af-h2">Admin demo script</h2>
          <ol className="af-stack">
            {ADMIN_STEPS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <button type="button" className="af-btn af-btn-primary" onClick={completeTour}>
            Mark tour complete
          </button>
        </Card>
      )}
      <Card>
        <h2 className="af-h2">Reset demo data</h2>
        <p className="af-muted">From repository root: <code>pnpm demo:reset</code> (migrate + seed).</p>
      </Card>
    </div>
  );
}
