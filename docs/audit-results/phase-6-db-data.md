# Phase 6 DB Data Audit Results

## Checks Run
- `pnpm install --frozen-lockfile --offline`: pass; installed 858 packages from the local store. Prisma postinstall warned that the schema is in a custom path, which is expected for `packages/db/prisma/schema.prisma`.
- `pnpm --filter @repo/db build`: pass after install; `tsc -p tsconfig.build.json` and `tsc-alias` completed.
- `pnpm --filter @repo/types check-types`: pass after the shared venue type fix; `tsc --noEmit` completed.
- `pnpm --filter @repo/db exec prisma validate --schema packages/db/prisma/schema.prisma`: fail; invalid command path for filtered exec because it runs from `packages/db`, so Prisma could not find `packages/db/prisma/schema.prisma`.
- `pnpm --filter @repo/db exec prisma validate --schema prisma/schema.prisma`: fail; schema loaded, but `DATABASE_URL` was unset (`P1012`).
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/spacefly pnpm --filter @repo/db exec prisma validate --schema prisma/schema.prisma`: pass; Prisma reported the schema is valid.
- `pnpm check-types`: fail; known booking-service baseline error remains at `apps/order-service/src/routes/booking.ts:168` because `status.in` is a readonly tuple (`["PENDING", "CONFIRMED"] as const`) where Prisma expects a mutable `BookingStatus[]`. Turbo reported 3 successful tasks plus one cache hit before failing `booking-service#check-types`.

## Fixes Applied
- `packages/types/src/venue.ts`: aligned the shared `Venue`/`VenueWithSpaces` types with newer venue fields and the venue detail response by adding optional translation fields, optional `currency`, and selected nested space fields (`pricePerHour`, `pricePerDay`, `pricingType`, `images`).

## Findings
- `P1` Existing databases with spaces can fail the venue migration
  - Area: Prisma migrations / deployability.
  - Evidence: `packages/db/prisma/migrations/20260511230000_add_venue_model/migration.sql:24` adds nullable `Space.venueId`, then `packages/db/prisma/migrations/20260512000000_make_venue_id_required/migration.sql:5` immediately runs `ALTER COLUMN "venueId" SET NOT NULL`. There is no backfill that creates venues for existing spaces or assigns a non-null `venueId`.
  - Reproduction: Apply these migrations to a database that already has at least one `Space` row from before venues existed; PostgreSQL will reject `SET NOT NULL` while any `venueId` is null.
  - Recommendation: Add an approved follow-up migration path that creates/defaults venues for existing spaces before making `Space.venueId` non-null, or document that deployments must backfill manually before this migration.

- `P1` Seed data no longer satisfies required `Space.venueId`
  - Area: Seed data / local bootstrap.
  - Evidence: `packages/db/prisma/schema.prisma:208` defines required `venueId Int`, but `packages/db/prisma/seed.ts:305-409` creates demo spaces directly from `demoSpaces` entries that include `hostId` and location fields but no `venueId`.
  - Reproduction: Run `pnpm --filter @repo/db db:seed` against a schema with the current migrations applied; Prisma must reject `space.create({ data: spaceData })` because `venueId`/`venue` is missing.
  - Recommendation: Update seed data to upsert demo venues first and connect each demo space to a venue. This changes data shape and should be handled as an approved DB/data fix.

- `P2` Venue create/update drops schema and UI fields
  - Area: Product service venue controller / admin-host venue workflow.
  - Evidence: `apps/admin/src/components/venues/venue-form.shared.ts:28-44` sends `nameTranslations`, `shortDescTranslations`, `descriptionTranslations`, `videoUrl`, and `currency`. `apps/product-service/src/controllers/venue.controller.ts:48-60` does not destructure those fields during create, and `apps/product-service/src/controllers/venue.controller.ts:98-130` updates translations but still omits `videoUrl` and `currency`. The schema has all of these fields at `packages/db/prisma/schema.prisma:119-123` and `:133`.
  - Reproduction: Create a venue from the admin host form with a non-USD currency, YouTube URL, or translations. The API returns success but persisted venue data uses defaults/nulls for omitted fields. Updating a venue cannot persist `videoUrl` or `currency`.
  - Recommendation: Whitelist and validate these fields in `createVenue` and `updateVenue`, including currency enum validation and YouTube URL validation consistent with spaces.

