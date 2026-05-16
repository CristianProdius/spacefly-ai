# Phase 2: Admin and Host Workflows Audit Results

## Checks Run
- `pnpm install --frozen-lockfile --offline`: pass. Installed workspace dependencies offline after the worktree initially had no `node_modules`.
- `pnpm --filter admin test`: pass after fixes. `18` test files passed, `34` tests passed. Baseline before fixes reproduced `6` failures in host/admin space form tests.
- `pnpm --filter admin check-types`: pass on rerun after build completed. A concurrent run with `next build` failed because `.next/types` files disappeared while the build regenerated them.
- `pnpm --filter admin build`: pass. Next.js build completed; one existing warning remains in `src/app/(dashboard)/admin/exchange-rates/page.tsx` for a missing `fetchRates` hook dependency.
- `pnpm check-types`: fail, out of Phase 2 admin scope. `booking-service` fails in `apps/order-service/src/routes/booking.ts:168` because a readonly status tuple is passed to Prisma where a mutable `BookingStatus[]` is required.
- `pnpm --filter admin exec vitest run src/app/\(dashboard\)/host/spaces/new/page.test.tsx src/app/\(dashboard\)/host/spaces/\[id\]/edit/page.test.tsx src/app/\(dashboard\)/admin/spaces/\[id\]/edit/page.test.tsx`: pass. `3` files passed, `7` tests passed.

## Fixes Applied
- `apps/admin/src/components/spaces/space-form.tsx`: fixed the space form's initial-value reset so `defaultVenueId` from `/host/spaces/new?venueId=...` survives the mount effect and keeps the venue preselected.
- `apps/admin/src/app/(dashboard)/host/spaces/new/page.test.tsx`: added `useSearchParams` coverage, current venue fetch mocks, current venue-based create payload assertions, and a regression test for venue query preselection.
- `apps/admin/src/app/(dashboard)/host/spaces/[id]/edit/page.test.tsx`: updated the edit fixture and assertions to match the current venue-based payload shape and amenity query fetches.
- `apps/admin/src/app/(dashboard)/admin/spaces/[id]/edit/page.test.tsx`: updated admin edit fixture mocks to include current venue and amenity fetch behavior.

## Findings
- `P1` Host spaces list calls a route that is shadowed by `/:id`
  - Area: Host dashboard spaces list and product-service route order.
  - Evidence: `apps/admin/src/app/(dashboard)/host/spaces/page.tsx` fetches `/spaces/host/my`, but `apps/product-service/src/routes/space.route.ts` registers `router.get("/:id", getSpace)` before `router.get("/host/my", shouldBeHost, getMySpaces)`.
  - Reproduction: Request `GET /spaces/host/my` against the product service. Express matches `/:id` first, passes `"host"` to `getSpace`, and `getSpace` returns `400 { message: "Invalid ID" }`.
  - Recommendation: Move `/host/my` above `/:id` in `space.route.ts` and add a route-order regression test in product-service.

- `P2` Host/admin pages silently collapse API failures into empty content
  - Area: Host spaces, venues, bookings, earnings, and admin table pages.
  - Evidence: Host spaces catches fetch/action errors and only logs them (`apps/admin/src/app/(dashboard)/host/spaces/page.tsx:56-71`, `79-105`). Host bookings does the same for fetch and status actions (`apps/admin/src/app/(dashboard)/host/bookings/page.tsx:82-99`, `105-180`). Admin spaces/bookings/users catch fetch failures and render normal tables with empty data after logging.
  - Reproduction: Make product/order/auth service return `500` or disconnect it, then open host/admin pages. The user sees empty lists or unchanged rows with no visible error or retry state.
  - Recommendation: Add page-level error state, retry action, and failed-action toast/error messages; preserve empty states only for successful empty responses.

