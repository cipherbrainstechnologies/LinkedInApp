"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { Card, KpiCard, PageHeader } from "@applyflow/ui-web";

type Overview = {
  asOf: string;
  kpis: {
    registeredUsers: number;
    activeUsers: number;
    activeSubscriptions: number;
    mrrMinor: number;
    applicationsStarted: number;
    applicationsSubmitted: number;
    applicationCompletionRate: number;
    quotaConsumed: number;
    manualActionRequired: number;
    providerHealth: Array<{ name: string; domain: string; status: string }>;
  };
  applicationsByStatus: Array<{ state: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi<Overview>("/admin/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <div className="af-alert af-alert-error" role="alert">{error}</div>;
  }

  if (!data) {
    return <div className="af-spinner" role="status" />;
  }

  const k = data.kpis;

  return (
    <div className="af-stack">
      <PageHeader
        title="Operations dashboard"
        description={`Data as of ${new Date(data.asOf).toLocaleString()} · seeded demo metrics`}
      />
      <div className="af-kpi-grid">
        <KpiCard label="Registered users" value={k.registeredUsers} />
        <KpiCard label="Active users (30d)" value={k.activeUsers} />
        <KpiCard label="Active subscriptions" value={k.activeSubscriptions} />
        <KpiCard label="MRR (demo)" value={`₹${(k.mrrMinor / 100).toLocaleString("en-IN")}`} />
        <KpiCard label="Applications started" value={k.applicationsStarted} />
        <KpiCard
          label="Completion rate"
          value={`${Math.round(k.applicationCompletionRate * 100)}%`}
        />
        <KpiCard label="Quota consumed" value={k.quotaConsumed} />
        <KpiCard label="Manual action required" value={k.manualActionRequired} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-md)" }}>
        <Card>
          <h2 className="af-h2">Applications by status</h2>
          <ul className="af-stack">
            {data.applicationsByStatus.map((row) => (
              <li key={row.state} className="af-row" style={{ justifyContent: "space-between" }}>
                <span>{row.state}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="af-h2">Plan distribution</h2>
          <ul className="af-stack">
            {data.planDistribution.map((row) => (
              <li key={row.plan} className="af-row" style={{ justifyContent: "space-between" }}>
                <span>{row.plan}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="af-h2">Provider health</h2>
          <ul className="af-stack">
            {k.providerHealth.map((p) => (
              <li key={p.domain} className="af-row" style={{ justifyContent: "space-between" }}>
                <span>{p.name}</span>
                <span className="af-badge">{p.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
