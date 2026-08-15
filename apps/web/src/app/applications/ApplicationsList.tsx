"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

type Application = {
  id: string;
  state: string;
  mode: string;
  job: { title: string; company: string };
  nextAction: string | null;
};

export default function ApplicationsList() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Application[]>([]);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    const query = params.toString();
    api<{ items: Application[] }>(`/applications${query ? `?${query}` : ""}`)
      .then((data) => setItems(data.items))
      .catch(console.error);
  }, [q, state]);

  function updateUrl() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    const path = params.toString() ? `/applications?${params.toString()}` : "/applications";
    window.history.replaceState(null, "", path);
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Applications</h1>
        <div className="form-group">
          <label htmlFor="app-search">Search</label>
          <input
            id="app-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={updateUrl}
          />
        </div>
        <div className="form-group">
          <label htmlFor="app-state">State filter</label>
          <select
            id="app-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              updateUrl();
            }}
          >
            <option value="">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="WAITING_FOR_USER">Waiting for you</option>
            <option value="QUEUED">Queued</option>
            <option value="NEEDS_REVIEW">Needs review</option>
          </select>
        </div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((app) => (
            <li key={app.id} className="card">
              <Link href={`/applications/${app.id}`}>
                <strong>{app.job.title}</strong> at {app.job.company}
              </Link>
              <br />
              <span className="status-badge">{app.state}</span>
              {app.nextAction && <span> — {app.nextAction}</span>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
