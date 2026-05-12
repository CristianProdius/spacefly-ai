-- AlterTable: Add spaceTypes array to Amenity
ALTER TABLE "public"."Amenity" ADD COLUMN     "spaceTypes" "public"."SpaceType"[] DEFAULT ARRAY[]::"public"."SpaceType"[];
