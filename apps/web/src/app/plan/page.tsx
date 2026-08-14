"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

export default function PlanPage() {
  const [plans, setPlans] = useState<Array<{ id: string; name: string; version: { id: string; applicationQuota: number; priceMinor: number } }>>([]);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api<{ plans: typeof plans }>("/billing/plans").then((d) => setPlans(d.plans));
    api<{ subscription: Record<string, unknown>; quota: Record<string, unknown> }>("/billing/subscription")
      .then((d) => setSubscription(d));
  }, []);

  async function previewUpgrade(planVersionId: string) {
    const p = await api<Record<string, unknown>>("/billing/upgrade/preview", {
      method: "POST",
      json: { planVersionId },
    });
    setPreview(p);
  }

  async function confirmUpgrade(planVersionId: string) {
    const payment = await api<{ paymentId: string }>("/billing/upgrade/confirm", {
      method: "POST",
      json: { planVersionId },
    });
    await api("/billing/webhooks/mock", {
      method: "POST",
      json: { paymentId: payment.paymentId, event: "payment.succeeded" },
    });
    const sub = await api<{ subscription: Record<string, unknown>; quota: Record<string, unknown> }>("/billing/subscription");
    setSubscription(sub);
    setPreview(null);
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Plan & billing</h1>
        {subscription && (
          <div className="card">
            <h2>Current</h2>
            <pre>{JSON.stringify(subscription.quota, null, 2)}</pre>
          </div>
        )}
        <div className="card">
          <h2>Available plans</h2>
          {plans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "1rem" }}>
              <strong>{plan.name}</strong> — {plan.version.applicationQuota} apps — ₹{plan.version.priceMinor / 100}
              <button className="btn btn-secondary" onClick={() => previewUpgrade(plan.version.id)}>
                Preview upgrade
              </button>
              <button className="btn btn-primary" onClick={() => confirmUpgrade(plan.version.id)}>
                Confirm upgrade
              </button>
            </div>
          ))}
        </div>
        {preview && (
          <div className="card">
            <h2>Upgrade preview</h2>
            <pre>{JSON.stringify(preview, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}
