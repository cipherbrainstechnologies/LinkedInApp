"use client";

import { Suspense } from "react";
import ApplicationsPage from "./ApplicationsList";

export default function Page() {
  return (
    <Suspense fallback={<main className="container">Loading applications…</main>}>
      <ApplicationsPage />
    </Suspense>
  );
}
