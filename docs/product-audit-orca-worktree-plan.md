# Spacefly Orca Parallel Product Audit Plan

> **For Orca agentic workers:** Open each audit phase in its own Orca-managed git worktree and launch one Codex instance per phase. Workers must read this file before auditing. Each worker tracks progress with checkbox syntax in its own result file.

**Goal:** Audit every major part of Spacefly for bugs, errors, regressions, security issues, UX problems, missing tests, and improvement opportunities while allowing parallel low-risk fixes.

**Architecture:** Orca owns worktree creation and branch isolation. Each phase gets a dedicated branch, a bounded subsystem scope, a copy-paste Codex prompt, and one required audit result document under `docs/audit-results/`. Workers may fix small local defects in their phase branch and must document larger or cross-cutting work as findings.

**Tech Stack:** pnpm 9, Turborepo, Next.js client and admin apps, Express product and auth services, Fastify booking service, Prisma/PostgreSQL, Kafka, MinIO/S3 uploads, Docker Compose, Caddy/nginx deployment.

---

## Operating Rules

### Orca Worktree Policy

- Use **Orca-managed worktrees**. Do not require a project-local `.worktrees/` directory for this audit.
- Create one worktree per phase branch listed below.
- Run workers in parallel when their scopes do not overlap.
- Do not let two workers edit the same files unless one worker is explicitly doing final synthesis.
- If Orca asks for a branch name, use the exact branch names in this document.

### Fix Policy

Workers run in **audit then fix** mode.

Allowed fixes:
- Local type errors, broken imports, incorrect constants, obvious null/undefined guards.
- Small validation gaps that affect only the phase scope.
- Broken tests or missing targeted tests for a found defect.
- Documentation corrections for facts verified in the repo.

Do not implement without separate approval:
- Broad refactors.
- Prisma schema or migration changes.
- Large UI redesigns.
- Cross-service behavior changes.
- Auth, payment, booking, or data-deletion changes with uncertain blast radius.
- Dependency upgrades.
- Formatting-only sweeps across unrelated files.

### Required Priority Labels

- `P0`: Production-breaking issue, data loss, security/auth bypass, or inability to deploy.
- `P1`: Broken core user flow or major user-facing regression.
- `P2`: Medium bug, confusing UX, missing validation, brittle behavior, or important missing test.
- `P3`: Cleanup, polish, performance, maintainability, or documentation improvement.

### Required Result File Format

Every worker must write one result file:

```md
# <Phase Name> Audit Results

## Checks Run
- `<command>`: pass/fail and important output summary

## Fixes Applied
- Files changed and why

## Findings
- `P1` Title
  - Area:
  - Evidence:
  - Reproduction:
  - Recommendation:

## Follow-Up Recommendations
- Ranked next actions

## Files Reviewed
- Paths inspected
```

If a worker applies fixes, it must include the changed file list in the final Orca/Codex response.

### Baseline Commands

Workers should run the relevant subset of these commands. Do not run commands that require unavailable secrets unless the phase specifically verifies environment setup.

```bash
pnpm check-types
pnpm build
pnpm --filter admin test
pnpm --filter space-service test
pnpm --filter admin check-types
pnpm --filter client check-types
pnpm --filter space-service check-types
pnpm --filter auth-service check-types
pnpm --filter @repo/auth-middleware typecheck
pnpm --filter booking-service check-types
pnpm --filter email-service check-types
```

Use targeted commands first. Full `pnpm build` can be expensive and may depend on env vars.

---

## Phase 0: Baseline Product Map

**Branch:** `audit-phase-0-baseline`

**Result file:** `docs/audit-results/phase-0-baseline.md`

**Scope:**
- Repository structure and package map.
- Scripts, build/test commands, env assumptions, and known baseline failures.
- Confirm which checks are safe for later workers.
- Identify stale docs that could mislead workers.

**Inspect:**
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `docker-compose.yml`
- `apps/*/package.json`
- `packages/*/package.json`
- `docs/`

**Suggested checks:**

```bash
pnpm check-types
pnpm --filter admin test
pnpm --filter space-service test
```

**Worker prompt:**

