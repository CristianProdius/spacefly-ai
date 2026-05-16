# Phase 0: Baseline Product Map Audit Results

## Checks Run
- `pnpm check-types`: fail before dependency install because `turbo` was unavailable and `node_modules` was missing.
- `pnpm --filter admin test`: fail before dependency install because `vitest` was unavailable and `node_modules` was missing.
- `pnpm --filter space-service test`: fail before dependency install because `vitest` was unavailable and `node_modules` was missing.
- `pnpm install --frozen-lockfile --offline`: pass. Installed 858 packages from the local pnpm store; lockfile was already up to date. Prisma client postinstall warned that no schema was found in default locations, which is expected for this monorepo unless generation is run with the workspace schema path.
- `pnpm check-types`: fail. Turbo ran 8 tasks before stopping; `booking-service#check-types` failed at `apps/order-service/src/routes/booking.ts:168` because `status.in` is a readonly tuple and Prisma expects a mutable `BookingStatus[]`.
- `pnpm --filter admin test`: fail. 15 test files passed and 3 failed; 27 tests passed and 6 failed. Main failure groups: `host/spaces/new/page.test.tsx` mocks `next/navigation` without `useSearchParams`; admin/host edit-space tests have stale fetch mocks for `/venues/host/my` and `/amenities?spaceType=...`, then assert against missing amenity buttons.
- `pnpm --filter space-service test`: fail before `@repo/db` build. 2 test files passed; `category.route.test.ts` and `space.route.test.ts` failed to resolve `@repo/db` because `packages/db/package.json` exports `./dist/index.js` but `dist` did not exist.
- `pnpm --filter product-service check-types`: pass with warning/no-op. pnpm reported no projects matched the filter; the package name is `space-service`, not `product-service`.
- `pnpm --filter order-service check-types`: pass with warning/no-op. pnpm reported no projects matched the filter; the package name is `booking-service`, not `order-service`.
- `pnpm --filter @repo/auth-middleware check-types`: pass with warning/no-op. The package has `typecheck`, not `check-types`.
- `pnpm --filter @repo/db check-types`: pass with warning/no-op. The package has no `check-types` script.
- `pnpm --filter booking-service check-types`: fail with the same readonly tuple Prisma type error at `apps/order-service/src/routes/booking.ts:168`.
- `pnpm --filter @repo/auth-middleware typecheck`: pass.
- `pnpm --filter @repo/db build`: pass. This creates the `dist` export required by Vite/Vitest when resolving `@repo/db`.
- `pnpm --filter space-service test`: fail after `@repo/db` build. 3 test files passed and 1 failed; 17 tests passed and 3 failed in `src/routes/space.route.test.ts` around admin update response shape, create category slug handling, and groupSlug list filtering.
- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.nginx.yml config`: pass. Compose rendered successfully for Nginx mode without starting services.

## Fixes Applied
- `README.md`: replaced the stock Turborepo starter README with a Spacefly-specific product/repo map, correct package names, safe command list, database notes, and deployment asset summary.
- `docs/audit-results/phase-0-baseline.md`: added this audit result file.

## Findings
- `P1` Caddy ingress omits deployed product API routes
  - Area: Deployment ingress, Caddy mode.
  - Evidence: `apps/product-service/src/index.ts` mounts `/venues` and `/currencies`; `deploy/nginx/spacefly.conf` proxies both at lines 93 and 101, but `Caddyfile` only proxies `/spaces`, `/categories`, `/amenities`, `/uploads`, and `/bookings` before returning 404 at lines 42-68.
  - Reproduction: In Caddy ingress mode, request `https://api.spacefly.ai/venues` or `https://api.spacefly.ai/currencies`; the Caddyfile path matchers do not route those paths, so they hit the final `respond 404`.
  - Recommendation: Add `/venues /venues/*` and `/currencies /currencies/*` handlers to `Caddyfile`, then render config and verify through Caddy mode.

- `P1` Baseline typecheck is blocked by booking-service Prisma type error
  - Area: `apps/order-service/src/routes/booking.ts`.
  - Evidence: `pnpm check-types` and `pnpm --filter booking-service check-types` fail at line 168 because `status.in` is `["PENDING", "CONFIRMED"] as const`, a readonly tuple not assignable to Prisma's mutable `BookingStatus[]`.
  - Reproduction: Run `pnpm --filter booking-service check-types`.
  - Recommendation: Type `conflictWhere` as a Prisma `BookingWhereInput` with a mutable status array, or remove `as const` and use generated `BookingStatus` enum values.

