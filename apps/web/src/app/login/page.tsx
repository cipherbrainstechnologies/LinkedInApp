"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <main className="container">
      <h1>Demo sign in</h1>
      <p>Select a demo persona. No password required in local demo mode.</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {personas.map((p) => (
          <li key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{p.label}</strong>
              <br />
              <small>{p.email}</small>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => login(p.id)}
              disabled={loading === p.id}
              aria-busy={loading === p.id}
            >
              {loading === p.id ? "Signing in…" : "Sign in"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
