# Spacefly.ai Deployment Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Spacefly.ai monorepo production-deployable on a single VPS using Docker Compose, Caddy HTTPS ingress, a single Kafka broker, Prisma migrations, and Resend email.

**Architecture:** Backend services build to Node ESM with `tsup`; Next.js apps build as standalone containers. Docker Compose runs Caddy as the only public entrypoint, routes `spacefly.ai`, `admin.spacefly.ai`, and `api.spacefly.ai`, and keeps backend services/Kafka internal. CI validates type checks, builds, and Docker image builds but does not push or SSH deploy in this pass.

**Tech Stack:** pnpm 9, Turbo, TypeScript, tsup, Next.js standalone output, Express, Fastify, Prisma, Docker Compose, Caddy, Apache Kafka KRaft, Resend, GitHub Actions.

---

## Execution Model

- Use a fresh worker subagent for each task below.
- Workers are not alone in the codebase; they must preserve existing changes and avoid reverting edits made by other workers.
- Run reviews after each task in this order: spec compliance review, then code quality review.
- Do not move to the next implementation task until both reviews approve or all important findings are fixed and re-reviewed.
- After all tasks, run final verification and a whole-change code review.

## Task 1: Runtime And Build Readiness

**Ownership:** backend service package files, service entrypoints, email-service mailer, Next configs, db package build metadata, lockfile.

**Files:**
- Modify: `apps/auth-service/package.json`
- Modify: `apps/product-service/package.json`
- Modify: `apps/order-service/package.json`
- Modify: `apps/email-service/package.json`
- Create/modify: `apps/{auth-service,product-service,order-service,email-service}/tsup.config.ts`
- Modify: `apps/{auth-service,product-service,order-service,email-service}/src/index.ts`
- Modify: `apps/email-service/src/utils/mailer.ts`
- Modify: `apps/{client,admin}/next.config.ts`
- Modify: `packages/db/package.json`
- Create/modify: `packages/db/tsconfig.build.json`
- Modify: `pnpm-lock.yaml`

- [ ] Add `build` and `start` scripts to all backend services. Use `build: "tsup"` and `start: "node dist/index.js"`.
- [ ] Add `tsup` as backend service devDependency and update `pnpm-lock.yaml`.
- [ ] Configure backend `tsup.config.ts` files with ESM, target `es2022`, clean dist, and bundle internal workspace packages except `@repo/db`.
- [ ] Make `@repo/db` build to `dist` with declarations and keep generated Prisma imports working in production.
- [ ] Add `output: "standalone"` to `apps/client/next.config.ts` and `apps/admin/next.config.ts`.
- [ ] Add `PORT` support to auth, product, order, and email services with defaults `8003`, `8000`, `8001`, and `8004`.
- [ ] Add `CORS_ORIGINS` parsing to auth, product, and order. Default to `http://localhost:3002,http://localhost:3003`.
- [ ] Add graceful shutdown to each service. Disconnect Kafka producers/consumers and close HTTP/Fastify servers.
- [ ] Add an email-service HTTP health server with `/health`.
- [ ] Replace nodemailer Gmail OAuth with Resend using `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- [ ] Update welcome email branding from E-commerce/Lama Dev to Spacefly.ai.
- [ ] Verify with `pnpm --filter auth-service build`, `pnpm --filter space-service build`, `pnpm --filter booking-service build`, `pnpm --filter email-service build`, and `pnpm check-types`.

## Task 2: Docker Compose, Images, And Caddy Ingress

**Ownership:** Dockerfiles, root Docker/Caddy files.

**Files:**
- Create: `.dockerignore`
- Create: `apps/{auth-service,product-service,order-service,email-service}/Dockerfile`
- Create: `apps/{client,admin}/Dockerfile`
- Create: `docker-compose.yml`
- Create: `Caddyfile`

- [ ] Add a root `.dockerignore` that excludes local dependencies, build outputs, git metadata, logs, and secret `.env` files while keeping `.env.example` files.
- [ ] Add backend multi-stage Dockerfiles built from repo root. Use pnpm through corepack, `turbo prune <package-name> --docker`, install pruned deps, run `pnpm --filter @repo/db db:generate`, build `@repo/db`, then build the service.
- [ ] Add frontend multi-stage Dockerfiles for `client` and `admin`. Use Next standalone output and pass required `NEXT_PUBLIC_*` values as build args.
- [ ] Add `docker-compose.yml` with Caddy public on `80`/`443`, one internal Kafka KRaft broker, auth/product/order/email services, client, admin, and optional Kafka UI behind a debug profile or localhost binding.
- [ ] Configure internal service environment for `DATABASE_URL`, JWT vars, `KAFKA_BROKERS=kafka:9092`, `CORS_ORIGINS`, and Resend.
- [ ] Configure Caddy routes: `spacefly.ai` to client, `admin.spacefly.ai` to admin, and `api.spacefly.ai` path routes to backend services.
- [ ] Add public Caddy health aliases `/health/auth`, `/health/product`, and `/health/order`.
- [ ] Verify with `docker compose config` and, if Docker is available, `docker compose build`.

## Task 3: Env, Migration, CI, And Local Deploy Script

**Ownership:** environment examples, Prisma migration, GitHub Actions, deploy script.

**Files:**
- Create: `.env.example`
- Modify: app `.env.example` files as needed
- Create: `packages/db/prisma/migrations/<timestamp>_init/migration.sql`
- Create: `.github/workflows/ci.yml`
- Create: `scripts/deploy.sh`

- [ ] Add root `.env.example` documenting production variables for Caddy, services, Next public URLs, Kafka, Prisma, JWT, Cloudinary, and Resend.
- [ ] Align service `.env.example` files with Resend, `PORT`, `KAFKA_BROKERS`, and `CORS_ORIGINS`; do not edit secret `.env` files.
- [ ] Generate a fresh initial Prisma migration from the current schema for a fresh database and commit the migration SQL.
- [ ] Add a CI workflow for PRs and pushes to `main`: pnpm install, Prisma generate, type checks, Next builds, backend builds, and Docker config/build validation where feasible.
- [ ] Add `scripts/deploy.sh` with `build`, `up`, `migrate`, `health`, and `logs` subcommands for local/VPS operation. Do not add SSH automation.
- [ ] Verify with `pnpm --filter @repo/db db:generate`, `pnpm --filter @repo/db db:deploy` only against a configured target when safe, `pnpm check-types`, and shell syntax checking for `scripts/deploy.sh`.

## Final Verification

- [ ] Run `pnpm install` if lockfile or dependencies changed.
- [ ] Run `pnpm check-types`.
- [ ] Run `pnpm build`.
- [ ] Run `docker compose config`.
- [ ] Run `docker compose build` if Docker is available.
- [ ] Start the stack with `docker compose up -d` if Docker is available and environment values are configured.
- [ ] Check public routes or local equivalents for client, admin, and health endpoints.
- [ ] Run whole-change spec and code quality reviews.
