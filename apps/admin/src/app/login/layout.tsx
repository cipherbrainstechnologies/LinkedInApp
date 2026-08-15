import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main className="af-container">Loading…</main>}>{children}</Suspense>;
}
