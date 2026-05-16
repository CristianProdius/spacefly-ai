-- DropForeignKey (old nullable FK)
ALTER TABLE "Space" DROP CONSTRAINT "Space_venueId_fkey";

-- Backfill one venue per existing legacy space before venueId becomes required.
DO $$
DECLARE
    space_record RECORD;
    backfilled_venue_id INTEGER;
BEGIN
    FOR space_record IN SELECT * FROM "Space" WHERE "venueId" IS NULL LOOP
        INSERT INTO "Venue" (
            "name",
            "shortDescription",
            "description",
            "images",
            "address",
            "city",
            "state",
            "country",
            "postalCode",
            "latitude",
            "longitude",
            "hostId",
            "isActive",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            space_record."name",
            COALESCE(space_record."shortDescription", ''),
            COALESCE(space_record."description", ''),
            COALESCE(space_record."images", '[]'::jsonb),
            space_record."address",
            space_record."city",
            space_record."state",
            space_record."country",
            space_record."postalCode",
            space_record."latitude",
            space_record."longitude",
            space_record."hostId",
            space_record."isActive",
            space_record."createdAt",
            CURRENT_TIMESTAMP
        )
        RETURNING "id" INTO backfilled_venue_id;

        UPDATE "Space"
        SET "venueId" = backfilled_venue_id
        WHERE "id" = space_record."id";
    END LOOP;
END $$;

-- AlterTable – make venueId non-nullable
ALTER TABLE "Space" ALTER COLUMN "venueId" SET NOT NULL;

-- AddForeignKey (required FK, restrict delete)
ALTER TABLE "Space" ADD CONSTRAINT "Space_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
