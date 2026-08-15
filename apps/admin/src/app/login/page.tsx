"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi } from "@/shared/api";

const DEMO_EMAIL = "support@demo.applyflow.local";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function demoLogin() {
    setLoading(true);
    setError(null);
    try {
      await adminApi("/admin/auth/demo/login", {
        method: "POST",
        json: { email: DEMO_EMAIL },
      });
      const returnTo = params.get("returnTo") ?? "/";
      router.push(returnTo.startsWith("/") ? returnTo : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="af-page">
      <div className="af-container" style={{ maxWidth: "480px", paddingTop: "4rem" }}>
        <div className="af-card af-card-highlight af-stack">
          <h1 className="af-h1">ApplyFlow Admin</h1>
          <p className="af-lead">
            Operational control plane for support, finance, and platform operations. Local demo uses a
            server-backed session — not a client header.
          </p>
          {error && (
            <div className="af-alert af-alert-error" role="alert">{error}</div>
          )}
          <button
            type="button"
            className="af-btn af-btn-primary"
            onClick={demoLogin}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Signing in…" : "Continue as Demo Admin (Support)"}
          </button>
          <p className="af-muted">
            Demo identity: {DEMO_EMAIL}. Production requires real admin authentication; demo login is
            disabled when <code>APP_ENV=production</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
