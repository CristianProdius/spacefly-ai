# Phase 8 Cross-Product Synthesis Audit Results

## Checks Run
- `sed -n ... docs/product-audit-orca-worktree-plan.md`: pass. Confirmed Phase 8 scope, result format, and constraints.
- `sed -n ... phase-{0..7}-*/docs/audit-results/*.md`: pass. Read all completed phase audit result files from their absolute worktree paths.
- `git status --short --branch`: pass. Confirmed this worktree is on `audit-phase-8-cross-product`; no product-code changes were made.
- Product checks were not rerun in this synthesis worktree because `node_modules` and `packages/db/dist` are absent here, and Phase 8 is constrained to reporting only. Verification status below is based on the phase branches' recorded checks.

## Fixes Applied
- `docs/audit-results/phase-8-cross-product.md`: added this consolidated audit report.
- No product-code fixes, merges, cherry-picks, migrations, or edits outside the Phase 8 worktree were performed.

## Findings
- `P0` No confirmed production-breaking issue remains open after deduplication
  - Area: Cross-product risk ranking.
  - Evidence: Phase 0-7 reports contain multiple `P1` issues but no worker documented a confirmed auth bypass with admin access, deploy impossibility for all modes, irreversible data loss, or currently reproduced total production outage.
  - Reproduction: Not applicable.
  - Recommendation: Keep `P1` items below as release blockers until fixed or explicitly accepted.

- `P1` Booking creation can produce incorrect calendar and money outcomes
  - Area: Guest booking flow, booking-service, shared booking types, Prisma availability data.
  - Evidence: Phase 4 found that hourly conflicts ignore `startTime`/`endTime`, invalid date/time ranges can reach price calculation, and booking creation does not enforce `Availability`, `BlockedDate`, `minBookingHours`, or `maxBookingHours`.
  - Reproduction: Create a same-day hourly booking for `09:00-10:00`, then create another for `14:00-15:00`; the second booking is rejected by date-only overlap. Conversely, book a closed/blocked day or invalid range; route-level validation does not consistently reject it before calculation.
  - Recommendation: Create a dedicated booking-correctness branch before launch. Add zod validation for date/time/query inputs, implement interval-aware hourly conflicts, enforce availability/blocked dates/min-max duration in the booking transaction, and add route tests for overlapping, adjacent, invalid, blocked, and valid bookings.

- `P1` Host verification boundary is ambiguous and currently bypassable for host capabilities
  - Area: Auth service, shared auth middleware, product-service host routes, admin host workflows.
  - Evidence: Phase 5 found `/auth/become-host` updates the user to `role: "HOST"` with `hostVerified: false`, then returns JWTs carrying `HOST`. `shouldBeHost` and `shouldBeHostOrAdmin` check only the JWT role, so product-service host routes accept pending hosts.
  - Reproduction: Register as a user, call `POST /auth/become-host`, then use the returned token against `POST /venues`, `POST /spaces`, or upload routes.
  - Recommendation: Decide product policy first. If host approval is required, prevent pending applicants from receiving host-authorized tokens or add trusted server-side verified-host authorization for host management routes. Treat this as a security-sensitive follow-up with tests across auth middleware and product-service routes.

- `P1` Venue migration and seed data are not safe for existing or fresh bootstrap data paths
  - Area: Prisma migrations, seed data, venue/space data model.
  - Evidence: Phase 6 found `20260511230000_add_venue_model` adds nullable `Space.venueId`, then `20260512000000_make_venue_id_required` immediately makes it non-null with no backfill. Seed data creates spaces without `venueId` even though current schema requires it.
  - Reproduction: Apply current migrations to a database with pre-venue spaces, or run the current seed script against the latest schema.
  - Recommendation: Add an approved data migration/backfill path before production migration, then update seed data to create/connect venues. This should be reviewed separately because it changes persisted data shape.

- `P1` Venue support is partially wired across service, admin, data, and ingress layers
  - Area: Product service, admin host venue form, shared types, reverse proxy config.
  - Evidence: Phase 7 fixed Caddy routing for `/venues` and `/currencies`; Phase 6 found venue create/update drops `videoUrl`, `currency`, and some translation fields despite admin sending them; Phase 6 also fixed shared venue types locally; Phase 2/3 found the host spaces list was broken by `/spaces/host/my` route ordering, fixed in Phase 3.
  - Reproduction: Create or update a venue with non-default currency, YouTube URL, or translations and inspect persisted data. In pre-Phase-7 Caddy mode, request `/venues` or `/currencies` and observe 404.
  - Recommendation: Integrate the low-risk routing/type fixes, then open a venue-contract branch to align admin payloads, product-service persistence/validation, shared DTOs, seed data, and migration behavior.

