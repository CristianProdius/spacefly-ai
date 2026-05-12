# Phase 3: Multi-Currency & Interval Pricing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let hosts set prices in their local currency (MDL, EUR, USD) with automatic conversion for search/display, and offer tiered pricing for different rental durations (1h, 4h, full day, week, month).

**Architecture:** Add a `currency` field to Space/Venue/Booking. Add an admin-managed `ExchangeRate` table with MDL/EUR/USD rates against a base currency (USD). Add a `PricingTier` model for interval-based pricing. Price filtering converts filter values to each space's currency using exchange rates. Display uses the space's native currency with optional user-selected display currency. Bookings lock in the exchange rate at creation time.

**Tech Stack:** Prisma (PostgreSQL), Express (product-service), Fastify (order-service), Next.js (client + admin), TypeScript, Tailwind CSS

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `packages/db/prisma/migrations/[timestamp]_add_currency_and_pricing_tiers/migration.sql` | Schema migration |
| `packages/types/src/currency.ts` | Currency types, symbols, formatting helpers |
| `apps/product-service/src/controllers/currency.controller.ts` | Exchange rate CRUD (admin-only) |
| `apps/product-service/src/routes/currency.route.ts` | Currency API routes |
| `apps/product-service/src/lib/currency.ts` | Server-side conversion utilities |
| `apps/client/src/lib/currency.ts` | Client-side formatting with currency support |
| `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx` | Admin exchange rate management |
| `apps/admin/src/components/spaces/pricing-tiers-editor.tsx` | Pricing tiers input component |

### Modified Files
| File | What Changes |
|------|-------------|
| `packages/db/prisma/schema.prisma` | Add Currency enum, ExchangeRate model, PricingTier model, currency field on Space/Venue/Booking |
| `packages/types/src/space.ts` | Add currency to Space interface, add PricingTier type |
| `packages/types/src/booking.ts` | Add currency and exchangeRate to Booking |
| `apps/product-service/src/controllers/space.controller.ts` | Currency-aware price filtering and sorting |
| `apps/product-service/src/index.ts` | Register currency routes |
| `apps/order-service/src/routes/booking.ts` | Currency-aware price calculation, lock exchange rate |
| `apps/client/src/lib/utils.ts` | Update formatPrice/formatPriceFull to accept currency |
| `apps/client/src/components/SpaceCard.tsx` | Display prices in space's currency |
| `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx` | Show prices in space currency, pricing tier selection |
| `apps/client/src/components/SpaceFilter.tsx` | Currency-aware price filter |
| `apps/admin/src/components/spaces/space-form.tsx` | Add currency selector, pricing tiers editor |
| `apps/admin/src/components/spaces/space-form.shared.ts` | Add currency and pricingTiers to form types |
| `apps/admin/src/components/venues/venue-form.tsx` | Add default currency to venue form |
| `apps/admin/src/components/venues/venue-form.shared.ts` | Add currency to venue form types |
| `apps/admin/src/components/AppSidebar.tsx` | Add Exchange Rates nav item |
| `apps/client/messages/en.json`, `ro.json`, `ru.json` | Currency-related i18n keys |

---

## Task 1: Schema — Add Currency, ExchangeRate, and PricingTier Models

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

### Step-by-step:

- [ ] **Step 1: Add Currency enum**

Add after the existing enums (after `PayoutStatus`):

```prisma
enum Currency {
  USD
  EUR
  MDL
}
```

- [ ] **Step 2: Add ExchangeRate model**

Add after the Venue model section:

```prisma
// ==================== EXCHANGE RATES ====================

model ExchangeRate {
  id           Int      @id @default(autoincrement())
  fromCurrency Currency
  toCurrency   Currency
  rate         Float    // 1 fromCurrency = rate toCurrency
  updatedAt    DateTime @updatedAt
  updatedBy    String?  // admin user ID who last updated

  @@unique([fromCurrency, toCurrency])
}
```

- [ ] **Step 3: Add PricingTier model**

Add after the Amenity/SpaceAmenity section:

