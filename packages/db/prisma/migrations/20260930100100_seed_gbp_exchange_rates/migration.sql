-- Starting GBP rates so London prices convert and GBP bookings don't 503 with
-- MissingExchangeRateError. The admin Exchange Rates page only edits existing
-- rows, so the rows must exist; these values are approximate — review them in
-- /admin/exchange-rates after deploy. DO NOTHING keeps any rate already set.
INSERT INTO "ExchangeRate" ("fromCurrency", "toCurrency", "rate", "updatedAt")
VALUES
  ('GBP', 'USD', 1.340000, NOW()),
  ('USD', 'GBP', 0.746269, NOW()),
  ('GBP', 'EUR', 1.160000, NOW()),
  ('EUR', 'GBP', 0.862069, NOW())
ON CONFLICT ("fromCurrency", "toCurrency") DO NOTHING;
