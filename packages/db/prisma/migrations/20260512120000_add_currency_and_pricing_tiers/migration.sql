-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'EUR', 'MDL');

-- AlterTable: Add currency and exchangeRate to Booking
ALTER TABLE "public"."Booking" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable: Add currency to Space
ALTER TABLE "public"."Space" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD';

-- AlterTable: Add currency to Venue
ALTER TABLE "public"."Venue" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD';

-- CreateTable: ExchangeRate
CREATE TABLE "public"."ExchangeRate" (
    "id" SERIAL NOT NULL,
    "fromCurrency" "public"."Currency" NOT NULL,
    "toCurrency" "public"."Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PricingTier
CREATE TABLE "public"."PricingTier" (
    "id" SERIAL NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_key" ON "public"."ExchangeRate"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "PricingTier_spaceId_idx" ON "public"."PricingTier"("spaceId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_spaceId_minutes_key" ON "public"."PricingTier"("spaceId", "minutes");

-- AddForeignKey
ALTER TABLE "public"."PricingTier" ADD CONSTRAINT "PricingTier_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "public"."Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
