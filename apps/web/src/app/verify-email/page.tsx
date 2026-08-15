"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/shared/Nav";
import { api } from "@/shared/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function sendCode() {
    setMessage(null);
    await api("/auth/email/start", { method: "POST", json: { email } });
    setMessage("Verification code sent. In local demo, check API logs for the code.");
  }

  async function verify() {
    setMessage(null);
    await api("/auth/email/verify", { method: "POST", json: { code } });
    setMessage("Email verified. You can continue onboarding.");
    setTimeout(() => router.push("/onboarding"), 1500);
  }

  return (
    <main>
      <Nav />
      <div className="container">
        <h1>Verify your email</h1>
        <p>LinkedIn did not provide a verified email. Add one to continue.</p>
        <div className="card">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={sendCode}>Send code</button>
        </div>
        <div className="card">
          <div className="form-group">
            <label htmlFor="code">Verification code</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={verify}>Verify</button>
        </div>
        {message && <p className="alert alert-info" role="status">{message}</p>}
      </div>
    </main>
  );
}
