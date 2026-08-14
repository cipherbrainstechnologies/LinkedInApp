#!/usr/bin/env node
import { execSync } from "node:child_process";

console.log("Demo reset...");
execSync("pnpm db:migrate", { stdio: "inherit" });
execSync("pnpm db:seed", { stdio: "inherit" });
console.log("Demo reset complete.");
