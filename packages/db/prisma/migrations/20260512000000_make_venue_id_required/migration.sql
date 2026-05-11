-- DropForeignKey (old nullable FK)
ALTER TABLE "Space" DROP CONSTRAINT "Space_venueId_fkey";

-- AlterTable – make venueId non-nullable
ALTER TABLE "Space" ALTER COLUMN "venueId" SET NOT NULL;

-- AddForeignKey (required FK, restrict delete)
ALTER TABLE "Space" ADD CONSTRAINT "Space_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