```text
You are auditing Spacefly Phase 0: Baseline Product Map in branch audit-phase-0-baseline, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- README.md
- package.json
- pnpm-workspace.yaml
- turbo.json
- docker-compose.yml
- apps/*/package.json
- packages/*/package.json
- existing docs under docs/

Your job:
1. Build a concise product and repo map for later audit workers.
2. Run safe baseline checks and record exact pass/fail outcomes.
3. Identify stale or misleading setup docs, scripts, package names, or command assumptions.
4. Fix only low-risk docs or script-name mistakes if they are unambiguous.
5. Write docs/audit-results/phase-0-baseline.md using the required result format.

Do not change product behavior. Do not run migrations. Do not create manual git worktrees.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 1: Client Public Experience

**Branch:** `audit-phase-1-client-public`

**Result file:** `docs/audit-results/phase-1-client-public.md`

**Scope:**
- Public customer-facing app.
- Landing page, browse/search, filters, maps, space cards, space detail, booking entry, auth screens, localization, responsive UI.
- API client usage and error/loading/empty states.

**Inspect:**
- `apps/client/src/app/[locale]/(main)/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`
- `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx`
- `apps/client/src/app/[locale]/(auth)/login/page.tsx`
- `apps/client/src/app/[locale]/(auth)/register/page.tsx`
- `apps/client/src/components/`
- `apps/client/src/lib/`
- `apps/client/src/stores/`
- `apps/client/src/i18n/`

**Suggested checks:**

```bash
pnpm --filter client check-types
pnpm --filter client build
```

If services are available in Orca, also run the client locally and manually inspect desktop and mobile widths.

**Worker prompt:**

```text
You are auditing Spacefly Phase 1: Client Public Experience in branch audit-phase-1-client-public, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- apps/client/package.json
- apps/client/src/app/[locale]/(main)/page.tsx
- apps/client/src/app/[locale]/(main)/spaces/page.tsx
- apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx
- apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx
- apps/client/src/components/
- apps/client/src/lib/
- apps/client/src/i18n/

Your job:
1. Audit the public customer journey from landing page to browsing, viewing a space, and starting a booking.
2. Check responsive layout, loading states, empty states, API failure behavior, localization routing, and obvious accessibility issues.
3. Run relevant client type/build checks and record exact outcomes.
4. Fix only local low-risk defects in the client app.
5. Write docs/audit-results/phase-1-client-public.md using the required result format.

Do not change admin, backend services, Prisma schema, or deployment files unless documenting a finding.
Do not create broad design changes. Keep UI fixes minimal and tied to a reproduced issue.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 2: Admin and Host Workflows

**Branch:** `audit-phase-2-admin-host`

**Result file:** `docs/audit-results/phase-2-admin-host.md`

**Scope:**
- Admin app and host dashboard.
- Host venue/space creation and editing.
- Admin amenities, categories, spaces, users, bookings, exchange rates.
- Auth-protected admin/host routing and role-sensitive UI.

**Inspect:**
- `apps/admin/src/app/(dashboard)/`
- `apps/admin/src/app/(auth)/`
- `apps/admin/src/components/spaces/`
- `apps/admin/src/components/venues/`
- `apps/admin/src/components/ui/`
- `apps/admin/src/stores/`
- `apps/admin/src/lib/`

**Suggested checks:**

```bash
pnpm --filter admin test
pnpm --filter admin check-types
pnpm --filter admin build
```

**Worker prompt:**

