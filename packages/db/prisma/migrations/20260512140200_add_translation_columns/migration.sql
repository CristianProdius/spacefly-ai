-- AlterTable: Add translation JSON columns to Space
ALTER TABLE "public"."Space" ADD COLUMN     "nameTranslations" JSONB,
ADD COLUMN     "shortDescTranslations" JSONB,
ADD COLUMN     "descriptionTranslations" JSONB;

-- AlterTable: Add translation JSON columns to Venue
ALTER TABLE "public"."Venue" ADD COLUMN     "nameTranslations" JSONB,
ADD COLUMN     "shortDescTranslations" JSONB,
ADD COLUMN     "descriptionTranslations" JSONB;
