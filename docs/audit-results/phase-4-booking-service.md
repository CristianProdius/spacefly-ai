# Phase 4 Booking Service Audit Results

## Checks Run
- `pnpm --filter booking-service check-types`: initial fail after dependency install with `src/routes/booking.ts(168,57): error TS2322` because Prisma `status.in` received a readonly tuple; pass after local fix.
- `pnpm --filter booking-service build`: pass before the fix and pass after the fix; `tsup` built `dist/index.js` successfully.
- `pnpm install --frozen-lockfile --offline`: pass inside this worktree to restore missing `node_modules`; initial check/build attempts failed first with `tsc: command not found` and `tsup: command not found`.

## Fixes Applied
- `apps/order-service/src/routes/booking.ts`: changed the booking conflict status filter from an inline readonly tuple to a typed mutable `BookingStatus[]` so Prisma's generated `BookingWhereInput` accepts it.

## Findings
- `P1` Hourly bookings conflict by whole date, not by time window
  - Area: Booking creation conflict detection in `apps/order-service/src/routes/booking.ts`.
  - Evidence: The conflict query only checks `spaceId`, `status in PENDING/CONFIRMED`, `startDate <= requestedEndDate`, and `endDate >= requestedStartDate`; it does not compare `startTime`/`endTime`.
  - Reproduction: Create a confirmed or pending booking for a meeting room on `2026-06-01` from `09:00` to `10:00`, then try to create another booking for the same space on `2026-06-01` from `14:00` to `15:00`; the second request matches the date overlap and returns `409`.
  - Recommendation: Add explicit time-window overlap logic for same-day hourly bookings, and keep date-only overlap for daily/full-day bookings. Cover adjacent slots such as `10:00-11:00` after `09:00-10:00`.

- `P1` Booking creation accepts invalid or nonsensical date/time ranges before pricing
  - Area: `CreateBookingSchema` in `packages/types/src/booking.ts` and price calculation in `apps/order-service/src/routes/booking.ts`.
  - Evidence: `startDate` and `endDate` are unconstrained strings; `startTime` and `endTime` are unconstrained optional strings. The route passes `new Date(...)` directly into `differenceInDays` and parses times with `split(":").map(Number)`.
  - Reproduction: Submit `endDate` before `startDate`, malformed date strings, malformed times, or an hourly booking with `startTime: "18:00"` and `endTime: "09:00"`; the service can compute negative/NaN durations and prices or rely on lower-level failures.
  - Recommendation: Validate ISO dates, require `endDate >= startDate`, require paired `HH:mm` times for hourly bookings, require `endTime > startTime` for same-day hourly bookings, and reject malformed dates before price calculation.

- `P1` Booking creation does not enforce availability, blocked dates, or min/max booking limits
  - Area: Booking creation in `apps/order-service/src/routes/booking.ts` against `Availability`, `BlockedDate`, `minBookingHours`, and `maxBookingHours` models.
  - Evidence: The route loads `space`, `host`, and `pricingTiers` only, then checks active status, capacity, existing bookings, and price. It never queries `Availability` or `BlockedDate`, and does not use `minBookingHours` or `maxBookingHours`.
  - Reproduction: Configure a space as closed on Sunday or add a blocked date, then create a booking for that day; no route-level check rejects it. Similarly, create a one-hour booking for a space with a higher `minBookingHours`.
  - Recommendation: Add availability/blocked-date enforcement in the same transaction used for conflict checks, and apply min/max duration rules before booking creation.

- `P2` Kafka side effects are fire-and-forget and can fail silently
  - Area: Kafka event publication in `apps/order-service/src/routes/booking.ts`.
  - Evidence: `producer.send(...)` is called without `await` in create, approve, reject, cancel, and complete handlers.
  - Reproduction: Make the producer reject after the database write; the HTTP response can still be sent and the failed side effect is not handled by the route.
  - Recommendation: Decide whether booking events are required side effects. If required, await and handle send failures or persist an outbox record in the booking transaction.

- `P2` Status transition timestamps are incomplete
  - Area: Approve and reject flows in `apps/order-service/src/routes/booking.ts` and `Booking` model timestamp fields.
  - Evidence: Approve changes `status` to `CONFIRMED` but does not set `approvedAt`; reject sets `status` and `hostMessage` but there is no rejected timestamp field.
  - Reproduction: Approve a pending booking and inspect the returned/database record; `approvedAt` remains null.
  - Recommendation: Set `approvedAt` on approval and clarify whether the enum's unused `APPROVED` status should be removed, mapped to payment pending, or used in a two-step flow.

- `P2` Query parameters accept invalid booking statuses and pagination values
  - Area: Guest/host/admin list routes in `apps/order-service/src/routes/booking.ts`.
  - Evidence: `status`, `page`, and `limit` are cast from `request.query` without schema validation. Invalid enum values or nonpositive/NaN pagination can reach Prisma.
  - Reproduction: Request `/bookings/my?status=BOGUS` or `/bookings?limit=-1&page=abc`; the route does not reject these values at the boundary.
  - Recommendation: Add route-local zod schemas for query parameters and return `400` for invalid status, page, limit, or `spaceId`.

## Follow-Up Recommendations
- First fix booking creation validation and availability enforcement, because those protect money, calendar correctness, and host expectations.
- Then redesign hourly conflict detection with regression tests for overlapping, adjacent, and non-overlapping time slots.
- Add transactional or outbox-based event publication semantics for booking lifecycle events.
- Add focused booking route tests with mocked Prisma and Kafka producer before changing pricing/status behavior.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `apps/order-service/package.json`
- `apps/order-service/src/index.ts`
- `apps/order-service/src/routes/booking.ts`
- `apps/order-service/src/utils/kafka.ts`
- `apps/order-service/src/utils/subscriptions.ts`
- `packages/types/src/booking.ts`
- `packages/db/prisma/schema.prisma`