```text
You are auditing Spacefly Phase 2: Admin and Host Workflows in branch audit-phase-2-admin-host, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- apps/admin/package.json
- apps/admin/src/app/(dashboard)/
- apps/admin/src/app/(auth)/
- apps/admin/src/components/spaces/
- apps/admin/src/components/venues/
- apps/admin/src/components/ui/
- apps/admin/src/stores/
- apps/admin/src/lib/

Your job:
1. Audit host and admin workflows for broken forms, bad validation, missing loading/error states, incorrect role assumptions, and data-shape mismatches with backend APIs.
2. Run admin tests, type checks, and build where feasible.
3. Fix only low-risk admin-local bugs with targeted tests when practical.
4. Write docs/audit-results/phase-2-admin-host.md using the required result format.

Do not change backend API contracts, Prisma schema, or public client behavior unless documenting a finding.
Do not redesign dashboards; only fix reproduced defects.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 3: Product Service APIs

**Branch:** `audit-phase-3-product-service`

**Result file:** `docs/audit-results/phase-3-product-service.md`

**Scope:**
- Product service API behavior.
- Spaces, venues, categories, amenities, uploads, currencies, reviews.
- Validation, auth boundaries, query params, pagination/search/filter behavior, upload safety, translation/currency helpers.

**Inspect:**
- `apps/product-service/src/index.ts`
- `apps/product-service/src/routes/`
- `apps/product-service/src/controllers/`
- `apps/product-service/src/lib/`
- `apps/product-service/src/middleware/`
- `apps/product-service/src/utils/`
- `packages/types/src/`

**Suggested checks:**

```bash
pnpm --filter space-service test
pnpm --filter space-service check-types
pnpm --filter space-service build
```

**Worker prompt:**

```text
You are auditing Spacefly Phase 3: Product Service APIs in branch audit-phase-3-product-service, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- apps/product-service/package.json
- apps/product-service/src/index.ts
- apps/product-service/src/routes/
- apps/product-service/src/controllers/
- apps/product-service/src/lib/
- apps/product-service/src/middleware/
- apps/product-service/src/utils/
- packages/types/src/

Your job:
1. Audit product-service routes for validation bugs, auth gaps, data-shape mismatches, incorrect status codes, unsafe uploads, and broken search/filter behavior.
2. Run product-service tests, type checks, and build where feasible.
3. Add or update focused tests for any low-risk API bug you fix.
4. Write docs/audit-results/phase-3-product-service.md using the required result format.

Do not change Prisma schema or generated client. Do not change frontend callers except to document mismatches as findings.
Do not make cross-service behavior changes in this branch.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 4: Booking Service

**Branch:** `audit-phase-4-booking-service`

**Result file:** `docs/audit-results/phase-4-booking-service.md`

**Scope:**
- Booking lifecycle and service API.
- Price calculation, date/time logic, booking status transitions, cancellation/completion behavior, host/guest access checks, Kafka subscriptions.

**Inspect:**
- `apps/order-service/package.json`
- `apps/order-service/src/index.ts`
- `apps/order-service/src/routes/booking.ts`
- `apps/order-service/src/utils/`
- `packages/types/src/booking.ts`
- `packages/db/prisma/schema.prisma` booking-related models only

**Suggested checks:**

```bash
pnpm --filter booking-service check-types
pnpm --filter booking-service build
```

**Worker prompt:**

```text
You are auditing Spacefly Phase 4: Booking Service in branch audit-phase-4-booking-service, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- apps/order-service/package.json
- apps/order-service/src/index.ts
- apps/order-service/src/routes/booking.ts
- apps/order-service/src/utils/
- packages/types/src/booking.ts
- booking-related models in packages/db/prisma/schema.prisma

Your job:
1. Audit booking creation, authorization, date/time handling, pricing, status transitions, cancellations, and Kafka side effects.
2. Run booking-service type/build checks.
3. Fix only low-risk local booking-service bugs with targeted tests if practical.
4. Write docs/audit-results/phase-4-booking-service.md using the required result format.

Do not change Prisma schema, product-service routes, client booking UI, or shared auth middleware unless documenting a finding.
Treat booking and money logic as high risk: document uncertain fixes instead of implementing them.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 5: Auth, Users, and Security Boundaries

**Branch:** `audit-phase-5-auth-users`

**Result file:** `docs/audit-results/phase-5-auth-users.md`

**Scope:**
- Auth service routes.
- User management routes.
- Shared auth middleware and password/JWT helpers.
- Client/admin auth stores and protected route assumptions.
- Role and session behavior.

**Inspect:**
- `apps/auth-service/src/index.ts`
- `apps/auth-service/src/routes/`
- `apps/auth-service/src/middleware/`
- `apps/auth-service/src/utils/`
- `packages/auth-middleware/src/`
- `apps/client/src/stores/authStore.ts`
- `apps/client/src/lib/auth.ts`
- `apps/admin/src/stores/authStore.ts`
- `apps/admin/src/lib/auth.ts`
- `apps/client/src/middleware.ts`
- `apps/admin/src/middleware.ts`

**Suggested checks:**

```bash
pnpm --filter auth-service check-types
pnpm --filter auth-service build
pnpm --filter @repo/auth-middleware typecheck
pnpm --filter @repo/auth-middleware build
```

**Worker prompt:**

```text
You are auditing Spacefly Phase 5: Auth, Users, and Security Boundaries in branch audit-phase-5-auth-users, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- apps/auth-service/package.json
- apps/auth-service/src/index.ts
- apps/auth-service/src/routes/
- apps/auth-service/src/middleware/
- apps/auth-service/src/utils/
- packages/auth-middleware/src/
- apps/client/src/stores/authStore.ts
- apps/client/src/lib/auth.ts
- apps/admin/src/stores/authStore.ts
- apps/admin/src/lib/auth.ts
- apps/client/src/middleware.ts
- apps/admin/src/middleware.ts

