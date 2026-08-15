"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/shared/api";
import { Card, PageHeader } from "@applyflow/ui-web";

type Customer = {
  id: string;
  email: string | null;
  onboardingState: string;
  onboardingPath: string | null;
  status: string;
  planName: string;
  createdAt: string;
};

export default function UsersPage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    adminApi<{ customers: Customer[]; total: number }>(`/admin/customers?${query}`)
      .then((d) => {
        setCustomers(d.customers);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="af-stack">
      <PageHeader title="Registered users" description={`${total} accounts in directory`} />
      <Card>
        <label className="af-stack" style={{ maxWidth: "400px" }}>
          <span className="af-muted">Search by email</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        </label>
      </Card>
      {loading ? (
        <div className="af-spinner" />
      ) : (
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Plan</th>
                <th>Onboarding</th>
                <th>Status</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.planName}</td>
                  <td>{c.onboardingPath ?? "—"} · {c.onboardingState}</td>
                  <td>{c.status}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/users/${c.id}`} className="af-btn af-btn-ghost">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
