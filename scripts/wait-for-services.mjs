#!/usr/bin/env node
import { execSync } from "node:child_process";

const composeFile = "infra/compose.yaml";

async function waitFor(url, maxAttempts = 60) {
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

console.log("Starting Docker infrastructure...");
try {
  execSync(`docker compose -f ${composeFile} up -d --wait`, { stdio: "inherit" });
} catch {
  console.error("Docker compose failed — ensure Docker is running.");
  process.exit(1);
}

const pgReady = await waitFor("http://127.0.0.1:55432", 1).catch(() => false);
// Postgres does not serve HTTP; rely on compose --wait
console.log("Infrastructure ready (PostgreSQL :55432, Redis :6379, MinIO, Mailpit).");
