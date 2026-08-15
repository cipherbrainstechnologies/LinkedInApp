"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminMe } from "@/shared/api";
import { AdminShell } from "../../shared/AdminShell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi<AdminMe>("/admin/auth/me")
      .then(setAdmin)
      .catch((e) => setError(e.message));
  }, []);

  async function logout() {
    await adminApi("/admin/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (error) {
    return (
      <main className="af-container">
        <div className="af-alert af-alert-error" role="alert">{error}</div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="af-container af-stack" style={{ alignItems: "center", paddingTop: "4rem" }}>
        <div className="af-spinner" />
        <p className="af-muted">Loading admin console…</p>
      </main>
    );
  }

  return (
    <AdminShell admin={admin} onLogout={logout}>
      {children}
    </AdminShell>
  );
}
