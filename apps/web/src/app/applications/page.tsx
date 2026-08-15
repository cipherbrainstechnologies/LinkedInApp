"use client";

import { Suspense } from "react";
import { CandidatePage } from "@/shared/Nav";
import { Card, Skeleton } from "@applyflow/ui-web";
import ApplicationsPage from "./ApplicationsList";

export default function Page() {
  return (
    <Suspense
      fallback={
        <CandidatePage>
          <Card><Skeleton lines={3} /></Card>
        </CandidatePage>
      }
    >
      <ApplicationsPage />
    </Suspense>
  );
}
