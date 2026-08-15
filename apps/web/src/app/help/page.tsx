"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";
import { Card, PipelineHero, PageHeader } from "@applyflow/ui-web";

const STEPS = [
  { id: "profile", label: "Review demo profile and onboarding path", href: "/onboarding" },
  { id: "resume", label: "Upload or activate a resume", href: "/resumes" },
  { id: "jobs", label: "Explore matching jobs and explanations", href: "/discover" },
  { id: "apply", label: "Start an assisted application (mock ATS)", href: "/discover" },
  { id: "confirm", label: "Confirm AI-drafted screening answers", href: "/applications" },
  { id: "track", label: "Track application status and manual-action states", href: "/applications" },
  { id: "plan", label: "Review plan quota and upgrade flow", href: "/plan" },
];

export default function HelpPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("af-candidate-tour");
    if (saved) setDone(JSON.parse(saved));
    api<{ planSummary: { planName: string } }>("/me")
      .then((m) => setPlan(m.planSummary.planName))
      .catch(() => undefined);
  }, []);

  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    localStorage.setItem("af-candidate-tour", JSON.stringify(next));
  }

  function restart() {
    localStorage.removeItem("af-candidate-tour");
    setDone({});
  }

  return (
    <CandidatePage>
      <PageHeader
        title="Help & demo guide"
        description="Follow this checklist for a 10-minute candidate presentation. All data is deterministic seed content."
      />
      <Card highlight>
        <PipelineHero />
        <p className="af-muted">
          Current plan from API: {plan ?? "sign in to load"}. LinkedIn remains assisted-only — no
          automated scraping.
        </p>
      </Card>
      <Card>
        <div className="af-row" style={{ justifyContent: "space-between" }}>
          <h2 className="af-h2">Presentation checklist</h2>
          <button type="button" className="af-btn af-btn-secondary" onClick={restart}>Restart tour</button>
        </div>
        <ul className="af-stack" style={{ listStyle: "none", padding: 0 }}>
          {STEPS.map((step) => (
            <li key={step.id} className="af-row">
              <input
                type="checkbox"
                checked={done[step.id] ?? false}
                onChange={() => toggle(step.id)}
                aria-label={step.label}
              />
              <Link href={step.href}>{step.label}</Link>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="af-h2">Demo personas</h2>
        <p className="af-muted">
          Sign in at <Link href="/login">/login</Link> — try <strong>experienced-launch</strong> (20/50
          quota) or <strong>fresher-free</strong> for education-led guidance.
        </p>
      </Card>
    </CandidatePage>
  );
}
