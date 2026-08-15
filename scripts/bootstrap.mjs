#!/usr/bin/env node
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

console.log("ApplyFlow bootstrap...");

if (!existsSync(".env") && !process.env.DATABASE_URL) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example");
}

const filters = [
  "@applyflow/config",
  "@applyflow/domain",
  "@applyflow/observability",
  "@applyflow/schemas",
  "@applyflow/storage",
  "@applyflow/auth",
  "@applyflow/ai",
  "@applyflow/db",
  "@applyflow/ui-web",
].map((f) => `--filter=${f}`).join(" ");

try {
  execSync("pnpm install", { stdio: "inherit" });
  execSync("pnpm db:generate", { stdio: "inherit" });
  execSync(`pnpm exec turbo run build ${filters}`, { stdio: "inherit" });
  console.log("Bootstrap complete — run pnpm db:migrate && pnpm db:seed before pnpm dev");
} catch (e) {
  console.error("Bootstrap failed:", e);
  process.exit(1);
}