- `P2` Full repository typecheck still fails in booking-service
  - Area: Booking service / generated Prisma enum filter usage.
  - Evidence: `apps/order-service/src/routes/booking.ts:158-160` builds `status.in` with `["PENDING", "CONFIRMED"] as const`; `pnpm check-types` fails at `apps/order-service/src/routes/booking.ts:168` because Prisma expects mutable `BookingStatus[]`.
  - Reproduction: Run `pnpm check-types` in this branch.
  - Recommendation: Keep this assigned to the Phase 4 booking-service branch as noted in the prompt, or apply that branch's equivalent fix through normal integration rather than changing Phase 6 scope.

- `P3` Space responses omit newer nested venue fields while shared types imply a fuller venue
  - Area: Product service response shape / shared types.
  - Evidence: `apps/product-service/src/controllers/space.controller.ts:7-23` selects a reduced nested venue without `videoUrl`, translations, `currency`, `createdAt`, or `updatedAt`, while `packages/types/src/space.ts` models `Space.venue` as the shared `Venue` shape.
  - Reproduction: Fetch spaces through product-service and compare `space.venue` with the shared `Venue` interface.
  - Recommendation: Either introduce a smaller shared nested venue type for space responses or expand `venueInclude` if clients need the newer fields.

## Follow-Up Recommendations
- Backfill and validate the venue migration path before relying on current migrations for any database that has pre-venue `Space` rows.
- Fix the seed script to create/connect demo venues, then run seed against a disposable database.
- Update product-service venue create/update to persist currency, video URL, and translations with explicit validation.
- Integrate the Phase 4 booking-service type fix so full `pnpm check-types` can pass on this branch after normal merge flow.
- Clarify shared API DTOs for full venues versus nested venue summaries returned inside space payloads.

## Files Reviewed
- `docs/product-audit-orca-worktree-plan.md`
- `docs/audit-results/README.md`
- `packages/db/package.json`
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260423150000_init/migration.sql`
- `packages/db/prisma/migrations/20260424002000_use_dollar_units/migration.sql`
- `packages/db/prisma/migrations/20260424163000_grouped_space_taxonomy/migration.sql`
- `packages/db/prisma/migrations/20260511230000_add_venue_model/migration.sql`
- `packages/db/prisma/migrations/20260512000000_make_venue_id_required/migration.sql`
- `packages/db/prisma/migrations/20260512120000_add_currency_and_pricing_tiers/migration.sql`
- `packages/db/prisma/migrations/20260512140100_add_amenity_space_types/migration.sql`
- `packages/db/prisma/migrations/20260512140200_add_translation_columns/migration.sql`
- `packages/db/prisma/migrations/20260512140300_add_video_url/migration.sql`
- `packages/db/prisma/migrations/20260512140400_add_venue_lat_lng_index/migration.sql`
- `packages/db/prisma/migrations/migration_lock.toml`
- `packages/db/prisma/seed.ts`
- `packages/db/src/client.ts`
- `packages/db/src/index.ts`
- `packages/types/package.json`
- `packages/types/src/auth.ts`
- `packages/types/src/booking.ts`
- `packages/types/src/currency.ts`
- `packages/types/src/index.ts`
- `packages/types/src/payout.ts`
- `packages/types/src/review.ts`
- `packages/types/src/space.ts`
- `packages/types/src/venue.ts`
- `apps/product-service/src/controllers/space.controller.ts`
- `apps/product-service/src/controllers/venue.controller.ts`
- `apps/product-service/src/controllers/currency.controller.ts`
- `apps/product-service/src/lib/space-taxonomy.ts`
- `apps/product-service/src/lib/translations.ts`
- `apps/order-service/src/routes/booking.ts`
- `apps/admin/src/components/venues/venue-form.shared.ts`
