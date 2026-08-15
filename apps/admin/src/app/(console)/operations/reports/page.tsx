"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { Card, KpiCard, PageHeader } from "@applyflow/ui-web";

export default function ReportsPage() {
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof load>> | null>(null);

  async function load() {
    return adminApi<{
      kpis: {
        registeredUsers: number;
        applicationsSubmitted: number;
        quotaConsumed: number;
        mrrMinor: number;
      };
      applicationsByStatus: Array<{ state: string; count: number }>;
      planDistribution: Array<{ plan: string; count: number }>;
    }>("/admin/overview");
  }

  useEffect(() => {
    load().then(setOverview);
  }, []);

  if (!overview) return <div className="af-spinner" />;

  return (
    <div className="af-stack">
      <PageHeader title="Reports" description="Decision-oriented summaries from canonical API data" />
      <div className="af-kpi-grid">
        <KpiCard label="Users" value={overview.kpis.registeredUsers} />
        <KpiCard label="Submitted apps" value={overview.kpis.applicationsSubmitted} />
        <KpiCard label="Quota consumed" value={overview.kpis.quotaConsumed} />
        <KpiCard label="MRR (demo)" value={`₹${(overview.kpis.mrrMinor / 100).toLocaleString("en-IN")}`} />
      </div>
      <Card>
        <h2 className="af-h2">Accessible summary — applications by status</h2>
        <p className="af-muted">
          {overview.applicationsByStatus.map((r) => `${r.state}: ${r.count}`).join(" · ")}
        </p>
      </Card>
      <Card>
        <h2 className="af-h2">Plan distribution</h2>
        <p className="af-muted">
          {overview.planDistribution.map((r) => `${r.plan}: ${r.count}`).join(" · ")}
        </p>
      </Card>
    </div>
  );
}