```prisma
model PricingTier {
  id       Int    @id @default(autoincrement())
  spaceId  Int
  minutes  Int    // duration in minutes: 60=1h, 240=4h, 480=8h, 1440=1day, 10080=1week, 43200=1month
  label    String // display label: "1 hour", "Half day (4h)", "Full day", "1 week", "1 month"
  price    Float  // price in the space's currency

  space Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@unique([spaceId, minutes])
  @@index([spaceId])
}
```

- [ ] **Step 4: Add currency field to Space**

In the Space model, add after `cleaningFee`:

```prisma
  currency         Currency           @default(USD)
```

Add `pricingTiers` to Space relations:

```prisma
  pricingTiers PricingTier[]
```

- [ ] **Step 5: Add currency field to Venue**

In the Venue model, add after `longitude`:

```prisma
  currency Currency @default(USD) // Default currency for new spaces under this venue
```

- [ ] **Step 6: Add currency and exchangeRate to Booking**

In the Booking model, add after `totalAmount`:

```prisma
  currency     Currency @default(USD)
  exchangeRate Float    @default(1.0) // Rate to USD at time of booking (for reporting)
```

- [ ] **Step 7: Generate and run migration**

```bash
cd packages/db
pnpm prisma migrate dev --name add_currency_and_pricing_tiers
pnpm prisma generate
```

- [ ] **Step 8: Commit**

```bash
git add packages/db/prisma/ packages/db/generated/
git commit -m "feat(db): add Currency enum, ExchangeRate, PricingTier models, currency on Space/Venue/Booking"
```

---

## Task 2: Seed Exchange Rates + Data Migration

**Files:**
- Modify: `packages/db/prisma/seed.ts`

### Step-by-step:

- [ ] **Step 1: Add exchange rate seeding**

In the seed file, add after existing seed logic:

```typescript
// Seed exchange rates (approximate May 2026 rates)
const exchangeRates = [
  { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  { fromCurrency: "USD", toCurrency: "MDL", rate: 17.8 },
  { fromCurrency: "EUR", toCurrency: "USD", rate: 1.09 },
  { fromCurrency: "EUR", toCurrency: "MDL", rate: 19.35 },
  { fromCurrency: "MDL", toCurrency: "USD", rate: 0.056 },
  { fromCurrency: "MDL", toCurrency: "EUR", rate: 0.052 },
];

for (const rate of exchangeRates) {
  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: rate.fromCurrency as any,
        toCurrency: rate.toCurrency as any,
      },
    },
    update: { rate: rate.rate },
    create: rate as any,
  });
}
console.log("Exchange rates seeded");
```

- [ ] **Step 2: Run seed against local DB to populate rates**

```bash
cd packages/db && pnpm prisma db seed
```

If the seed script has issues running standalone, insert the rates via a quick SQL script or the Prisma Studio.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/seed.ts
git commit -m "feat(db): seed exchange rates for USD/EUR/MDL"
```

---

## Task 3: Currency Types and Utilities

**Files:**
- Create: `packages/types/src/currency.ts`
- Modify: `packages/types/src/space.ts`
- Modify: `packages/types/src/booking.ts`

### Step-by-step:

- [ ] **Step 1: Create currency types**

Create `packages/types/src/currency.ts`:

```typescript
export type Currency = "USD" | "EUR" | "MDL";

export interface ExchangeRate {
  id: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  updatedAt: string;
  updatedBy: string | null;
}

export interface PricingTier {
  id: number;
  spaceId: number;
  minutes: number;
  label: string;
  price: number;
}

export const CURRENCIES: readonly Currency[] = ["USD", "EUR", "MDL"] as const;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  MDL: "L",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "US Dollar (USD)",
  EUR: "Euro (EUR)",
  MDL: "Moldovan Leu (MDL)",
};

/** Common pricing tier presets (in minutes) for the admin UI */
export const PRICING_TIER_PRESETS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
  { minutes: 240, label: "4 hours (half day)" },
  { minutes: 480, label: "8 hours (full day)" },
  { minutes: 1440, label: "1 day" },
  { minutes: 2880, label: "2 days" },
  { minutes: 4320, label: "3 days" },
  { minutes: 10080, label: "1 week" },
  { minutes: 43200, label: "1 month" },
] as const;
```

- [ ] **Step 2: Update Space interface**

In `packages/types/src/space.ts`, add to the `Space` interface after `cleaningFee`:

```typescript
  currency: Currency;
  pricingTiers?: PricingTier[];
