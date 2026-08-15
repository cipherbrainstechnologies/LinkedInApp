"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Card, PageHeader, PipelineHero } from "@applyflow/ui-web";
import { api } from "@/shared/api";

type Persona = { id: string; label: string; email: string };

export default function LoginPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api<{ personas: Persona[] }>("/auth/demo/personas")
      .then((data) => setPersonas(data.personas))
      .catch((e) => setError(e.message));
  }, []);

  async function login(personaId: string) {
    setLoading(personaId);
    setError(null);
    try {
      await api("/auth/demo/login", { method: "POST", json: { personaId } });
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(null);
    }
  }

  async function oidcLogin() {
    setError(null);
    try {
      const data = await api<{ authorizationUrl: string }>("/auth/oidc/start?returnTo=/home");
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "OIDC start failed");
    }
  }

  return (
    <main className="af-page">
      <div className="af-container" style={{ maxWidth: "560px", paddingTop: "var(--space-2xl)" }}>
        <PageHeader
          title="Sign in to ApplyFlow"
          description="Local demo uses seeded personas. Production uses OIDC — no passwords stored in ApplyFlow."
        />

        <Card highlight>
          <PipelineHero />
          <p className="af-muted" style={{ marginTop: "var(--space-md)" }}>
            Your data stays under your control: AI drafts require confirmation, quotas are transparent,
            and assisted connectors never bypass employer sites.
          </p>
        </Card>

        {error && <Alert variant="error" role="alert">{error}</Alert>}

        <Card>
          <h2 className="af-h2">Mock OIDC</h2>
          <p className="af-muted">Uses local mock provider — same session shape as production OIDC.</p>
          <button
            type="button"
            className="af-btn af-btn-secondary"
            style={{ marginTop: "var(--space-sm)" }}
            onClick={oidcLogin}
          >
            Sign in with OIDC (mock)
          </button>
        </Card>

        <h2 className="af-h2">Demo personas</h2>
        <ul className="af-job-list">
          {personas.map((p) => (
            <li key={p.id}>
              <Card>
                <div className="af-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{p.label}</strong>
                    <p className="af-muted" style={{ margin: "0.25rem 0 0" }}>{p.email}</p>
                  </div>
                  <button
                    type="button"
                    className="af-btn af-btn-primary"
                    onClick={() => login(p.id)}
                    disabled={loading === p.id}
                    aria-busy={loading === p.id}
                  >
                    {loading === p.id ? "Signing in…" : "Continue"}
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