- `P2` Product-service tests depend on an unbuilt `@repo/db` package
  - Area: `packages/db` package export and product-service test workflow.
  - Evidence: A clean `pnpm --filter space-service test` failed to resolve `@repo/db` because `@repo/db` exports `./dist/index.js`; after `pnpm --filter @repo/db build`, the same command progressed to route assertion failures.
  - Reproduction: In a clean worktree with dependencies installed but no `packages/db/dist`, run `pnpm --filter space-service test`.
  - Recommendation: Add a test-time source export/alias for `@repo/db`, or make the product-service test script depend on/build `@repo/db` first.

- `P2` Admin tests are stale against current space form behavior
  - Area: `apps/admin` Vitest suite.
  - Evidence: `pnpm --filter admin test` reports 6 failed tests. The new-space page uses `useSearchParams`, but the test mock for `next/navigation` omits it; edit-space tests do not mock current `/venues/host/my` and space-type-specific amenities fetches.
  - Reproduction: Run `pnpm --filter admin test`.
  - Recommendation: Update the affected mocks and expected assertions to match the shared venue-aware space form.

- `P2` Product-service route tests fail after shared db build
  - Area: `apps/product-service/src/routes/space.route.test.ts`.
  - Evidence: After `pnpm --filter @repo/db build`, `pnpm --filter space-service test` fails 3 assertions: admin update response shape, expected 201 create response for categorySlug type derivation, and expected 200 response for groupSlug filters.
  - Reproduction: Run `pnpm --filter @repo/db build` then `pnpm --filter space-service test`.
  - Recommendation: Phase 3 should determine whether route behavior regressed or tests are stale, then fix the product-service implementation or assertions with targeted coverage.

- `P3` Package names differ from service directories and Compose names
  - Area: Workspace command assumptions.
  - Evidence: `apps/product-service/package.json` name is `space-service`; `apps/order-service/package.json` name is `booking-service`. `pnpm --filter product-service check-types` and `pnpm --filter order-service check-types` match no projects.
  - Reproduction: Run either no-op filter command above.
  - Recommendation: Use package names in pnpm filter commands, or rename packages only if coordinated with all audit plans, Docker pruning, and deployment scripts.

- `P3` Root README was stale starter documentation
  - Area: Repository setup docs.
  - Evidence: Before this audit, `README.md` described `docs`, `web`, and `@repo/ui` starter packages that do not exist in this workspace.
  - Reproduction: Read the previous root README from this branch history.
  - Recommendation: Fixed in this branch by replacing the README with a Spacefly-specific map.

## Follow-Up Recommendations
- Fix the `booking-service` type error first so `pnpm check-types` can become a reliable baseline gate.
- In Phase 7, patch and verify Caddy route coverage for `/venues` and `/currencies`.
- In Phase 2, refresh admin space-form tests around venue loading, amenity filtering, and `useSearchParams`.
- In Phase 3, resolve product-service route-test failures and decide whether `@repo/db` should be built before service tests or resolved from source.
- Treat root package filters as package-name based: `space-service` and `booking-service` are the reliable filters today.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `docker-compose.yml`
- `docker-compose.nginx.yml`
- `docker-compose.caddy.yml`
- `Caddyfile`
- `.env.example`
- `scripts/deploy.sh`
- `deploy/nginx/spacefly.conf`
- `apps/admin/package.json`
- `apps/client/package.json`
- `apps/product-service/package.json`
- `apps/order-service/package.json`
- `apps/auth-service/package.json`
- `apps/email-service/package.json`
- `packages/auth-middleware/package.json`
- `packages/db/package.json`
- `packages/eslint-config/package.json`
- `packages/kafka/package.json`
- `packages/types/package.json`
- `packages/typescript-config/package.json`
- `packages/db/prisma/schema.prisma`
- `packages/db/src/index.ts`
- `apps/product-service/src/index.ts`
- `apps/order-service/src/index.ts`
- `apps/auth-service/src/index.ts`
- `apps/email-service/src/index.ts`
- `apps/client/src/app/[locale]/`
- `apps/client/src/components/`
- `apps/client/src/i18n/`
- `apps/admin/src/app/`
- `apps/admin/src/components/`
- `docs/audit-results/README.md`
- `docs/vps-nginx-deployment.md`
- `docs/superpowers/plans/2026-04-23-deployment-infrastructure.md`
- `docs/superpowers/plans/2026-05-11-venue-space-separation.md`
- `docs/superpowers/plans/2026-05-12-amenities-multilang-youtube.md`
- `docs/superpowers/plans/2026-05-12-map-area-search.md`
- `docs/superpowers/plans/2026-05-12-multi-currency-interval-pricing.md`
