# Phase 3 Product Service APIs Audit Results

## Checks Run
- `pnpm install --frozen-lockfile --offline`: pass. Installed workspace dependencies from the offline store after the worktree initially had no `node_modules`.
- `pnpm --filter @repo/db build`: pass after install. Earlier pre-install attempt failed with `tsc: command not found`.
- `pnpm --filter space-service test`: initial fail, 3 failures in `src/routes/space.route.test.ts` around current venue-backed create/update mocks and missing `groupSlug` list behavior. Final pass: 4 test files passed, 21 tests passed.
- `pnpm --filter space-service check-types`: pass. `tsc --noEmit` completed with exit 0.
- `pnpm --filter space-service build`: pass. `tsup` built `dist/index.js` successfully.
- `pnpm check-types`: fail outside this phase. `booking-service` fails at `apps/order-service/src/routes/booking.ts(168,57)` because a readonly `["PENDING", "CONFIRMED"]` tuple is assigned where Prisma expects a mutable `BookingStatus[]`.

## Fixes Applied
- `apps/product-service/src/routes/space.route.ts`: moved `GET /spaces/host/my` before `GET /spaces/:id`, so the host route is no longer treated as an invalid numeric space ID.
- `apps/product-service/src/controllers/space.controller.ts`: added `groupSlug` filtering through the `category` relation for `GET /spaces`; clamped/sanitized public list pagination, sort fields, sort order, numeric price/capacity filters, and bounding box coordinates before building Prisma queries.
- `apps/product-service/src/routes/space.route.test.ts`: added a regression test for `/spaces/host/my`; updated list/create/update route tests to match the current venue-backed space contract and cover `groupSlug` filtering.

## Findings
- `P2` `GET /spaces?sort=rating` does not sort by rating
  - Area: Product service space search/sort.
  - Evidence: `apps/product-service/src/controllers/space.controller.ts` maps `sort=rating` to `createdAt desc` because average rating is calculated after the Prisma query.
  - Reproduction: Request `GET /spaces?sort=rating`; response order is newest, not highest rated.
  - Recommendation: Either remove/disable rating sort in callers until supported, or implement rating-aware ordering with a query/aggregation strategy that preserves correct pagination.

- `P2` Review update accepts invalid rating values
  - Area: Review API validation.
  - Evidence: `apps/product-service/src/controllers/review.controller.ts` validates rating on create, but `updateReview` writes any truthy `rating` directly and does not enforce the 1-5 range.
  - Reproduction: Authenticated review owner sends `PUT /spaces/reviews/:reviewId` with `{ "rating": 99 }`; controller passes `rating: 99` to Prisma.
  - Recommendation: Share the create-review rating validation with update and reject non-integer or out-of-range ratings with 400.

- `P2` Review and category ID params can become Prisma errors instead of 400 responses
  - Area: Route parameter validation and status codes.
  - Evidence: `review.controller.ts` parses `spaceId`/`reviewId` without `Number.isNaN` checks; `category.controller.ts` parses category IDs for get/update/delete without rejecting `NaN`.
  - Reproduction: Request `GET /spaces/not-a-number/reviews` or `GET /categories/not-a-number`; Prisma receives `id: NaN` or `spaceId: NaN`.
  - Recommendation: Add the same invalid-ID guard already used in space, venue, and amenity controllers.

- `P2` Availability check can treat invalid or missing date input as available
  - Area: Availability validation.
  - Evidence: `checkAvailability` constructs `new Date(startDate)` and `new Date(endDate)` without checking missing/invalid values or `start <= end`.
  - Reproduction: Authenticated request to `POST /spaces/:id/check` with `{ "startDate": "bad", "endDate": "also-bad" }`; date comparisons do not reliably reject the request.
  - Recommendation: Validate required ISO date strings and return 400 for invalid dates or reversed ranges before checking blocked dates/bookings.

## Follow-Up Recommendations
- Fix the review/category/date validation gaps first; they are small API-local changes with low blast radius and should get targeted controller/route tests.
- Decide the product contract for `sort=rating`: either implement true rating sort or remove the exposed option to avoid misleading browse results.
- Add route tests for invalid query/param inputs across public list, review, category, and availability endpoints.
- Consider introducing shared parse/validation helpers for numeric IDs, pagination, date ranges, and rating values to keep controllers consistent.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `apps/product-service/package.json`
- `apps/product-service/src/index.ts`
- `apps/product-service/src/routes/space.route.ts`
- `apps/product-service/src/routes/category.route.ts`
- `apps/product-service/src/routes/amenity.route.ts`
- `apps/product-service/src/routes/upload.route.ts`
- `apps/product-service/src/routes/venue.route.ts`
- `apps/product-service/src/routes/currency.route.ts`
- `apps/product-service/src/routes/space.route.test.ts`
- `apps/product-service/src/routes/upload.route.test.ts`
- `apps/product-service/src/routes/category.route.test.ts`
- `apps/product-service/src/controllers/space.controller.ts`
- `apps/product-service/src/controllers/venue.controller.ts`
- `apps/product-service/src/controllers/category.controller.ts`
- `apps/product-service/src/controllers/amenity.controller.ts`
- `apps/product-service/src/controllers/review.controller.ts`
- `apps/product-service/src/controllers/upload.controller.ts`
- `apps/product-service/src/controllers/currency.controller.ts`
- `apps/product-service/src/lib/space-taxonomy.ts`
- `apps/product-service/src/lib/translations.ts`
- `apps/product-service/src/lib/currency.ts`
- `apps/product-service/src/middleware/authMiddleware.ts`
- `apps/product-service/src/utils/upload.ts`
- `apps/product-service/src/utils/kafka.ts`
- `packages/types/src/space.ts`
- `packages/types/src/venue.ts`
- `packages/types/src/currency.ts`
- `packages/types/src/auth.ts`
- `packages/types/src/booking.ts`
- `packages/types/src/review.ts`
- `packages/types/src/payout.ts`
- `packages/types/src/index.ts`
