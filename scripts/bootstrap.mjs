#!/usr/bin/env node
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

console.log("ApplyFlow bootstrap...");

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example");
}

try {
  execSync("pnpm install", { stdio: "inherit" });
  execSync("pnpm db:generate", { stdio: "inherit" });
  console.log("Bootstrap complete.");
} catch (e) {
  console.error("Bootstrap failed:", e);
  process.exit(1);
}
