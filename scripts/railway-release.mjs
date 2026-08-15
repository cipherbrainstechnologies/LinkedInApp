#!/usr/bin/env node
/** Apply Prisma migrations on Railway (pre-deploy / release phase). */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for migrations");
  process.exit(1);
}

console.log("Running Prisma migrate deploy…");
execSync("pnpm db:migrate", { stdio: "inherit" });
console.log("Migrations complete.");
