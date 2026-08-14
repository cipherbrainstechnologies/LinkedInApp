#!/usr/bin/env node
console.log("Waiting for local services (PostgreSQL, Redis)...");
console.log("Ensure PostgreSQL and Redis are running on localhost.");
console.log("For full stack: docker compose -f infra/compose.yaml up -d");
process.exit(0);