```

Add import at top:
```typescript
export type { Currency, ExchangeRate, PricingTier } from "./currency";
```

- [ ] **Step 3: Update Booking interface**

In `packages/types/src/booking.ts`, add to the `Booking` interface after `totalAmount`:

```typescript
  currency: string;
  exchangeRate: number;
```

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/currency.ts packages/types/src/space.ts packages/types/src/booking.ts
git commit -m "feat(types): add Currency, ExchangeRate, PricingTier types"
```

---

## Task 4: Server-Side Currency Conversion Library

**Files:**
- Create: `apps/product-service/src/lib/currency.ts`

### Step-by-step:

- [ ] **Step 1: Create currency conversion utilities**

Create `apps/product-service/src/lib/currency.ts`:

```typescript
import { prisma } from "@repo/db";

interface RateCache {
  rates: Map<string, number>;
  loadedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Load all exchange rates into an in-memory cache */
async function loadRates(): Promise<Map<string, number>> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL) {
    return cache.rates;
  }

  const rows = await prisma.exchangeRate.findMany();
  const rates = new Map<string, number>();

  for (const row of rows) {
    rates.set(`${row.fromCurrency}_${row.toCurrency}`, row.rate);
  }

  // Add identity rates
  for (const c of ["USD", "EUR", "MDL"]) {
    rates.set(`${c}_${c}`, 1.0);
  }

  cache = { rates, loadedAt: Date.now() };
  return rates;
}

/** Convert an amount from one currency to another */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  const rates = await loadRates();
  const rate = rates.get(`${from}_${to}`);
  if (!rate) throw new Error(`No exchange rate for ${from} → ${to}`);
  return Math.round(amount * rate * 100) / 100;
}

/** Get the exchange rate from one currency to another */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1.0;
  const rates = await loadRates();
  const rate = rates.get(`${from}_${to}`);
  if (!rate) throw new Error(`No exchange rate for ${from} → ${to}`);
  return rate;
}

/** Convert a price range (min/max in USD) to a target currency for filtering */
export async function convertPriceRange(
  minPrice: number | null,
  maxPrice: number | null,
  targetCurrency: string
): Promise<{ min: number | null; max: number | null }> {
  if (targetCurrency === "USD") return { min: minPrice, max: maxPrice };
  const rate = await getRate("USD", targetCurrency);
  return {
    min: minPrice != null ? Math.round(minPrice * rate * 100) / 100 : null,
    max: maxPrice != null ? Math.round(maxPrice * rate * 100) / 100 : null,
  };
}

/** Invalidate the cache (call after admin updates rates) */
export function invalidateRateCache(): void {
  cache = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/product-service/src/lib/currency.ts
git commit -m "feat(api): add server-side currency conversion library with cache"
```

---

## Task 5: Exchange Rate Admin API

**Files:**
- Create: `apps/product-service/src/controllers/currency.controller.ts`
- Create: `apps/product-service/src/routes/currency.route.ts`
- Modify: `apps/product-service/src/index.ts`

### Step-by-step:

- [ ] **Step 1: Create currency controller**

Create `apps/product-service/src/controllers/currency.controller.ts`:

```typescript
import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { invalidateRateCache } from "../lib/currency.js";

/** GET /currencies/rates — public, returns all exchange rates */
export const getRates = async (_req: Request, res: Response) => {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }],
  });
  res.status(200).json(rates);
};

/** PUT /currencies/rates — admin-only, bulk update exchange rates */
export const updateRates = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { rates } = req.body;

  if (!Array.isArray(rates)) {
    return res.status(400).json({ message: "rates must be an array" });
  }

  const results = [];
  for (const { fromCurrency, toCurrency, rate } of rates) {
    if (!fromCurrency || !toCurrency || typeof rate !== "number" || rate <= 0) {
      return res.status(400).json({
        message: `Invalid rate entry: ${fromCurrency} → ${toCurrency} = ${rate}`,
      });
    }

    const updated = await prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
      update: { rate, updatedBy: userId },
      create: { fromCurrency, toCurrency, rate, updatedBy: userId },
    });
    results.push(updated);
  }

  invalidateRateCache();
  res.status(200).json(results);
};
```

