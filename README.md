ApplyFlow

Apply faster without losing control or accuracy.

ApplyFlow is a responsive job-application management platform for candidates and administrators. The local environment runs with deterministic demo authentication and mock external providers, allowing the complete demo flow to run without production credentials.

Contents

Features

Prerequisites

Quick start — Windows PowerShell

Quick start — macOS/Linux

Run the applications

Local services

Demo sign-in

Environment configuration

Commands

Architecture

Verification

Stopping and resetting

Troubleshooting

Important product boundaries

Features

Experienced-candidate and fresher onboarding flows

Multiple resume uploads with one active resume at a time

Candidate profile, contact details and job preferences

Searchable application history and status tracking

Free and paid application quotas

Subscription and quota-ledger foundations

Admin management for users, products, plans, quotas and reporting

Admin-controlled AI-provider configuration

LinkedIn OpenID Connect boundary with assisted application workflows

Mock providers for local demo and automated testing

Prerequisites

Required:

Node.js 22 or newer

pnpm through an up-to-date Corepack installation

Docker Desktop with Docker Compose

Docker Compose supplies the following local dependencies:

PostgreSQL 16

Redis 7

MinIO

Mailpit

Separate installations of those services are not required when Docker Desktop is used.

Check Node.js and pnpm

node --version
corepack --version
pnpm --version

If Corepack reports a signing-key error, update it without disabling integrity verification:

npm install --global corepack@latest
corepack enable
pnpm --version

Do not use COREPACK_INTEGRITY_KEYS=0.

Quick start — Windows PowerShell

Run these commands from the repository root.

cd D:\LinkedInApp-main\LinkedInApp-main

corepack enable

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

pnpm bootstrap

# Prisma currently runs from packages/db and loads this package-level file.
Copy-Item .env packages\db\.env -Force

docker compose -f infra/compose.yaml up -d --wait
docker compose -f infra/compose.yaml ps

pnpm db:migrate

Run the seed only after the migration succeeds:

pnpm db:seed

The PostgreSQL row in docker compose ps should contain:

127.0.0.1:55432->5432/tcp

Prisma should report:

PostgreSQL database "applyflow", schema "public" at "127.0.0.1:55432"

Quick start — macOS/Linux

Run these commands from the repository root:

corepack enable

test -f .env || cp .env.example .env

pnpm bootstrap

# Prisma currently runs from packages/db and loads this package-level file.
cp .env packages/db/.env

docker compose -f infra/compose.yaml up -d --wait
docker compose -f infra/compose.yaml ps

pnpm db:migrate
pnpm db:seed

Run the applications

Recommended local start

Start the web application, admin application, API and mock providers:

pnpm dev

Start the background worker in a second terminal:

cd D:\LinkedInApp-main\LinkedInApp-main
pnpm --filter @applyflow/worker dev

Start services individually

Use separate terminals when individual logs are required:

pnpm --filter @applyflow/api dev

pnpm --filter @applyflow/worker dev

pnpm --filter @applyflow/web dev

pnpm --filter @applyflow/admin dev

Local services

Service

Local address

Purpose

Candidate application

http://localhost:3000

User-facing web application

Candidate login

http://localhost:3000/login

Demo persona selection

Admin application

http://localhost:3001

Administration interface

API

http://localhost:4000

Backend API

Public API base

http://localhost:4000/v1

Versioned API routes

Mock providers

http://localhost:4100

Local provider simulations

PostgreSQL

127.0.0.1:55432

Application database

Redis

localhost:6379

Queues and transient state

MinIO API

http://localhost:9000

Local S3-compatible storage

MinIO console

http://localhost:9001

Storage administration

Mailpit SMTP

localhost:1025

Local email delivery

Mailpit UI

http://localhost:8025

Local email preview

PostgreSQL uses port 5432 inside its container and port 55432 on the host. The different host port avoids collisions with existing PostgreSQL installations.

Demo sign-in

