"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/shared/api";
import { PageHeader } from "@applyflow/ui-web";

export default function AuditPage() {
  const [events, setEvents] = useState<Array<{ action: string; createdAt: string; actorType: string }>>([]);

  useEffect(() => {
    adminApi<{ events: typeof events }>("/admin/audit").then((d) => setEvents(d.events));
  }, []);

  return (
    <div className="af-stack">
      <PageHeader title="Audit log" description="Immutable admin and system events" />
      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td>{e.action}</td>
                <td>{e.actorType}</td>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
