-- Add GBP (British pound) to the Currency enum for the London listings.
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction that adds
-- it, so the GBP exchange-rate rows live in the next migration.
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'GBP';