Open http://localhost:3000/login and select a demo persona. No password is required while DEMO_AUTH_ENABLED=true and the application is running in the local environment.

Persona

Email

Experienced — free

experienced.free@demo.applyflow.local

Experienced — Launch paid plan

experienced.launch@demo.applyflow.local

Fresher — free

fresher.free@demo.applyflow.local

Admin access

Open http://localhost:3001.

Local admin API requests use this header:

x-admin-email: support@demo.applyflow.local

If the local admin application does not add the header automatically, configure it for localhost:3001 with a browser request-header extension such as ModHeader.

Demo authentication must remain disabled in production.

Environment configuration

Create .env from .env.example. The local demo should contain these core values:

NODE_ENV=development
APP_ENV=local

API_URL=http://localhost:4000
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:4000/v1

DATABASE_URL=postgresql://applyflow:applyflow@127.0.0.1:55432/applyflow?schema=public
REDIS_URL=redis://localhost:6379

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=applyflow
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

SESSION_SECRET=local-dev-session-secret-min-32-chars!!
JWT_ACCESS_SECRET=local-dev-jwt-access-secret-min-32!!
ENCRYPTION_KEY=local-dev-encryption-key-32chars!!

DEMO_AUTH_ENABLED=true
MOCK_PROVIDERS_URL=http://localhost:4100

LINKEDIN_OIDC_ENABLED=false
OPENAI_ENABLED=false
ANTHROPIC_ENABLED=false
STRIPE_ENABLED=false
RAZORPAY_ENABLED=false

API_PORT=4000
WEB_PORT=3000
ADMIN_PORT=3001
MOCK_PROVIDERS_PORT=4100

OIDC_ISSUER_URL=http://localhost:4100/oidc
OIDC_CLIENT_ID=applyflow-local
OIDC_CLIENT_SECRET=local-oidc-secret-min-16
OIDC_WEB_REDIRECT_URI=http://localhost:4000/v1/auth/oidc/callback
JWT_ACCESS_TTL_SECONDS=900

LOCAL_STORAGE_PATH=./uploads
OTEL_ENABLED=false

Whenever the root .env is changed, synchronise the Prisma package copy:

Copy-Item .env packages\db\.env -Force

Do not commit .env or production secrets.

Provider modes

The default local environment deliberately disables production integrations:

Variable

Local value

Behaviour

LINKEDIN_OIDC_ENABLED

false

Uses the local/demo authentication path

OPENAI_ENABLED

false

Does not call the OpenAI API

ANTHROPIC_ENABLED

false

Does not call the Anthropic API

STRIPE_ENABLED

false

Does not create real Stripe payments

RAZORPAY_ENABLED

false

Does not create real Razorpay payments

Production adapters must only be enabled after the corresponding credentials, webhook validation, operational controls and environment-specific secrets are configured.

Commands

Command

Description

pnpm bootstrap

Install workspace dependencies and generate the Prisma client

pnpm db:generate

Generate the Prisma client

pnpm db:migrate

Apply committed database migrations

pnpm db:seed

Seed deterministic demo data

pnpm dev

Run the web app, admin app, API and mock providers in parallel

pnpm --filter @applyflow/worker dev

Run the background worker

pnpm verify

Run linting, type checking, tests and builds

pnpm demo:reset

Apply migrations and restore demo seed data

pnpm demo:smoke

Run demo smoke tests

Architecture

ApplyFlow uses a TypeScript monorepo with a modular backend, background processing and shared business rules.

Location

Responsibility

apps/web

Candidate Next.js application

apps/admin

Admin Next.js application

apps/api

NestJS/Fastify API

apps/worker

Outbox and connector background worker

packages/domain

Framework-independent business rules

packages/db

Prisma schema, migrations, seed and database client

infra

Local infrastructure and Docker Compose

docs

Product, architecture, delivery and testing specifications

See docs/BUILD_STATUS.md for current implementation status and the remaining execution scope.

