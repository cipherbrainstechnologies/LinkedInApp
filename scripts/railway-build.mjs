#!/usr/bin/env node
/**
 * Railway build helper — run from repository root.
 * Usage: node scripts/railway-build.mjs <service>
 * Services: api | web | admin | worker | mock-providers
 */
import { execSync } from "node:child_process";

const service = process.argv[2];
const map = {
  api: "@applyflow/api",
  web: "@applyflow/web",
  admin: "@applyflow/admin",
  worker: "@applyflow/worker",
  "mock-providers": "@applyflow/mock-providers",
};

const pkg = map[service];
if (!pkg) {
  console.error(`Unknown service: ${service}. Use one of: ${Object.keys(map).join(", ")}`);
  process.exit(1);
}

console.log(`Railway build: ${pkg}`);
execSync("corepack enable", { stdio: "inherit" });
execSync("pnpm install --frozen-lockfile", { stdio: "inherit" });
execSync("pnpm bootstrap", { stdio: "inherit" });
execSync(`pnpm --filter ${pkg} build`, { stdio: "inherit" });
console.log(`Build complete: ${pkg}`);