- `P1` Full workspace typecheck is blocked until the Phase 4 booking-service fix is integrated
  - Area: Baseline verification gate.
  - Evidence: Phases 0, 2, 3, and 6 all report `pnpm check-types` failing at `apps/order-service/src/routes/booking.ts:168` due to a readonly status tuple passed to Prisma. Phase 4 fixed this locally and `pnpm --filter booking-service check-types` passed there.
  - Reproduction: Run `pnpm check-types` on a branch without Phase 4's booking type fix.
  - Recommendation: Integrate Phase 4's narrow type fix early, then rerun `pnpm check-types` as the first post-merge baseline gate.

- `P2` API failures commonly render as empty or not-found states
  - Area: Client browse/detail, admin tables, host spaces/bookings/earnings.
  - Evidence: Phase 1 found public browse collapses product-service fetch failure into an empty list and detail failures into `notFound()`. Phase 2 found host/admin pages log fetch/action failures and render empty tables or unchanged UI.
  - Reproduction: Stop product/order/auth services and open `/spaces`, a space detail page, host spaces/bookings, or admin users/spaces/bookings.
  - Recommendation: Add explicit localized error states, retry affordances, and failed-action feedback across client/admin. Keep true empty results distinct from service failures.

- `P2` Input validation is inconsistent across product, booking, and auth/user APIs
  - Area: Product-service review/category/availability endpoints, booking-service list/create endpoints, auth-service user management.
  - Evidence: Phase 3 found review update accepts invalid ratings, category/review IDs can become Prisma `NaN` errors, and availability check accepts invalid dates. Phase 4 found booking query params accept invalid statuses/pagination. Phase 5 found several user-management role inputs are inconsistently validated.
  - Reproduction: Send invalid IDs, dates, ratings, statuses, pagination, or roles to the documented endpoints.
  - Recommendation: Add shared route-local validation helpers or schemas for numeric IDs, enums, dates, pagination, ratings, and time windows. Start with booking and product-service endpoints that touch customer-visible flows.

- `P2` Verification and test workflows depend on local build artifacts or stale assumptions
  - Area: Monorepo test/build workflow.
  - Evidence: Phase 0 found `space-service` tests fail in a clean worktree until `@repo/db` is built. Phase 2 fixed stale admin test mocks. Phase 7 could not run TypeScript checks until dependencies were installed.
  - Reproduction: Run `pnpm --filter space-service test` in a clean worktree without `packages/db/dist`, or run targeted checks before dependency installation.
  - Recommendation: Make service test scripts build/alias workspace dependencies consistently, and document prepared-worktree prerequisites for audit/CI runs.

## Duplicate Findings Collapsed
- Booking-service readonly Prisma status tuple:
  - Reported in Phases 0, 2, 3, and 6 as a baseline/full typecheck blocker.
  - Fixed in Phase 4 commit `04ae393`.
  - Consolidated as `P1` verification gate blocker until integrated.
- Caddy missing `/venues` and `/currencies`:
  - Reported in Phase 0 and Phase 7.
  - Fixed in Phase 7 commit `a45ac00`.
  - Consolidated under the broader venue wiring risk.
- `/spaces/host/my` route shadowed by `/:id`:
  - Reported in Phase 2 and fixed in Phase 3 commit `bed5711bc20340131db84302b6cf640e5d64ec45`.
  - Consolidated under venue/host workflow integration.
- Admin space-form stale tests and venue preselection:
  - Reported in Phase 0 and fixed in Phase 2 commit `39438051f3bb75c1614440dc85091fcd36c6a25a`.
  - Consolidated as ready-to-integrate admin-local test/form work.
- Missing product-service URL fallback:
  - Phase 1 fixed multiple client fetch callers with a shared fallback.
  - Related to API failure UX but separate from the remaining empty/error-state finding.
- Venue type/DTO drift:
  - Phase 6 fixed shared venue types but also documented remaining product-service persistence and nested response mismatches.
  - Consolidated under the venue-contract follow-up branch.