Verification

After the applications and worker are running, execute:

pnpm demo:smoke
pnpm verify

The intended verification sequence is:

Infrastructure is healthy.

Database migration succeeds.

Demo seed succeeds.

API, mock providers, web and admin applications start.

The worker starts and connects to PostgreSQL and Redis.

Demo smoke tests pass.

The full verification suite passes.

Stopping and resetting

Stop local infrastructure and preserve data

docker compose -f infra/compose.yaml down

Start it again

docker compose -f infra/compose.yaml up -d --wait

Permanently delete local demo data

The following command removes the ApplyFlow PostgreSQL and MinIO Docker volumes. Use it only when a complete local reset is intended:

docker compose -f infra/compose.yaml down -v --remove-orphans
docker compose -f infra/compose.yaml up -d --wait
Copy-Item .env packages\db\.env -Force
pnpm db:migrate
pnpm db:seed

Troubleshooting

PowerShell does not recognise DATABASE_URL=...

This is Bash syntax and is not a valid standalone PowerShell command.

Use:

$env:DATABASE_URL = "postgresql://applyflow:applyflow@127.0.0.1:55432/applyflow?schema=public"

To remove a process-level override and return to the value from .env:

Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue

Prisma reports that DATABASE_URL is missing

Prisma currently executes from packages/db and loads packages/db/.env.

Copy-Item .env packages\db\.env -Force
pnpm db:migrate

Confirm that Windows did not create .env.txt:

Get-ChildItem -Force .env*
Get-ChildItem -Force packages\db\.env*

Prisma reports P1000 authentication failure

First confirm that both environment files use port 55432:

Select-String -Path .env,packages\db\.env -Pattern "^DATABASE_URL="

The expected value is:

DATABASE_URL=postgresql://applyflow:applyflow@127.0.0.1:55432/applyflow?schema=public

Confirm the published Docker port:

docker compose -f infra/compose.yaml ps

The PostgreSQL service should show:

127.0.0.1:55432->5432/tcp

If a previous PowerShell value is overriding .env, run:

Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Copy-Item .env packages\db\.env -Force
pnpm db:migrate

Do not run pnpm db:seed until the migration succeeds.

Check whether a port is already occupied

Get-NetTCPConnection -LocalPort 55432 -State Listen -ErrorAction SilentlyContinue

To inspect a returned process:

Get-Process -Id <PID> | Select-Object Id, ProcessName, Path

Docker services are not healthy

docker compose -f infra/compose.yaml ps
docker compose -f infra/compose.yaml logs postgres
docker compose -f infra/compose.yaml logs redis
docker compose -f infra/compose.yaml logs minio
docker compose -f infra/compose.yaml logs mailpit

Prisma 7 configuration warning

The package.json#prisma deprecation message is a warning from Prisma 6. It does not block migration, seeding or local startup. Migration to prisma.config.ts should be handled as a separate dependency upgrade and tested before Prisma 7 adoption.

Node.js url.parse() warning

The Node.js deprecation warning does not block the current bootstrap. Track the dependency producing it and upgrade that dependency separately after verifying the workspace.

Important product boundaries

LinkedIn supports OpenID Connect sign-in only; ApplyFlow does not scrape LinkedIn or perform unauthorised automated LinkedIn submissions.

AI-generated extraction and application content remains a draft until the user confirms it.

Application quotas use an append-only ledger.

Production AI and payment providers remain disabled until explicitly configured.

External-site automation must respect site policies, user consent and manual-action boundaries.

Demo authentication and local secrets must never be enabled in production.

Documentation

The docs/ directory contains the complete product and execution specifications, including:

Product requirements and business rules

Candidate and admin UX specifications

Architecture and database design

API and provider contracts

Security and privacy controls

Subscription, proration and quota behaviour

Acceptance criteria and test strategy

Demo and delivery runbooks

Use docs/BUILD_STATUS.md as the implementation-progress source of truth.
