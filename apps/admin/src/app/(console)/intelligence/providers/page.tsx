"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { Card, PageHeader } from "@applyflow/ui-web";

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<Array<{
    id: string;
    displayName: string;
    providerType: string;
    enabled: boolean;
    healthStatus: string;
    secretFingerprint: string | null;
  }>>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi<{ providers: typeof providers }>("/admin/ai/providers").then((d) => setProviders(d.providers));
  }, []);

  async function storeKey() {
    const res = await adminApi<{ secretFingerprint: string }>("/admin/ai/providers", {
      method: "POST",
      json: {
        providerType: "mock",
        displayName: "Demo OpenAI-compatible",
        apiKey: "sk-demo-mock-key-not-real",
      },
    });
    setMessage(`Stored — fingerprint ${res.secretFingerprint}. Full key never returned.`);
    adminApi<{ providers: typeof providers }>("/admin/ai/providers").then((d) => setProviders(d.providers));
  }

  async function testConnection(id: string) {
    const res = await adminApi<{ success: boolean; message: string }>(`/admin/ai/providers/${id}/test`, {
      method: "POST",
      json: {},
    });
    setMessage(res.message);
  }

  return (
    <div className="af-stack">
      <PageHeader
        title="AI providers"
        description="Write-only secret storage. Responses show fingerprint only."
      />
      {message && <div className="af-alert af-alert-info" role="status">{message}</div>}
      <Card>
        <button type="button" className="af-btn af-btn-secondary" onClick={storeKey}>
          Store demo API key (mock)
        </button>
      </Card>
      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Health</th>
              <th>Key fingerprint</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td>{p.displayName}</td>
                <td>{p.providerType}</td>
                <td>{p.healthStatus}</td>
                <td><code>{p.secretFingerprint ?? "—"}</code></td>
                <td>
                  <button type="button" className="af-btn af-btn-ghost" onClick={() => testConnection(p.id)}>
                    Test (mock)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