Your job:
1. Audit login, registration, sessions, roles, middleware, password handling, JWT handling, and user-management authorization.
2. Look for security-sensitive bugs and classify them carefully.
3. Run auth-service and auth-middleware checks.
4. Fix only obvious low-risk auth bugs. Document security-sensitive or uncertain changes as findings.
5. Write docs/audit-results/phase-5-auth-users.md using the required result format.

Do not weaken authorization to make flows pass. Do not change token semantics without separate approval.
Security findings must include evidence and reproduction steps without exposing real secrets.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 6: Database, Prisma, and Shared Types

**Branch:** `audit-phase-6-db-data`

**Result file:** `docs/audit-results/phase-6-db-data.md`

**Scope:**
- Prisma schema, migrations, generated client assumptions, seed data, shared type definitions.
- Relations, cascade behavior, indexes, enum usage, JSON fields, currency/translation/booking type consistency.

**Inspect:**
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/`
- `packages/db/prisma/seed.ts`
- `packages/db/src/`
- `packages/types/src/`
- API/client/admin references to Prisma enum values and shared types

**Suggested checks:**

```bash
pnpm --filter @repo/db build
pnpm --filter @repo/types check-types
```

Only run Prisma commands that do not mutate the database unless explicitly approved.

**Worker prompt:**

```text
You are auditing Spacefly Phase 6: Database, Prisma, and Shared Types in branch audit-phase-6-db-data, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- packages/db/package.json
- packages/db/prisma/schema.prisma
- packages/db/prisma/migrations/
- packages/db/prisma/seed.ts
- packages/db/src/
- packages/types/package.json
- packages/types/src/

Your job:
1. Audit schema consistency, relation behavior, indexes, enum usage, generated-client assumptions, seed data, and shared type alignment.
2. Search for app code that disagrees with schema or shared type definitions.
3. Run db and types package checks.
4. Fix only low-risk type/export issues. Document schema, migration, and data-shape changes as findings unless explicitly approved.
5. Write docs/audit-results/phase-6-db-data.md using the required result format.

Do not run migrations. Do not edit generated Prisma client files. Do not change schema without separate approval.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 7: Infrastructure and Deployment

**Branch:** `audit-phase-7-infra-deploy`

**Result file:** `docs/audit-results/phase-7-infra-deploy.md`

**Scope:**
- Dockerfiles, Docker Compose, Caddy/nginx configs, deployment docs, env var wiring, health checks, service ports, production build assumptions.

**Inspect:**
- `Dockerfile` files under `apps/`
- `docker-compose.yml`
- `docker-compose.caddy.yml`
- `docker-compose.nginx.yml`
- `Caddyfile`
- `docs/vps-nginx-deployment.md`
- `deploy/`
- root and app package scripts used during builds

**Suggested checks:**

```bash
pnpm check-types
pnpm build
docker compose config
```

Run Docker builds only if Orca has the time and local Docker resources available.

**Worker prompt:**

