"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/shared/api";
import { Card, PageHeader } from "@applyflow/ui-web";

type CustomerDetail = {
  id: string;
  email: string;
  onboardingState: string;
  onboardingPath: string | null;
  privateDataMasked: boolean;
  profile: { preferredName: string; jobTargets: string[] } | null;
  subscription: { planName: string; state: string; currentPeriodEnd: string } | null;
  quota: { quotaUsed: number; quotaLimit: number; quotaAvailable: number };
  recentLedger: Array<{ entryType: string; units: number; reasonCode: string | null; createdAt: string }>;
  applications: Array<{ id: string; state: string; createdAt: string }>;
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi<CustomerDetail>(`/admin/customers/${id}`).then(setData);
  }, [id]);

  async function adjustQuota() {
    await adminApi("/admin/quota-adjustment", {
      method: "POST",
      json: { userId: id, units: 1, reason: "Demo support credit" },
    });
    setMessage("Append-only +1 quota adjustment recorded.");
    adminApi<CustomerDetail>(`/admin/customers/${id}`).then(setData);
  }

  if (!data) return <div className="af-spinner" />;

  return (
    <div className="af-stack">
      <PageHeader
        title={data.profile?.preferredName ?? "User profile"}
        description={data.privateDataMasked ? "Contact details masked — grant support access for full PII." : data.email}
      />
      {message && <div className="af-alert af-alert-info" role="status">{message}</div>}
      <div className="af-kpi-grid">
        <Card>
          <div className="af-muted">Quota</div>
          <div className="af-kpi-value">{data.quota.quotaAvailable} available</div>
          <div className="af-muted">{data.quota.quotaUsed} used of {data.quota.quotaLimit}</div>
          <button type="button" className="af-btn af-btn-secondary" onClick={adjustQuota} style={{ marginTop: "var(--space-sm)" }}>
            +1 quota (append-only)
          </button>
        </Card>
        <Card>
          <div className="af-muted">Subscription</div>
          <div className="af-kpi-value">{data.subscription?.planName ?? "Free"}</div>
          <div className="af-muted">{data.subscription?.state ?? "—"}</div>
        </Card>
        <Card>
          <div className="af-muted">Profile</div>
          <div>{data.onboardingPath} · {data.onboardingState}</div>
          {data.profile?.jobTargets?.length && (
            <div className="af-muted">Targets: {data.profile.jobTargets.join(", ")}</div>
          )}
        </Card>
      </div>
      <Card>
        <h2 className="af-h2">Recent applications</h2>
        <ul>
          {data.applications.map((a) => (
            <li key={a.id}>{a.state} — {new Date(a.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="af-h2">Quota ledger (append-only)</h2>
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Units</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLedger.map((e, i) => (
                <tr key={i}>
                  <td>{e.entryType}</td>
                  <td>{e.units}</td>
                  <td>{e.reasonCode ?? "—"}</td>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