- `P2` Host earnings page reimplements payout math instead of using the backend earnings endpoint
  - Area: Host earnings.
  - Evidence: Admin earnings fetches `/bookings/host` and derives totals client-side (`apps/admin/src/app/(dashboard)/host/earnings/page.tsx:48-78`), while order-service exposes `/bookings/host/earnings` with payout-aware fields (`apps/order-service/src/routes/booking.ts:653-696`).
  - Reproduction: Create completed bookings and payout records with `PENDING` or `PROCESSING` status. The admin page computes pending earnings only from `CONFIRMED` bookings and ignores payout records returned by the backend endpoint.
  - Recommendation: Switch the admin page to `/bookings/host/earnings` for summary cards, and use `/bookings/host` only for transaction rows.

- `P2` Admin "All Spaces" likely does not show all spaces
  - Area: Admin spaces.
  - Evidence: `apps/admin/src/app/(dashboard)/admin/spaces/page.tsx:27-38` fetches the public `/spaces` endpoint without an admin token and reads `data.spaces`. The product-service public `getSpaces` filters `isActive: true`, so inactive/deactivated listings are hidden from the admin table.
  - Reproduction: Deactivate a host space, then open `/admin/spaces`. The admin table reads the public listing endpoint and will not include inactive rows.
  - Recommendation: Add/use an authenticated admin listing endpoint, or extend the service contract intentionally with admin-only query behavior.

## Follow-Up Recommendations
- Fix product-service `/spaces/host/my` route ordering first; it breaks a core host listing flow.
- Add visible API failure states and failed-action feedback to host spaces, venues, bookings, earnings, and admin data tables.
- Align host earnings with `/bookings/host/earnings` so payout records are the source of truth.
- Add product-service tests for host route ordering and admin-space listing semantics before changing API behavior.
- Address the out-of-scope `booking-service` typecheck failure separately so full workspace checks can be trusted.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `apps/admin/package.json`
- `apps/admin/src/app/(auth)/layout.tsx`
- `apps/admin/src/app/(auth)/login/page.tsx`
- `apps/admin/src/app/(auth)/unauthorized/page.tsx`
- `apps/admin/src/app/(dashboard)/layout.tsx`
- `apps/admin/src/app/(dashboard)/admin/layout.tsx`
- `apps/admin/src/app/(dashboard)/admin/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/amenities/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/bookings/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/categories/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/spaces/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/spaces/[id]/edit/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/users/page.tsx`
- `apps/admin/src/app/(dashboard)/admin/users/[id]/page.tsx`
- `apps/admin/src/app/(dashboard)/host/layout.tsx`
- `apps/admin/src/app/(dashboard)/host/page.tsx`
- `apps/admin/src/app/(dashboard)/host/bookings/page.tsx`
- `apps/admin/src/app/(dashboard)/host/earnings/page.tsx`
- `apps/admin/src/app/(dashboard)/host/spaces/page.tsx`
- `apps/admin/src/app/(dashboard)/host/spaces/new/page.tsx`
- `apps/admin/src/app/(dashboard)/host/spaces/[id]/edit/page.tsx`
- `apps/admin/src/app/(dashboard)/host/venues/page.tsx`
- `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx`
- `apps/admin/src/app/(dashboard)/host/venues/[id]/edit/page.tsx`
- `apps/admin/src/components/spaces/space-form.tsx`
- `apps/admin/src/components/spaces/space-form.shared.ts`
- `apps/admin/src/components/spaces/pricing-tiers-editor.tsx`
- `apps/admin/src/components/venues/venue-form.tsx`
- `apps/admin/src/components/venues/venue-form.shared.ts`
- `apps/admin/src/components/venues/map-picker.tsx`
- `apps/admin/src/components/ui/`
- `apps/admin/src/stores/authStore.ts`
- `apps/admin/src/lib/auth.ts`
- `apps/admin/src/lib/taxonomy.ts`
- `apps/product-service/src/routes/space.route.ts`
- `apps/product-service/src/controllers/space.controller.ts`
- `apps/product-service/src/routes/venue.route.ts`
- `apps/order-service/src/routes/booking.ts`
