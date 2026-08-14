import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="container">
      <h1>ApplyFlow</h1>
      <p>Apply faster without losing control or accuracy.</p>
      <div className="card">
        <h2>Get started</h2>
        <p>Sign in with a demo persona to explore the full application flow.</p>
        <Link href="/login" className="btn btn-primary">Sign in</Link>
      </div>
    </main>
  );
}