- [ ] **Step 2: Create currency routes**

Create `apps/product-service/src/routes/currency.route.ts`:

```typescript
import { Router } from "express";
import { shouldBeAdmin } from "../middleware/authMiddleware.js";
import { getRates, updateRates } from "../controllers/currency.controller.js";

const router: Router = Router();

router.get("/rates", getRates);
router.put("/rates", shouldBeAdmin, updateRates);

export default router;
```

- [ ] **Step 3: Register in product-service**

In `apps/product-service/src/index.ts`, add:

```typescript
import currencyRoutes from "./routes/currency.route.js";
```

And register:
```typescript
app.use("/currencies", currencyRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add apps/product-service/src/controllers/currency.controller.ts apps/product-service/src/routes/currency.route.ts apps/product-service/src/index.ts
git commit -m "feat(api): add exchange rate management endpoints (admin-only)"
```

---

## Task 6: Update Space API — Currency-Aware Filtering + PricingTiers

**Files:**
- Modify: `apps/product-service/src/controllers/space.controller.ts`

### Step-by-step:

- [ ] **Step 1: Add pricingTiers to space includes**

Add `pricingTiers` to the relevant includes in `getSpaces` and `getSpace`:

In `getSpaces` findMany include, add:
```typescript
pricingTiers: {
  orderBy: { minutes: "asc" },
},
```

In `getSpace` findUnique include, add:
```typescript
pricingTiers: {
  orderBy: { minutes: "asc" },
},
```

- [ ] **Step 2: Update price filtering to be currency-aware**

The current price filter assumes all prices are in USD. For multi-currency, the simplest correct approach is: convert the filter's USD values to each space's currency at query time. Since Prisma can't do this in a WHERE clause, we filter in two steps:

Replace the price filter section in the `where` clause. Remove the existing `(minPrice || maxPrice)` block and instead do post-query filtering. OR, simpler: keep the filter as-is (approximate) and add a `currency` query param so users can filter by currency:

Add to query destructuring:
```typescript
currency: currencyParam,
```

Add currency filter to where:
```typescript
...(currencyParam && { currency: currencyParam as string }),
```

The price min/max filter stays as-is — it's approximate across currencies but functional. This is acceptable for MVP since most spaces in a given city will use the same currency.

- [ ] **Step 3: Include pricingTiers in createSpace**

In `createSpace`, after creating the space, if `pricingTiers` is in the request body, create them:

```typescript
const { amenityIds, venueId, pricingTiers, ...spaceData } = req.body;

// ... existing space creation ...

// Create pricing tiers if provided
if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
  await prisma.pricingTier.createMany({
    data: pricingTiers.map((tier: { minutes: number; label: string; price: number }) => ({
      spaceId: space.id,
      minutes: tier.minutes,
      label: tier.label,
      price: tier.price,
    })),
  });
}
```

- [ ] **Step 4: Update updateSpace to handle pricingTiers**

In `updateSpace`, add `pricingTiers` to the destructured body (add to the excluded keys before whitelist). After the space update, handle tiers:

```typescript
const { amenityIds, venueId, pricingTiers, ...body } = req.body;

// ... existing update logic ...

// Update pricing tiers if provided
if (pricingTiers !== undefined) {
  await prisma.pricingTier.deleteMany({ where: { spaceId } });
  if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
    await prisma.pricingTier.createMany({
      data: pricingTiers.map((tier: { minutes: number; label: string; price: number }) => ({
        spaceId,
        minutes: tier.minutes,
        label: tier.label,
        price: tier.price,
      })),
    });
  }
}
```

- [ ] **Step 5: Add `currency` to the allowed update fields whitelist**

In `updateSpace`, add `"currency"` to the `allowedKeys` array.

- [ ] **Step 6: Commit**

```bash
git add apps/product-service/src/controllers/space.controller.ts
git commit -m "feat(api): currency-aware space filtering, pricing tiers CRUD"
```

---

## Task 7: Update Booking Price Calculation

**Files:**
- Modify: `apps/order-service/src/routes/booking.ts`

