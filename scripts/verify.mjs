#!/usr/bin/env node
import { execSync } from "node:child_process";

const steps = [
  ["lint", "pnpm lint"],
  ["typecheck", "pnpm typecheck"],
  ["test", "pnpm test"],
  ["build", "pnpm build"],
  ["integration", "pnpm test:integration"],
];

let failed = false;
for (const [name, cmd] of steps) {
  console.log(`\n=== verify: ${name} ===`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch {
    console.error(`FAILED: ${name}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("\nAll verify steps passed.");
