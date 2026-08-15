"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CandidatePage } from "@/shared/Nav";
import { api } from "@/shared/api";
import { Alert, Card, KpiCard, PageHeader, PipelineHero, Skeleton } from "@applyflow/ui-web";

type Me = {
  email: string | null;
  onboardingState: string;
  onboardingPath: string | null;
  planSummary: {
    planName: string;
    quotaUsed: number;
    quotaLimit: number;
    quotaAvailable: number;
    resetAt: string | null;
  };
};

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    api<Me>("/me")
      .then(setMe)
      .catch((e) => setError(e.message));
    api<{ applications: Array<{ state: string }> }>("/applications")
      .then((d) => {
        const counts: Record<string, number> = {};
        for (const a of d.applications ?? []) {
          counts[a.state] = (counts[a.state] ?? 0) + 1;
        }
        setAppCounts(counts);
      })
      .catch(() => undefined);
  }, []);

  if (error) {
    return (
      <CandidatePage>
        <Alert variant="error" role="alert">{error}</Alert>
        <Link href="/login" className="af-btn af-btn-primary">Sign in</Link>
      </CandidatePage>
    );
  }

  if (!me) {
    return (
      <CandidatePage>
        <Card><Skeleton lines={4} /></Card>
      </CandidatePage>
    );
  }

  const nextAction =
    me.onboardingState !== "COMPLETED"
      ? { label: "Complete onboarding", href: "/onboarding" }
      : me.planSummary.quotaAvailable < 1
        ? { label: "Review plan options", href: "/plan" }
        : { label: "Find jobs to apply", href: "/discover" };

  return (
    <CandidatePage>
      <PageHeader
        title={`Welcome back${me.email ? `, ${me.email.split("@")[0]}` : ""}`}
        description="Verified applications — not volume. Review matches, confirm drafts, and track every submission."
        actions={
          <Link href={nextAction.href} className="af-btn af-btn-primary">{nextAction.label}</Link>
        }
      />

      <Card highlight>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: "var(--space-lg)",
            alignItems: "center",
          }}
        >
          <div>
            <h2 className="af-h2">Your application pipeline</h2>
            <p className="af-muted">
              {me.onboardingPath === "FRESHER"
                ? "Fresher path — education and projects drive matches, not fabricated experience."
                : "Experienced path — employment history and active resume power automation boundaries."}
            </p>
          </div>
          <PipelineHero />
        </div>
      </Card>

      <div className="af-kpi-grid" style={{ marginBottom: "var(--space-lg)" }}>
        <KpiCard label="Plan" value={me.planSummary.planName} />
        <KpiCard
          label="Available"
          value={me.planSummary.quotaAvailable}
          hint={`${me.planSummary.quotaUsed} used of ${me.planSummary.quotaLimit}`}
        />
        <KpiCard
          label="Resets"
          value={me.planSummary.resetAt ? new Date(me.planSummary.resetAt).toLocaleDateString() : "—"}
        />
        <KpiCard label="In progress apps" value={Object.values(appCounts).reduce((a, b) => a + b, 0)} />
      </div>

      <Card>
        <h2 className="af-h2">Application status</h2>
        {Object.keys(appCounts).length === 0 ? (
          <p className="af-muted">
            No applications yet — <Link href="/discover">find an eligible job</Link>.
          </p>
        ) : (
          <ul>
            {Object.entries(appCounts).map(([state, count]) => (
              <li key={state}>{state}: {count}</li>
            ))}
          </ul>
        )}
      </Card>
    </CandidatePage>
  );
}
