"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { PageHeader } from "@applyflow/ui-web";

export default function ApplicationsOpsPage() {
  const [apps, setApps] = useState<Array<{
    id: string;
    state: string;
    mode: string;
    userEmail: string | null;
    jobTitle: string;
    company: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    adminApi<{ applications: typeof apps }>("/admin/applications").then((d) => setApps(d.applications));
  }, []);

  return (
    <div className="af-stack">
      <PageHeader title="Applications" description="Operational view of candidate submissions" />
      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job</th>
              <th>State</th>
              <th>Mode</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.userEmail ?? "—"}</td>
                <td>{a.jobTitle} @ {a.company}</td>
                <td>{a.state}</td>
                <td>{a.mode}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