## Cross-Service Root Causes
- Venue model rollout was not completed end-to-end. DB migrations, seed data, product-service controllers, shared DTOs, admin forms, host listing routes, and proxy route lists changed at different speeds.
- Boundary validation is repeated ad hoc in controllers. Product, booking, and auth/user routes use local parsing/casting patterns that produce inconsistent `400` behavior and occasional Prisma-level failures.
- Frontends often treat backend failures as empty data. This hides outages from customers, hosts, and admins and makes integration issues look like normal empty states.
- Verification relies on undeclared local state. Clean worktrees need dependency installation and, for some tests, built package artifacts before targeted commands are meaningful.
- Security/product policy is not encoded in shared authorization primitives. `role: HOST` and `hostVerified` carry different meanings, but middleware only enforces role.

## Recommended Integration Order
- 1. Integrate Phase 4 commit `04ae393` first. It is a narrow booking-service type fix and unblocks full workspace typechecking. Risk: low; touches booking code but only TypeScript filter typing.
- 2. Integrate Phase 3 commit `bed5711bc20340131db84302b6cf640e5d64ec45`. It fixes the core host spaces route-order breakage, product-service test drift, `groupSlug` filtering, and query sanitization. Risk: moderate; review public `/spaces` query behavior before merge.
- 3. Integrate Phase 2 commit `39438051f3bb75c1614440dc85091fcd36c6a25a`. It is admin-local form/test repair and passed admin tests/build. Risk: low to moderate; verify host new-space venue preselection after Phase 3.
- 4. Integrate Phase 7 commit `a45ac00`. It restores Caddy route parity for venue/currency APIs. Risk: low; validate Caddy config with `CADDY_EMAIL` as Phase 7 did.
- 5. Integrate Phase 1 commit `bd92392`. It fixes client product-service URL fallbacks and auth redirect preservation. Risk: moderate; smoke login/register redirect and browse/detail behavior after product-service URL configuration is confirmed.
- 6. Integrate Phase 6 commit `8aa82f89c102c5e2452f00016ce9bb9575bc79e8` only after reviewing shared DTO compatibility. The type fix is useful, but Phase 6 also identified DB migration and seed issues that still need separate work. Risk: moderate.
- 7. Integrate Phase 5 commit `1ad4bb1`. The logout ownership fix is narrow and good, but keep the host-verification policy issue as a separate security branch. Risk: low for the commit, high for adjacent auth policy changes.
- 8. Integrate Phase 0 commit `603d5fe8e49443109869722d9ee2634056bcc66c` if the README update is desired. Risk: low documentation-only.

## Follow-Up Recommendations
- `P1` Booking correctness branch: validate dates/times, enforce availability and booking limits, implement hourly overlap logic, and add route tests before touching pricing/status behavior.
- `P1` Host verification branch: decide pending-host policy, then enforce verified-host state in auth tokens or service-side authorization. Include auth middleware and product-service regression tests.
- `P1` Venue data branch: add migration backfill strategy, repair seed data, persist venue currency/video/translations, and clarify full versus nested venue DTOs.
- `P2` Failure-state branch: distinguish empty results from API failures across client and admin/host pages.
- `P2` API validation branch: add shared validation patterns for IDs, enums, ratings, dates, time windows, and pagination.
- `P2` CI/worktree branch: make `space-service` tests independent of prebuilt `@repo/db/dist`, and document/install prepared-worktree requirements.
- After each integration step, rerun at minimum `pnpm check-types`, `pnpm --filter admin test`, and `pnpm --filter space-service test`. Add `pnpm --filter client build`, `pnpm --filter admin build`, and Caddy/Docker config validation before release.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-0-baseline/docs/audit-results/phase-0-baseline.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-1-client-public/docs/audit-results/phase-1-client-public.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-2-admin-host/docs/audit-results/phase-2-admin-host.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-3-product-service/docs/audit-results/phase-3-product-service.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-4-booking-service/docs/audit-results/phase-4-booking-service.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-5-auth-users/docs/audit-results/phase-5-auth-users.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-6-db-data/docs/audit-results/phase-6-db-data.md`
- `/Users/cristian/Development/spacefly-ai/.worktrees/phase-7-infra-deploy/docs/audit-results/phase-7-infra-deploy.md`