### Step-by-step:

- [ ] **Step 1: Update calculateBookingPrice for pricing tiers**

Modify the function to check pricing tiers first, falling back to pricePerHour/pricePerDay:

```typescript
const calculateBookingPrice = (
  space: {
    pricingType: string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    cleaningFee: number;
    currency: string;
    pricingTiers?: Array<{ minutes: number; price: number }>;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
): { subtotal: number; cleaningFee: number; serviceFee: number; total: number } => {
  let subtotal = 0;

  // Calculate total minutes of the booking
  let totalMinutes = 0;
  if (startTime && endTime) {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const hoursPerDay = (endH! - startH!) + (endM! - startM!) / 60;
    const days = differenceInDays(endDate, startDate) + 1;
    totalMinutes = Math.round(hoursPerDay * 60 * days);
  } else {
    const days = differenceInDays(endDate, startDate) + 1;
    totalMinutes = days * 1440; // 1440 min per day
  }

  // Try pricing tiers first (find best matching tier)
  if (space.pricingTiers && space.pricingTiers.length > 0) {
    // Sort tiers by minutes descending to find the best (largest) fit
    const sortedTiers = [...space.pricingTiers].sort((a, b) => b.minutes - a.minutes);
    const bestTier = sortedTiers.find((t) => t.minutes <= totalMinutes);

    if (bestTier) {
      // How many times does this tier fit?
      const units = Math.ceil(totalMinutes / bestTier.minutes);
      subtotal = roundCurrency(units * bestTier.price);
    }
  }

  // Fallback to pricePerHour/pricePerDay if no tier matched
  if (subtotal === 0) {
    if (space.pricingType === "HOURLY" && space.pricePerHour && startTime && endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const hours = (endH! - startH!) + (endM! - startM!) / 60;
      const days = differenceInDays(endDate, startDate) + 1;
      subtotal = roundCurrency(space.pricePerHour * hours * days);
    } else if (space.pricingType === "DAILY" && space.pricePerDay) {
      const days = differenceInDays(endDate, startDate) + 1;
      subtotal = roundCurrency(space.pricePerDay * days);
    } else if (space.pricingType === "BOTH") {
      if (startTime && endTime && space.pricePerHour) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const hours = (endH! - startH!) + (endM! - startM!) / 60;
        const days = differenceInDays(endDate, startDate) + 1;
        subtotal = roundCurrency(space.pricePerHour * hours * days);
      } else if (space.pricePerDay) {
        const days = differenceInDays(endDate, startDate) + 1;
        subtotal = roundCurrency(space.pricePerDay * days);
      }
    }
  }

  const cleaningFee = roundCurrency(space.cleaningFee);
  const serviceFee = roundCurrency(subtotal * 0.1);
  const total = roundCurrency(subtotal + cleaningFee + serviceFee);

  return { subtotal, cleaningFee, serviceFee, total };
};
```

- [ ] **Step 2: Include pricingTiers when fetching space for booking**

In the booking creation handler, update the space query to include `pricingTiers`:

```typescript
const space = await prisma.space.findUnique({
  where: { id: spaceId },
  include: {
    pricingTiers: { orderBy: { minutes: "asc" } },
  },
});
```

- [ ] **Step 3: Store currency and exchangeRate on booking**

When creating the booking, add currency from the space and calculate exchangeRate to USD:

```typescript
// After price calculation, before prisma.booking.create:
const exchangeRateToUsd = space.currency === "USD" ? 1.0 : await getExchangeRate(space.currency);

// In the create data:
currency: space.currency,
exchangeRate: exchangeRateToUsd,
```

For the exchange rate lookup, add a simple helper at the top of the file:

```typescript
async function getExchangeRate(fromCurrency: string): Promise<number> {
  if (fromCurrency === "USD") return 1.0;
  const rate = await prisma.exchangeRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: fromCurrency as any, toCurrency: "USD" as any } },
  });
  return rate?.rate ?? 1.0;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/order-service/src/routes/booking.ts
git commit -m "feat(booking): pricing tier support and currency tracking on bookings"
```

---

## Task 8: Client-Side Currency Formatting