```text
You are auditing Spacefly Phase 7: Infrastructure and Deployment in branch audit-phase-7-infra-deploy, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- docker-compose.yml
- docker-compose.caddy.yml
- docker-compose.nginx.yml
- Caddyfile
- docs/vps-nginx-deployment.md
- deploy/
- apps/*/Dockerfile
- package.json
- turbo.json

Your job:
1. Audit service wiring, env vars, ports, health checks, Docker build assumptions, reverse-proxy config, and deployment docs.
2. Run config/build checks that are safe in your environment.
3. Fix only low-risk docs/config mistakes that are unambiguous.
4. Write docs/audit-results/phase-7-infra-deploy.md using the required result format.

Do not change production deployment behavior unless the fix is obviously safe and documented.
Do not rotate secrets, edit local env files, or run destructive Docker commands.

Final response must include checks run, files changed, and the highest-priority open findings.
```

---

## Phase 8: Cross-Product Synthesis

**Branch:** `audit-phase-8-cross-product`

**Result file:** `docs/audit-results/phase-8-cross-product.md`

**Scope:**
- Runs after phases 0-7 have result files.
- Consolidate duplicate findings, rank product risk, identify cross-service issues, and propose merge/fix order.
- Verify end-to-end flows across client, admin, services, database, and deployment assumptions.

**Inspect:**
- `docs/audit-results/phase-*.md`
- Files referenced by high-priority findings
- Cross-service flows:
  - Register/login.
  - Browse spaces.
  - View space detail.
  - Create venue/space as host.
  - Create booking as guest.
  - Admin review of users/spaces/bookings.
  - Upload and render images.
  - Currency and pricing display.

**Suggested checks:**

```bash
pnpm check-types
pnpm --filter admin test
pnpm --filter space-service test
```

Run full build only after reviewing baseline/env findings from Phase 0 and Phase 7.

**Worker prompt:**

```text
You are auditing Spacefly Phase 8: Cross-Product Synthesis in branch audit-phase-8-cross-product, inside an Orca-managed worktree.

Read:
- docs/product-audit-orca-worktree-plan.md
- docs/audit-results/phase-0-baseline.md
- docs/audit-results/phase-1-client-public.md
- docs/audit-results/phase-2-admin-host.md
- docs/audit-results/phase-3-product-service.md
- docs/audit-results/phase-4-booking-service.md
- docs/audit-results/phase-5-auth-users.md
- docs/audit-results/phase-6-db-data.md
- docs/audit-results/phase-7-infra-deploy.md

Your job:
1. Consolidate all phase findings into a single ranked view.
2. Deduplicate repeated issues and identify cross-service root causes.
3. Verify the most important end-to-end flows where local services are available.
4. Recommend merge order for phase branches and follow-up implementation branches.
5. Write docs/audit-results/phase-8-cross-product.md using the required result format.

Do not make product-code fixes in this phase unless explicitly asked. This phase is for synthesis and integration planning.

Final response must include checks run, duplicate findings collapsed, top P0/P1 issues, and recommended next branches to implement.
```

---

## Orca Execution Order

1. Start `audit-phase-0-baseline` first.
2. Once Phase 0 records safe commands and baseline failures, start Phases 1-7 in parallel.
3. If two workers report the same root cause, keep the fix in the branch with the narrowest ownership and document the duplicate in the other result file.
4. Start Phase 8 only after phases 0-7 have pushed or saved result files.
5. Review each branch in this order:
   - P0 security/data/deploy fixes.
   - P1 broken core flows.
   - P2 targeted correctness and UX fixes.
   - P3 cleanup and polish.
6. Merge or cherry-pick small fixes only after reading their result file and checking changed files.
7. Create separate implementation branches for large follow-up work instead of merging risky audit branches wholesale.

## Final Audit Deliverables

At the end of the Orca run, the repository should contain:

- `docs/audit-results/phase-0-baseline.md`
- `docs/audit-results/phase-1-client-public.md`
- `docs/audit-results/phase-2-admin-host.md`
- `docs/audit-results/phase-3-product-service.md`
- `docs/audit-results/phase-4-booking-service.md`
- `docs/audit-results/phase-5-auth-users.md`
- `docs/audit-results/phase-6-db-data.md`
- `docs/audit-results/phase-7-infra-deploy.md`
- `docs/audit-results/phase-8-cross-product.md`

The Phase 8 result becomes the source of truth for the next implementation plan.
