ALTER TABLE "Space"
  ALTER COLUMN "pricePerHour" TYPE DOUBLE PRECISION USING "pricePerHour"::double precision,
  ALTER COLUMN "pricePerDay" TYPE DOUBLE PRECISION USING "pricePerDay"::double precision,
  ALTER COLUMN "cleaningFee" TYPE DOUBLE PRECISION USING "cleaningFee"::double precision,
  ALTER COLUMN "cleaningFee" SET DEFAULT 0;

ALTER TABLE "Booking"
  ALTER COLUMN "subtotal" TYPE DOUBLE PRECISION USING "subtotal"::double precision,
  ALTER COLUMN "cleaningFee" TYPE DOUBLE PRECISION USING "cleaningFee"::double precision,
  ALTER COLUMN "serviceFee" TYPE DOUBLE PRECISION USING "serviceFee"::double precision,
  ALTER COLUMN "totalAmount" TYPE DOUBLE PRECISION USING "totalAmount"::double precision,
  ALTER COLUMN "cleaningFee" SET DEFAULT 0;