**Files:**
- Create: `apps/client/src/lib/currency.ts`
- Modify: `apps/client/src/lib/utils.ts`

### Step-by-step:

- [ ] **Step 1: Create client currency utilities**

Create `apps/client/src/lib/currency.ts`:

```typescript
import type { Currency } from "@repo/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  MDL: "L",
};

const CURRENCY_POSITION: Record<string, "prefix" | "suffix"> = {
  USD: "prefix",
  EUR: "prefix",
  MDL: "suffix",
};

/** Format a price with its currency symbol: "$50", "€50", "50 L" */
export function formatCurrencyPrice(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount == null) return "";
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}

/** Format a price with full decimal places: "$50.00", "€50.00", "50.00 L" */
export function formatCurrencyPriceFull(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount == null) return formatCurrencyPrice(0, currency);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
```

- [ ] **Step 2: Update utils.ts formatters to use currency**

In `apps/client/src/lib/utils.ts`, update the existing formatters to accept an optional currency parameter and delegate to the new functions:

```typescript
import { formatCurrencyPrice, formatCurrencyPriceFull } from "./currency";

// Update formatPrice to accept optional currency
export const formatPrice = (price: number | null | undefined, currency?: string): string | null => {
  if (price == null) return null;
  return formatCurrencyPrice(price, currency);
};

// Update formatPriceFull to accept optional currency
export const formatPriceFull = (price: number | null | undefined, currency?: string): string => {
  if (price == null) return formatCurrencyPriceFull(0, currency);
  return formatCurrencyPriceFull(price, currency);
};

// Update getPriceDisplay to accept and use currency
export const getPriceDisplay = (
  space: Pick<Space, "pricingType" | "pricePerHour" | "pricePerDay"> & { currency?: string },
  labels: PriceLabels = defaultPriceLabels,
): string => {
  const c = (space as any).currency;
  if (space.pricingType === "HOURLY" && space.pricePerHour)
    return `${formatPrice(space.pricePerHour, c)}${labels.perHr}`;
  if (space.pricingType === "DAILY" && space.pricePerDay)
    return `${formatPrice(space.pricePerDay, c)}${labels.perDay}`;
  if (space.pricingType === "BOTH") {
    if (space.pricePerHour)
      return `${labels.from}${labels.from ? " " : ""}${formatPrice(space.pricePerHour, c)}${labels.perHr}`;
    return `${formatPrice(space.pricePerDay, c)}${labels.perDay}`;
  }
  return labels.contactForPricing;
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/lib/currency.ts apps/client/src/lib/utils.ts
git commit -m "feat(client): currency-aware price formatting (USD/EUR/MDL)"
```

---

## Task 9: Admin — Exchange Rate Management Page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx`
- Modify: `apps/admin/src/components/AppSidebar.tsx`

### Step-by-step:

- [ ] **Step 1: Create exchange rate management page**

Create `apps/admin/src/app/(dashboard)/admin/exchange-rates/page.tsx`:

A "use client" page that:
- Fetches `GET /currencies/rates` on mount
- Displays a table of all 6 rate pairs (USD↔EUR, USD↔MDL, EUR↔MDL)
- Each row has an editable input for the rate
- "Save All" button sends `PUT /currencies/rates` with the updated rates
- Shows "Last updated" timestamp and who updated

Follow the existing admin page patterns for layout, styling, auth token handling.

- [ ] **Step 2: Add "Exchange Rates" to admin sidebar**

In `apps/admin/src/components/AppSidebar.tsx`, add to `adminNavItems`:

```typescript
{ title: "Exchange Rates", url: "/admin/exchange-rates", icon: DollarSign },
```

