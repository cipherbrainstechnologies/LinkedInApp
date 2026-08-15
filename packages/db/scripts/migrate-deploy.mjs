import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const rootEnv = resolve(import.meta.dirname, "../../../.env");
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (set in Railway Postgres plugin or .env)");
  process.exit(1);
}

execSync("prisma migrate deploy", {
  stdio: "inherit",
  cwd: resolve(import.meta.dirname, ".."),
});
