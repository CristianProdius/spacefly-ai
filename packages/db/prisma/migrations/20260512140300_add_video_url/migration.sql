-- AlterTable: Add videoUrl to Space
ALTER TABLE "public"."Space" ADD COLUMN     "videoUrl" TEXT;

-- AlterTable: Add videoUrl to Venue
ALTER TABLE "public"."Venue" ADD COLUMN     "videoUrl" TEXT;