Import `DollarSign` from lucide-react (already imported).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/admin/exchange-rates/ apps/admin/src/components/AppSidebar.tsx
git commit -m "feat(admin): exchange rate management page for admins"
```

---

## Task 10: Admin — Currency Selector + Pricing Tiers in Space Form

**Files:**
- Create: `apps/admin/src/components/spaces/pricing-tiers-editor.tsx`
- Modify: `apps/admin/src/components/spaces/space-form.shared.ts`
- Modify: `apps/admin/src/components/spaces/space-form.tsx`
- Modify: `apps/admin/src/components/venues/venue-form.shared.ts`
- Modify: `apps/admin/src/components/venues/venue-form.tsx`

### Step-by-step:

- [ ] **Step 1: Create pricing tiers editor component**

Create `apps/admin/src/components/spaces/pricing-tiers-editor.tsx`:

A "use client" component that renders a list of pricing tier rows. Each row has:
- A duration selector (dropdown with presets: 1h, 2h, 3h, 4h, 8h, 1d, 2d, 3d, 1w, 1mo, or custom minutes)
- A label input (auto-filled from preset but editable)
- A price input (number, step 0.01)
- A delete button (X icon)
- An "Add tier" button at the bottom

Props: `tiers: Array<{minutes: number, label: string, price: number}>`, `onChange: (tiers) => void`, `currency: string`

The currency symbol should be shown next to the price input.

- [ ] **Step 2: Update SpaceFormValues with currency and pricingTiers**

In `apps/admin/src/components/spaces/space-form.shared.ts`:

Add to `SpaceFormValues`:
```typescript
currency: string;
pricingTiers: Array<{ minutes: number; label: string; price: string }>;
```

Add to `SpaceFormPayload`:
```typescript
currency: string;
pricingTiers: Array<{ minutes: number; label: string; price: number }>;
```

Update `createEmptySpaceFormValues()`:
```typescript
currency: "USD",
pricingTiers: [],
```

Update `buildSpacePayload()` to convert tier prices:
```typescript
pricingTiers: formData.pricingTiers
  .filter((t) => t.price && t.minutes > 0)
  .map((t) => ({ minutes: t.minutes, label: t.label, price: parseFloat(t.price) })),
currency: formData.currency,
```

Update `mapSpaceToFormValues()` to read tiers and currency from space:
```typescript
currency: (space as any).currency ?? "USD",
pricingTiers: (space as any).pricingTiers?.map((t: any) => ({
  minutes: t.minutes,
  label: t.label,
  price: t.price?.toString() ?? "",
})) ?? [],
```

- [ ] **Step 3: Add currency selector and tiers editor to space form**

In `apps/admin/src/components/spaces/space-form.tsx`:

Add a "Currency" dropdown in the pricing section (before the price inputs):

```tsx
<div>
  <label className={labelClassName}>Currency</label>
  <select
    value={formData.currency}
    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
    className={fieldClassName}
  >
    <option value="USD">USD ($)</option>
    <option value="EUR">EUR (€)</option>
    <option value="MDL">MDL (L)</option>
  </select>
</div>
```

Add the `PricingTiersEditor` below the standard price inputs:

```tsx
<PricingTiersEditor
  tiers={formData.pricingTiers}
  onChange={(tiers) => setFormData(prev => ({ ...prev, pricingTiers: tiers }))}
  currency={formData.currency}
/>
```

- [ ] **Step 4: Add default currency to venue form**

In `apps/admin/src/components/venues/venue-form.shared.ts`, add `currency: string` to `VenueFormValues`, `VenueFormPayload`, and `VenueResponse`. Default to `"USD"`.

In `apps/admin/src/components/venues/venue-form.tsx`, add a currency selector similar to the space form.

When creating a new space under a venue, pre-select the venue's currency.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/spaces/ apps/admin/src/components/venues/
git commit -m "feat(admin): currency selector and pricing tiers editor in space/venue forms"
```

---

## Task 11: Client — Display Prices in Space Currency + Pricing Tiers

**Files:**
- Modify: `apps/client/src/components/SpaceCard.tsx`
- Modify: `apps/client/src/app/[locale]/(main)/spaces/[id]/BookingForm.tsx`
- Modify: `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`
- Modify: `apps/client/src/app/[locale]/(main)/bookings/checkout/page.tsx`
- Modify: `apps/client/messages/en.json`, `ro.json`, `ru.json`

### Step-by-step:

- [ ] **Step 1: SpaceCard — pass currency to formatPrice**

In `SpaceCard.tsx`, the `getPriceDisplay` function already picks up `space.currency` from the updated utils.ts (Task 8). No changes needed if the Space type includes currency. Verify it works.

- [ ] **Step 2: BookingForm — show pricing tiers and use currency**

