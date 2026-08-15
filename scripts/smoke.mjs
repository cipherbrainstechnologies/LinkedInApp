#!/usr/bin/env node
import { execSync } from "node:child_process";

async function waitFor(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const apiHealth = await waitFor("http://localhost:4000/health");
if (!apiHealth) {
  console.error("API health check failed — start with pnpm dev");
  process.exit(1);
}

console.log("API healthy");

try {
  execSync("pnpm --filter @applyflow/domain test", { stdio: "inherit" });
  execSync("pnpm --filter @applyflow/config test", { stdio: "inherit" });
  execSync("pnpm --filter @applyflow/api test:integration", { stdio: "inherit" });
  console.log("Smoke tests passed.");
} catch {
  console.error("Smoke tests failed");
  process.exit(1);
}
