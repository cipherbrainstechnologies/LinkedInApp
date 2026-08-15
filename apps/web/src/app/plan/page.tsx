"use client";

import { useCallback, useEffect, useState } from "react";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type PlanRow = {
  id: string;
  name: string;
  slug: string;
  version: { id: string; applicationQuota: number; priceMinor: number };
};

type QuotaSummary = {
  quotaLimit: number;
  quotaUsed: number;
  quotaAvailable: number;
  resetAt: string | null;
};

type UpgradePreview = {
  targetPlan: string;
  targetQuota: number;
  currentUsage: number;
  quotaReserved: number;
  newAvailable: number;
  creditMinor: number;
  remainingPeriodChargeMinor: number;
  taxMinor: number;
  dueNowMinor: number;
  nextRenewalMinor: number;
  nextRenewalAt: string;
  quoteExpiresAt: string;
  currency: string;
};

type PendingPayment = { id: string; state: string } | null;

function formatInr(minor: number) {
  return `₹${(minor / 100).toLocaleString("en-IN")}`;
}

export default function PlanPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [quota, setQuota] = useState<QuotaSummary | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState<string>("");
  const [preview, setPreview] = useState<UpgradePreview | null>(null);
  const [previewPlanVersionId, setPreviewPlanVersionId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    const data = await api<{
      subscription: {
        planVersion?: { plan?: { name: string } };
      } | null;
      quota: QuotaSummary;
      pendingPayment: PendingPayment;
    }>("/billing/subscription");
    setQuota(data.quota);
    setCurrentPlanName(data.subscription?.planVersion?.plan?.name ?? "Free");
    setPendingPayment(data.pendingPayment);
  }, []);

  useEffect(() => {
    api<{ plans: PlanRow[] }>("/billing/plans").then((d) => setPlans(d.plans));
    loadSubscription();
  }, [loadSubscription]);

  async function previewUpgrade(planVersionId: string) {
    setError(null);
    setProcessingMessage(null);
    const p = await api<UpgradePreview>("/billing/upgrade/preview", {
      method: "POST",
      json: { planVersionId },
    });
    setPreview(p);
    setPreviewPlanVersionId(planVersionId);
  }

  async function confirmUpgrade(planVersionId: string) {
    setError(null);
    const payment = await api<{ paymentId: string; state: string; message: string }>(
      "/billing/upgrade/confirm",
      {
        method: "POST",
        json: { planVersionId },
      },
    );
    setProcessingMessage(payment.message);
    setPendingPayment({ id: payment.paymentId, state: "PENDING" });
    setPreview(null);

    const data = await api<{
      subscription: {
        planVersion?: { plan?: { name: string } };
      } | null;
      quota: QuotaSummary;
      pendingPayment: PendingPayment;
    }>("/billing/subscription");
    setQuota(data.quota);
    setCurrentPlanName(data.subscription?.planVersion?.plan?.name ?? "Free");
    setPendingPayment(
      data.pendingPayment ?? { id: payment.paymentId, state: "PENDING" },
    );
  }

  async function simulateWebhook(event: "payment.succeeded" | "payment.failed") {
    if (!pendingPayment) return;
    setError(null);
    await api("/billing/webhooks/mock", {
      method: "POST",
      json: { paymentId: pendingPayment.id, event },
    });
    await loadSubscription();
    if (event === "payment.succeeded") {
      setPendingPayment(null);
      setProcessingMessage(null);
    } else {
      setProcessingMessage("Payment failed — your current plan and quota were preserved.");
    }
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Plan & billing</h1>

        {quota && (
          <div className="card">
            <h2>Current plan</h2>
            <p>
              <strong>{currentPlanName}</strong> — {quota.quotaUsed} used of {quota.quotaLimit} (
              {quota.quotaAvailable} available)
            </p>
            {quota.resetAt && (
              <p className="muted">Period resets {new Date(quota.resetAt).toLocaleString()}</p>
            )}
          </div>
        )}

        {(pendingPayment || processingMessage) && (
          <div className="card" role="status">
            <h2>Payment status</h2>
            {processingMessage && <p>{processingMessage}</p>}
            {pendingPayment?.state === "PENDING" && (
              <>
                <p>
                  Upgrade is processing until the payment provider confirms via webhook. Your paid
                  quota is not granted yet.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => simulateWebhook("payment.succeeded")}
                  >
                    Simulate webhook success (demo)
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => simulateWebhook("payment.failed")}
                  >
                    Simulate payment failure (demo)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="card" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="card">
          <h2>Available plans</h2>
          {plans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "1rem" }}>
              <strong>{plan.name}</strong> — {plan.version.applicationQuota} applications —{" "}
              {formatInr(plan.version.priceMinor)}
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => previewUpgrade(plan.version.id)}
                >
                  Preview upgrade
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => confirmUpgrade(plan.version.id)}
                  disabled={pendingPayment?.state === "PENDING"}
                >
                  Confirm upgrade
                </button>
              </div>
            </div>
          ))}
        </div>

        {preview && (
          <div className="card">
            <h2>Upgrade preview</h2>
            <ul>
              <li>Target plan: {preview.targetPlan} ({preview.targetQuota} applications)</li>
              <li>Current usage: {preview.currentUsage} (reserved: {preview.quotaReserved})</li>
              <li>Available after upgrade: {preview.newAvailable}</li>
              <li>Unused plan credit: {formatInr(preview.creditMinor)}</li>
              <li>Remaining-period charge: {formatInr(preview.remainingPeriodChargeMinor)}</li>
              <li>Tax: {formatInr(preview.taxMinor)}</li>
              <li>
                <strong>Due now: {formatInr(preview.dueNowMinor)}</strong>
              </li>
              <li>Next renewal: {formatInr(preview.nextRenewalMinor)} on {new Date(preview.nextRenewalAt).toLocaleDateString()}</li>
              <li>Quote expires: {new Date(preview.quoteExpiresAt).toLocaleString()}</li>
            </ul>
            {previewPlanVersionId && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => confirmUpgrade(previewPlanVersionId)}
                disabled={pendingPayment?.state === "PENDING"}
              >
                Confirm this upgrade
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
