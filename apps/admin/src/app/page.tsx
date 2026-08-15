"use client";

import { useState } from "react";

const API = "http://localhost:4000/v1";

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState("support@demo.applyflow.local");
  const [customers, setCustomers] = useState<Array<{ id: string; email: string | null }>>([]);
  const [audit, setAudit] = useState<Array<{ action: string; createdAt: string }>>([]);
  const [aiProviders, setAiProviders] = useState<Array<{ id: string; displayName: string; secretFingerprint: string | null }>>([]);
  const [aiRoutes, setAiRoutes] = useState<Array<{ id: string; taskType: string; status: string }>>([]);
  const [message, setMessage] = useState("");

  async function searchCustomers() {
    const res = await fetch(`${API}/admin/customers?q=`, {
      headers: { "x-admin-email": adminEmail },
    });
    const data = await res.json();
    setCustomers(data.customers ?? []);
  }

  async function loadAudit() {
    const res = await fetch(`${API}/admin/audit`, {
      headers: { "x-admin-email": adminEmail },
    });
    const data = await res.json();
    setAudit(data.events ?? []);
  }

  async function adjustQuota(userId: string) {
    await fetch(`${API}/admin/quota-adjustment`, {
      method: "POST",
      headers: { "x-admin-email": adminEmail, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, units: 1, reason: "Support adjustment demo" }),
    });
    setMessage("Quota adjusted");
    loadAudit();
  }

  async function loadAi() {
    const [providersRes, routesRes] = await Promise.all([
      fetch(`${API}/admin/ai/providers`, { headers: { "x-admin-email": adminEmail } }),
      fetch(`${API}/admin/ai/routes`, { headers: { "x-admin-email": adminEmail } }),
    ]);
    if (providersRes.ok) {
      const data = await providersRes.json();
      setAiProviders(data.providers ?? []);
    }
    if (routesRes.ok) {
      const data = await routesRes.json();
      setAiRoutes(data.routes ?? []);
    }
  }

  async function storeMockSecret() {
    const res = await fetch(`${API}/admin/ai/providers`, {
      method: "POST",
      headers: { "x-admin-email": adminEmail, "Content-Type": "application/json" },
      body: JSON.stringify({
        providerType: "mock",
        displayName: "Demo stored secret",
        apiKey: "sk-demo-write-only-secret",
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Secret stored (fingerprint ${data.secretFingerprint})` : data.message ?? "Failed");
    loadAi();
    loadAudit();
  }

  return (
    <main className="container">
      <h1>ApplyFlow Admin</h1>
      <div className="card">
        <label>
          Admin identity
          <select value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}>
            <option value="support@demo.applyflow.local">Support</option>
            <option value="finance@demo.applyflow.local">Finance</option>
            <option value="ops@demo.applyflow.local">Ops / AI</option>
            <option value="ai@demo.applyflow.local">AI admin</option>
            <option value="auditor@demo.applyflow.local">Auditor</option>
          </select>
        </label>
      </div>
      <div className="card">
        <button className="btn" onClick={searchCustomers}>Search customers</button>
        <button className="btn" onClick={loadAudit}>Load audit log</button>
        <button className="btn" onClick={loadAi}>Load AI config</button>
        {message && <p>{message}</p>}
        <ul>
          {customers.map((c) => (
            <li key={c.id}>
              {c.email ?? c.id}
              <button className="btn btn-primary" onClick={() => adjustQuota(c.id)}>+1 quota</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>AI providers (write-only secrets)</h2>
        <button className="btn btn-secondary" onClick={storeMockSecret}>Store mock API key</button>
        <ul>
          {aiProviders.map((p) => (
            <li key={p.id}>{p.displayName} — fingerprint {p.secretFingerprint ?? "none"}</li>
          ))}
        </ul>
        <h3>Routes</h3>
        <ul>
          {aiRoutes.map((r) => (
            <li key={r.id}>{r.taskType} — {r.status}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Audit events</h2>
        <ul>
          {audit.map((e, i) => (
            <li key={i}>{e.action} — {new Date(e.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
