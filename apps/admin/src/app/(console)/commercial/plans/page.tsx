"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { Card, PageHeader } from "@applyflow/ui-web";

export default function PlansPage() {
  const [plans, setPlans] = useState<Array<{
    name: string;
    slug: string;
    versions: Array<{ version: number; applicationQuota: number; priceMinor: number; status: string }>;
  }>>([]);

  useEffect(() => {
    adminApi<{ plans: typeof plans }>("/admin/plans").then((d) => setPlans(d.plans));
  }, []);

  return (
    <div className="af-stack">
      <PageHeader
        title="Plans & quotas"
        description="Published plan versions and monthly application allowances (seed data)."
      />
      {plans.map((plan) => (
        <Card key={plan.slug}>
          <h2 className="af-h2">{plan.name}</h2>
          <div className="af-table-wrap">
            <table className="af-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Quota</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plan.versions.map((v) => (
                  <tr key={v.version}>
                    <td>v{v.version}</td>
                    <td>{v.applicationQuota} apps / period</td>
                    <td>₹{(v.priceMinor / 100).toLocaleString("en-IN")}</td>
                    <td>{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
