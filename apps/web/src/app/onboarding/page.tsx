"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

export default function OnboardingPage() {
  const [path, setPath] = useState<"EXPERIENCED" | "FRESHER">("EXPERIENCED");
  const [name, setName] = useState("");
  const [titles, setTitles] = useState("Software Engineer");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api<Record<string, unknown>>("/onboarding").catch(() => {});
  }, []);

  async function savePath() {
    await api("/onboarding/path", { method: "PUT", json: { path } });
    setMessage("Path saved");
  }

  async function saveContact() {
    await api("/onboarding/contact", { method: "PUT", json: { preferredName: name } });
    setMessage("Contact saved");
  }

  async function saveTargets() {
    await api("/onboarding/targets", {
      method: "PUT",
      json: {
        titles: titles.split(",").map((t) => t.trim()),
        locations: ["Bangalore"],
        remoteModes: ["HYBRID", "REMOTE"],
      },
    });
    setMessage("Targets saved");
  }

  async function grantConsent() {
    await api("/onboarding/consent", { method: "POST" });
    setMessage("Consent granted");
  }

  async function complete() {
    const result = await api<{ completed: boolean; blockers?: Array<{ message: string }> }>(
      "/onboarding/complete",
      { method: "POST" },
    );
    if (result.completed) {
      setMessage("Onboarding complete!");
    } else {
      setMessage(result.blockers?.map((b) => b.message).join("; ") ?? "Incomplete");
    }
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Onboarding</h1>
        {message && <div className="alert alert-info" role="status">{message}</div>}
        <div className="card">
          <h2>1. Choose path</h2>
          <select value={path} onChange={(e) => setPath(e.target.value as "EXPERIENCED" | "FRESHER")}>
            <option value="EXPERIENCED">Experienced</option>
            <option value="FRESHER">Fresher / starting career</option>
          </select>
          <button className="btn btn-secondary" onClick={savePath}>Save path</button>
        </div>
        <div className="card">
          <h2>2. Contact</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preferred name" />
          <button className="btn btn-secondary" onClick={saveContact}>Save contact</button>
        </div>
        <div className="card">
          <h2>3. Target titles</h2>
          <input value={titles} onChange={(e) => setTitles(e.target.value)} placeholder="Comma-separated titles" />
          <button className="btn btn-secondary" onClick={saveTargets}>Save targets</button>
        </div>
        <div className="card">
          <h2>4. Consent & complete</h2>
          <button className="btn btn-secondary" onClick={grantConsent}>Grant consent</button>
          <button className="btn btn-primary" onClick={complete}>Complete onboarding</button>
        </div>
      </div>
    </main>
  );
}
