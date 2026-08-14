"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Me = {
  email: string | null;
  onboardingState: string;
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

  useEffect(() => {
    api<Me>("/me")
      .then(setMe)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <main className="container">
        <div className="alert alert-error" role="alert">{error}</div>
        <Link href="/login">Sign in</Link>
      </main>
    );
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Welcome{me?.email ? `, ${me.email}` : ""}</h1>
        {me && (
          <div className="card">
            <h2>Your plan</h2>
            <p>
              <strong>{me.planSummary.planName}</strong> — {me.planSummary.quotaAvailable} of{" "}
              {me.planSummary.quotaLimit} applications available
              ({me.planSummary.quotaUsed} used)
            </p>
            {me.onboardingState !== "COMPLETED" && (
              <p>
                <Link href="/onboarding">Complete onboarding</Link> to start applying.
              </p>
            )}
            {me.onboardingState === "COMPLETED" && (
              <Link href="/discover" className="btn btn-primary">Discover jobs</Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
