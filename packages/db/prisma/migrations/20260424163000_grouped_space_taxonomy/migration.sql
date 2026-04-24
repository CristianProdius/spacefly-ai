CREATE TABLE "public"."SpaceCategoryGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpaceCategoryGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."SpaceCategory"
    ADD COLUMN "groupSlug" TEXT,
    ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "SpaceCategoryGroup_slug_key" ON "public"."SpaceCategoryGroup"("slug");
CREATE INDEX "SpaceCategoryGroup_sortOrder_idx" ON "public"."SpaceCategoryGroup"("sortOrder");

INSERT INTO "public"."SpaceCategoryGroup" ("name", "slug", "sortOrder")
VALUES
    ('Business & Office', 'business-office', 1),
    ('Events & Celebrations', 'events-celebrations', 2),
    ('Creative & Media', 'creative-media', 3),
    ('Retail & Commercial', 'retail-commercial', 4),
    ('Sports & Wellness', 'sports-wellness', 5),
    ('Industrial & Logistics', 'industrial-logistics', 6)
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "sortOrder" = EXCLUDED."sortOrder";

INSERT INTO "public"."SpaceCategory" ("name", "slug", "description", "icon", "groupSlug", "sortOrder")
VALUES
    ('Meeting & Training Room', 'meeting-training-room', NULL, NULL, 'business-office', 3)
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "icon" = EXCLUDED."icon",
    "groupSlug" = EXCLUDED."groupSlug",
    "sortOrder" = EXCLUDED."sortOrder";

UPDATE "public"."Space"
SET "categorySlug" = 'meeting-training-room'
WHERE "categorySlug" = 'meeting-room';

DELETE FROM "public"."SpaceCategory"
WHERE "slug" = 'meeting-room';

INSERT INTO "public"."SpaceCategory" ("name", "slug", "description", "icon", "groupSlug", "sortOrder")
VALUES
    ('Office Desk', 'office-desk', NULL, NULL, 'business-office', 1),
    ('Private Office', 'private-office', NULL, NULL, 'business-office', 2),
    ('Meeting & Training Room', 'meeting-training-room', NULL, NULL, 'business-office', 3),
    ('Coworking Space', 'coworking-space', NULL, NULL, 'business-office', 4),
    ('Large Conference Hall', 'large-conference-hall', NULL, NULL, 'business-office', 5),
    ('Event Venue', 'event-venue', NULL, NULL, 'events-celebrations', 1),
    ('Wedding Venue', 'wedding-venue', NULL, NULL, 'events-celebrations', 2),
    ('Rooftop Venue', 'rooftop-venue', NULL, NULL, 'events-celebrations', 3),
    ('Garden / Outdoor Space', 'garden-outdoor-space', NULL, NULL, 'events-celebrations', 4),
    ('Private Party Space', 'private-party-space', NULL, NULL, 'events-celebrations', 5),
    ('Private Function Room', 'private-function-room', NULL, NULL, 'events-celebrations', 6),
    ('Private Dining Room', 'private-dining-room', NULL, NULL, 'events-celebrations', 7),
    ('The VIP Suite / Private Lounge', 'vip-suite-private-lounge', NULL, NULL, 'events-celebrations', 8),
    ('Workshop / Maker Space', 'workshop-maker-space', NULL, NULL, 'creative-media', 1),
    ('Photo & Video Studio', 'photo-video-studio', NULL, NULL, 'creative-media', 2),
    ('Podcast Studio', 'podcast-studio', NULL, NULL, 'creative-media', 3),
    ('Dark Kitchen / Cloud Kitchen', 'dark-kitchen-cloud-kitchen', NULL, NULL, 'creative-media', 4),
    ('Private Cinema / Screening Room', 'private-cinema-screening-room', NULL, NULL, 'creative-media', 5),
    ('Gaming / Esports Lounge', 'gaming-esports-lounge', NULL, NULL, 'creative-media', 6),
    ('Retail Store / Shop Front', 'retail-store-shop-front', NULL, NULL, 'retail-commercial', 1),
    ('Pop-up Store', 'pop-up-store', NULL, NULL, 'retail-commercial', 2),
    ('Showroom', 'showroom', NULL, NULL, 'retail-commercial', 3),
    ('Yoga / Dance Studio', 'yoga-dance-studio', NULL, NULL, 'sports-wellness', 1),
    ('Sport Courts & Fields', 'sport-courts-fields', NULL, NULL, 'sports-wellness', 2),
    ('Indoor & Fitness', 'indoor-fitness', NULL, NULL, 'sports-wellness', 3),
    ('Sporturi de Nișă', 'specialty-sports', NULL, NULL, 'sports-wellness', 4),
    ('Micro-Warehouse / Storage', 'micro-warehouse-storage', NULL, NULL, 'industrial-logistics', 1),
    ('Warehouse / Storage Unit', 'warehouse-storage-unit', NULL, NULL, 'industrial-logistics', 2),
    ('Distribution Center', 'distribution-center', NULL, NULL, 'industrial-logistics', 3),
    ('Cold Storage', 'cold-storage', NULL, NULL, 'industrial-logistics', 4),
    ('Big Box Retail', 'big-box-retail', NULL, NULL, 'industrial-logistics', 5),
    ('Light Industrial / Workshop', 'light-industrial-workshop', NULL, NULL, 'industrial-logistics', 6)
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "icon" = EXCLUDED."icon",
    "groupSlug" = EXCLUDED."groupSlug",
    "sortOrder" = EXCLUDED."sortOrder";

UPDATE "public"."SpaceCategory"
SET "groupSlug" = 'business-office'
WHERE "groupSlug" IS NULL;

ALTER TABLE "public"."SpaceCategory"
    ALTER COLUMN "groupSlug" SET NOT NULL;

CREATE INDEX "SpaceCategory_groupSlug_idx" ON "public"."SpaceCategory"("groupSlug");
CREATE INDEX "SpaceCategory_groupSlug_sortOrder_idx" ON "public"."SpaceCategory"("groupSlug", "sortOrder");

ALTER TABLE "public"."SpaceCategory"
    ADD CONSTRAINT "SpaceCategory_groupSlug_fkey"
    FOREIGN KEY ("groupSlug") REFERENCES "public"."SpaceCategoryGroup"("slug")
    ON DELETE RESTRICT ON UPDATE CASCADE;