In `BookingForm.tsx`, update the pricing display to show the space's currency. Add pricing tier display if the space has tiers:

- Show a "Pricing" section listing available tiers (e.g., "1 hour: 500 L", "4 hours: 1,800 L")
- Update the calculated price display to use `formatCurrencyPriceFull(amount, space.currency)`
- Replace all `formatPrice(x)` calls with `formatPrice(x, space.currency)`
- Replace all `formatPriceFull(x)` calls with `formatPriceFull(x, space.currency)`

- [ ] **Step 3: Space detail page — show pricing tiers**

In the space detail page, after the price display in the header area, if `space.pricingTiers` has entries, show them as a small table/list:

```tsx
{space.pricingTiers && space.pricingTiers.length > 0 && (
  <div>
    <h2 className="text-xl font-bold text-foreground mb-4">{t("pricingTiers")}</h2>
    <div className="grid grid-cols-2 gap-2">
      {space.pricingTiers.map((tier) => (
        <div key={tier.id} className="flex justify-between py-2 border-b border-border">
          <span className="text-muted">{tier.label}</span>
          <span className="font-medium">{formatPrice(tier.price, space.currency)}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: Checkout page — use booking currency**

In the checkout page, update `formatPriceFull` calls to use the booking draft's currency (stored from the space).

Update `BookingDraft` in the booking store to include `currency: string`.

- [ ] **Step 5: Add i18n keys**

Add to `"spaces"` namespace in all 3 locale files:

**en.json:**
```json
"pricingTiers": "Pricing",
"perDuration": "{price} for {duration}"
```

**ro.json:**
```json
"pricingTiers": "Prețuri",
"perDuration": "{price} pentru {duration}"
```

**ru.json:**
```json
"pricingTiers": "Цены",
"perDuration": "{price} за {duration}"
```

- [ ] **Step 6: Commit**

```bash
git add apps/client/
git commit -m "feat(client): display prices in space currency with pricing tier support"
```

---

## Task 12: Deploy

**Files:** None (operational task)

### Step-by-step:

- [ ] **Step 1: Push and pull on server**

```bash
git push origin main
ssh root@138.197.178.212 "cd /root/spacefly-ai && git pull origin main"
```

- [ ] **Step 2: Build and run migrations**

```bash
scripts/deploy.sh build
scripts/deploy.sh migrate
```

- [ ] **Step 3: Seed exchange rates on production**

Insert the initial exchange rates via SQL:

```sql
INSERT INTO "ExchangeRate" ("fromCurrency", "toCurrency", "rate", "updatedAt")
VALUES
  ('USD', 'EUR', 0.92, NOW()),
  ('USD', 'MDL', 17.8, NOW()),
  ('EUR', 'USD', 1.09, NOW()),
  ('EUR', 'MDL', 19.35, NOW()),
  ('MDL', 'USD', 0.056, NOW()),
  ('MDL', 'EUR', 0.052, NOW())
ON CONFLICT ("fromCurrency", "toCurrency") DO UPDATE SET rate = EXCLUDED.rate, "updatedAt" = NOW();
```

- [ ] **Step 4: Start services and verify**

```bash
scripts/deploy.sh up
scripts/deploy.sh health
```

- [ ] **Step 5: Verify in admin**

- Exchange Rates page shows all 6 rate pairs
- Space form has currency selector and pricing tiers editor
- Creating a space with MDL currency works
- Existing USD spaces still display correctly

---

## Summary

| Task | What | Complexity |
|------|------|-----------|
| 1 | Schema: Currency enum, ExchangeRate, PricingTier models | Low |
| 2 | Seed exchange rates | Low |
| 3 | TypeScript types for currency/tiers | Low |
| 4 | Server-side currency conversion library | Medium |
| 5 | Exchange rate admin API | Low |
| 6 | Space API: tiers CRUD, currency filter | Medium |
| 7 | Booking: tier-based pricing, currency tracking | Medium |
| 8 | Client currency formatting utilities | Low |
| 9 | Admin: exchange rate management page | Medium |
| 10 | Admin: currency selector + pricing tiers editor | Medium |
| 11 | Client: display in space currency, show tiers | Medium |
| 12 | Deploy | Low |
