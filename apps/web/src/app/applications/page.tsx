"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Application = {
  id: string;
  state: string;
  mode: string;
  job: { title: string; company: string };
  nextAction: string | null;
};

export default function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ items: Application[] }>(`/applications?q=${encodeURIComponent(q)}`)
      .then((data) => setItems(data.items))
      .catch(console.error);
  }, [q]);

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Applications</h1>
        <div className="form-group">
          <label htmlFor="app-search">Search applications</label>
          <input id="app-search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((app) => (
            <li key={app.id} className="card">
              <Link href={`/applications/${app.id}`}>
                <strong>{app.job.title}</strong> at {app.job.company}
              </Link>
              <br />
              <span className="status-badge">{app.state}</span>
              {app.nextAction && <span> — Action: {app.nextAction}</span>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
