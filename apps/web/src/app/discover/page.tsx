"use client";

import { Suspense } from "react";
import { CandidatePage } from "@/shared/Nav";
import { Skeleton, Card } from "@applyflow/ui-web";
import DiscoverJobs from "./DiscoverJobs";

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <CandidatePage>
          <Card><Skeleton lines={3} /></Card>
        </CandidatePage>
      }
    >
      <DiscoverJobs />
    </Suspense>
  );
}
