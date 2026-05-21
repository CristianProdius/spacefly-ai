# Venue & Host Browsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Venues a real destination on the client app — a public Venue detail page that shows venue info (photos, video, address, working hours, host) with the venue's spaces below, plus a Browse Hosts directory and Host profile pages that link into venues. Today on `spacefly.ai`, clicking a space lands on `/spaces/[id]` but the Venue and Host behind it are dead-ends; this plan wires up the missing links.

**Architecture:**
- Backend: extend the existing `GET /venues/:id` in `product-service` to return host bio/`hostingSince` + new `workingHours` JSON field; add two new public endpoints `GET /hosts` (paginated directory) and `GET /hosts/:id` (host profile with their venues).
- Schema: one new column on `Venue.workingHours Json?` (per-weekday open/close). One Prisma migration.
- Admin: extend the existing venue form to edit working hours.
- Client (`apps/client`): three new server-rendered routes — `/venues/[id]`, `/hosts`, `/hosts/[id]` — plus making the venue label on `SpaceCard` clickable and adding a "Browse Hosts" link to the navbar.
- Reuse `SpaceCard`, `ImageGallery`, `YouTubeEmbed` from the existing space detail page so venue rendering looks consistent with browse.

**Tech Stack:** Next.js 15 App Router (server components, `next-intl` for i18n), Express + Prisma (PostgreSQL) for `product-service`, Vitest for backend tests, Tailwind.

---

## File Structure

**Created:**
- `apps/product-service/src/controllers/host.controller.ts` — `getHosts` and `getHost` controllers
- `apps/product-service/src/controllers/host.controller.test.ts` — controller tests
- `apps/product-service/src/routes/host.route.ts` — public host routes
- `apps/client/src/app/[locale]/(main)/venues/[id]/page.tsx` — Venue detail page
- `apps/client/src/app/[locale]/(main)/hosts/page.tsx` — Hosts directory
- `apps/client/src/app/[locale]/(main)/hosts/[id]/page.tsx` — Host profile
- `apps/client/src/components/VenueSpaceCard.tsx` — small card used in host profile to represent a venue
- `apps/client/src/components/WorkingHoursDisplay.tsx` — renders weekly hours from the JSON shape
- `apps/client/src/components/HostCard.tsx` — host directory card
- `packages/db/prisma/migrations/20260522120000_add_venue_working_hours/migration.sql`

**Modified:**
- `packages/db/prisma/schema.prisma` — add `workingHours Json?` to `Venue`
- `packages/types/src/venue.ts` — extend `Venue` and add new shapes used by venue/host detail
- `apps/product-service/src/controllers/venue.controller.ts` — accept `workingHours` on create/update; expand `getVenue` host fields
- `apps/product-service/src/index.ts` — mount `/hosts` router
- `apps/admin/src/components/venues/venue-form.shared.ts` — add `workingHours` to form values + payload
- `apps/admin/src/components/venues/venue-form.tsx` — add UI section for working hours
- `apps/client/src/components/SpaceCard.tsx` — make the venue label a separate link to `/venues/[id]`
- `apps/client/src/components/navbar/NavbarV4.tsx` — add "Browse Hosts" link
- `apps/client/src/components/navbar/MobileMenu.tsx` — add "Browse Hosts" link
- `apps/client/messages/en.json`, `ro.json`, `ru.json` — new strings under `venue.*` and `hosts.*`

---

## Working Hours Shape

For consistency across backend, admin form, and client renderer, use this exact JSON shape on `Venue.workingHours`:

```json
{
  "monday":    { "open": "09:00", "close": "18:00" },
  "tuesday":   { "open": "09:00", "close": "18:00" },
  "wednesday": { "open": "09:00", "close": "18:00" },
  "thursday":  { "open": "09:00", "close": "18:00" },
  "friday":    { "open": "09:00", "close": "18:00" },
  "saturday":  null,
  "sunday":    null
}
```

- Keys are lowercase English weekday names. Always present (all 7) when the object is non-null.
- A weekday value of `null` means closed.
- `open`/`close` are 24h `HH:MM` strings.
- `workingHours` itself may be `null` (not configured — page should hide the section).

---

## Task 1: Add `workingHours` to the Venue schema

**Files:**
- Modify: `packages/db/prisma/schema.prisma:114-150`
- Create: `packages/db/prisma/migrations/20260522120000_add_venue_working_hours/migration.sql`

- [ ] **Step 1: Add the column to the Prisma model**

In `packages/db/prisma/schema.prisma`, inside `model Venue { ... }`, add the field right after the `videoUrl` line (around line 123):

```prisma
  workingHours     Json?    // { monday: { open: "HH:MM", close: "HH:MM" } | null, ... }
```

- [ ] **Step 2: Create the migration SQL**

Create `packages/db/prisma/migrations/20260522120000_add_venue_working_hours/migration.sql` with:

```sql
ALTER TABLE "Venue" ADD COLUMN "workingHours" JSONB;
```

- [ ] **Step 3: Regenerate the Prisma client**

Run from repo root:

```bash
pnpm --filter @repo/db prisma generate
```

Expected: "Generated Prisma Client" output, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/20260522120000_add_venue_working_hours
git commit -m "feat(db): add workingHours JSON column to Venue"
```

---

## Task 2: Extend the shared Venue type

**Files:**
- Modify: `packages/types/src/venue.ts`

- [ ] **Step 1: Add `workingHours` to base `Venue` and expand host fields on `VenueWithHost`**

Replace the file contents with:

```ts
export interface WorkingHoursDay {
  open: string;
  close: string;
}

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WorkingHours = Record<WeekdayKey, WorkingHoursDay | null>;

export interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations?: Record<string, string> | null;
  shortDescTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  images: string[];
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  workingHours?: WorkingHours | null;
  currency?: string;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueHostSummary {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  hostingSince?: string | null;
}

export interface VenueWithHost extends Venue {
  host: VenueHostSummary;
}

export interface VenueSpaceSummary {
  id: number;
  name: string;
  spaceType: string;
  capacity: number;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricingType: string;
  currency?: string;
  images: string[];
  isActive: boolean;
  city: string;
  country: string;
  instantBook?: boolean;
}

export interface VenueWithSpaces extends Venue {
  spaces: VenueSpaceSummary[];
  _count?: { spaces: number };
}

export interface VenueDetail extends VenueWithHost {
  spaces: VenueSpaceSummary[];
}

export interface HostSummary {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  hostingSince: string | null;
  hostVerified: boolean;
  venueCount: number;
  spaceCount: number;
  cities: string[];
}

export interface HostDetail extends HostSummary {
  venues: VenueWithSpaces[];
}
```

- [ ] **Step 2: Verify types build**

Run:

```bash
pnpm --filter @repo/types build 2>&1 || pnpm --filter @repo/types tsc --noEmit
```

Expected: no TS errors. If `build` doesn't exist on the package, fall back to a `--noEmit` check from the repo root: `pnpm tsc -p packages/types/tsconfig.json --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/venue.ts
git commit -m "feat(types): add workingHours and host/venue detail types"
```

---

## Task 3: Accept and return `workingHours` on create/update venue

**Files:**
- Modify: `apps/product-service/src/controllers/venue.controller.ts`
- Modify: `apps/product-service/src/controllers/venue.controller.test.ts`

- [ ] **Step 1: Write a failing test for createVenue persisting workingHours**

Append to `apps/product-service/src/controllers/venue.controller.test.ts` inside the existing `describe("venue controller contract", ...)` block, after the existing tests:

```ts
  it("persists workingHours when creating venues", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 42 });
    const workingHours = {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: null,
      sunday: null,
    };
    const req = {
      body: {
        address: "Main 1",
        city: "Chisinau",
        country: "Moldova",
        name: "Venue",
        workingHours,
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ workingHours }),
    });
  });

  it("applies workingHours on update when provided", async () => {
    mocks.venueFindUnique.mockResolvedValueOnce({ id: 7, hostId: "host-1" });
    mocks.venueFindUnique.mockResolvedValueOnce({ id: 7 });
    mocks.venueUpdate.mockResolvedValue({ id: 7 });
    const workingHours = {
      monday: { open: "10:00", close: "20:00" },
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    };
    const req = {
      params: { id: "7" },
      body: { workingHours },
      userId: "host-1",
      user: { role: "HOST" },
    } as unknown as Request;
    const res = createResponse();

    await updateVenue(req, res);

    expect(mocks.venueUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({ workingHours }),
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter product-service test -- src/controllers/venue.controller.test.ts
```

Expected: the two new tests fail with messages like "expected venueCreate to be called with object containing workingHours" — the controller currently does not pass `workingHours` through.

- [ ] **Step 3: Implement workingHours in createVenue and updateVenue**

In `apps/product-service/src/controllers/venue.controller.ts`:

In `createVenue`, add `workingHours` to the destructured body (after `currency`):

```ts
const {
  name,
  shortDescription,
  description,
  nameTranslations,
  shortDescTranslations,
  descriptionTranslations,
  images,
  videoUrl,
  address,
  city,
  state,
  country,
  postalCode,
  latitude,
  longitude,
  currency,
  workingHours,
} = req.body;
```

And inside the `prisma.venue.create({ data: { ... } })` call, add this line right before `hostId,`:

```ts
      workingHours: workingHours ?? undefined,
```

In `updateVenue`, add `workingHours` to the destructured body (after `isActive`):

```ts
const {
  name,
  // ...existing fields...
  currency,
  isActive,
  workingHours,
} = req.body;
```

And add to the `venueData` object construction (after the `isActive` spread):

```ts
    ...(workingHours !== undefined && { workingHours }),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --filter product-service test -- src/controllers/venue.controller.test.ts
```

Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
git add apps/product-service/src/controllers/venue.controller.ts apps/product-service/src/controllers/venue.controller.test.ts
git commit -m "feat(product-service): persist venue workingHours on create/update"
```

---

## Task 4: Expand `getVenue` to include host bio, hostingSince, and workingHours

**Files:**
- Modify: `apps/product-service/src/controllers/venue.controller.ts:16-44`

- [ ] **Step 1: Expand host include in getVenue**

In `apps/product-service/src/controllers/venue.controller.ts`, modify the `getVenue` function so the Prisma query selects the wider host fields and venue space cards have enough data for the client:

```ts
export const getVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string, 10);
  if (Number.isNaN(venueId)) return res.status(400).json({ message: "Invalid ID" });
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          hostingSince: true,
          hostVerified: true,
        },
      },
      spaces: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          spaceType: true,
          capacity: true,
          pricePerHour: true,
          pricePerDay: true,
          pricingType: true,
          currency: true,
          images: true,
          isActive: true,
          city: true,
          country: true,
          instantBook: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!venue) return res.status(404).json({ message: "Venue not found" });

  const lang = req.query.lang as string | undefined;
  res.status(200).json(resolveTranslations(venue, lang, VENUE_TRANSLATION_FIELDS));
};
```

- [ ] **Step 2: Verify the product-service builds**

Run:

```bash
pnpm --filter product-service build
```

Expected: build succeeds.

- [ ] **Step 3: Manually exercise the endpoint**

The user runs the dev stack on the standard ports (per AGENTS.md). Hit the existing venue endpoint with curl using an existing venue id (look up one via `pnpm --filter @repo/db prisma studio` if needed, or use id `1` if the dev DB is seeded):

```bash
curl -s http://localhost:8000/venues/1 | head -80
```

Expected: JSON includes `host.bio`, `host.hostingSince`, `host.hostVerified`, and `workingHours` (may be `null`). Spaces include `currency`, `city`, `country`, `instantBook`. If the service is not running, skip this step and rely on Task 5 type checks.

- [ ] **Step 4: Commit**

```bash
git add apps/product-service/src/controllers/venue.controller.ts
git commit -m "feat(product-service): include host bio/since and richer space cards on venue detail"
```

---

## Task 5: Add host controller (list + detail)

**Files:**
- Create: `apps/product-service/src/controllers/host.controller.ts`
- Create: `apps/product-service/src/controllers/host.controller.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/product-service/src/controllers/host.controller.test.ts`:

```ts
import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getHost, getHosts } from "./host.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return {
    prisma,
    userFindMany: prisma.user.findMany,
    userCount: prisma.user.count,
    userFindUnique: prisma.user.findUnique,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

const createResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  res.status.mockReturnValue(res);
  return res;
};

describe("host controller", () => {
  afterEach(() => vi.resetAllMocks());

  it("lists only users that have at least one active venue", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "u1",
        name: "Alice",
        username: "alice",
        image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerified: true,
        venues: [
          { city: "Chisinau", _count: { spaces: 3 } },
          { city: "Chisinau", _count: { spaces: 0 } },
        ],
      },
    ]);
    mocks.userCount.mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          venues: { some: { isActive: true } },
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.hosts).toHaveLength(1);
    expect(payload.hosts[0]).toMatchObject({
      id: "u1",
      venueCount: 2,
      spaceCount: 3,
      cities: ["Chisinau"],
    });
    expect(payload.pagination).toMatchObject({ page: 1, total: 1 });
  });

  it("returns 404 when host not found or has no active venues", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    const req = { params: { id: "missing" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns host with venues and active space lists", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "u1",
      name: "Alice",
      username: "alice",
      image: null,
      bio: "Bio",
      hostingSince: new Date("2024-01-01"),
      hostVerified: true,
      venues: [
        {
          id: 1,
          name: "Hub",
          city: "Chisinau",
          country: "Moldova",
          images: ["/v.jpg"],
          isActive: true,
          spaces: [{ id: 10, name: "Room A", isActive: true }],
          _count: { spaces: 1 },
        },
      ],
    });
    const req = { params: { id: "u1" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(mocks.userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.id).toBe("u1");
    expect(payload.venues).toHaveLength(1);
    expect(payload.venues[0].spaces[0].id).toBe(10);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter product-service test -- src/controllers/host.controller.test.ts
```

Expected: tests fail because `./host.controller.js` does not yet exist.

- [ ] **Step 3: Implement the controller**

Create `apps/product-service/src/controllers/host.controller.ts`:

```ts
import { Request, Response } from "express";
import { prisma } from "@repo/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parsePagination = (query: Request["query"]) => {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const requestedLimit = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

interface HostVenueRow {
  city: string;
  _count: { spaces: number };
}

interface HostRow {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  hostingSince: Date | null;
  hostVerified: boolean;
  venues: HostVenueRow[];
}

const toHostSummary = (host: HostRow) => {
  const cities = Array.from(
    new Set(host.venues.map((venue) => venue.city).filter(Boolean))
  );
  const venueCount = host.venues.length;
  const spaceCount = host.venues.reduce(
    (sum, venue) => sum + (venue._count?.spaces ?? 0),
    0
  );
  return {
    id: host.id,
    name: host.name,
    username: host.username,
    image: host.image,
    bio: host.bio,
    hostingSince: host.hostingSince ? host.hostingSince.toISOString() : null,
    hostVerified: host.hostVerified,
    venueCount,
    spaceCount,
    cities,
  };
};

export const getHosts = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const city = typeof req.query.city === "string" ? req.query.city : undefined;

  const where = {
    venues: {
      some: {
        isActive: true,
        ...(city ? { city } : {}),
      },
    },
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ hostVerified: "desc" }, { hostingSince: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        hostingSince: true,
        hostVerified: true,
        venues: {
          where: { isActive: true },
          select: {
            city: true,
            _count: { select: { spaces: { where: { isActive: true } } } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    hosts: (rows as HostRow[]).map(toHostSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
};

export const getHost = async (req: Request, res: Response) => {
  const hostId = req.params.id;
  if (!hostId) return res.status(400).json({ message: "Invalid host id" });

  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      hostingSince: true,
      hostVerified: true,
      venues: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          city: true,
          country: true,
          images: true,
          isActive: true,
          spaces: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              spaceType: true,
              capacity: true,
              pricePerHour: true,
              pricePerDay: true,
              pricingType: true,
              currency: true,
              images: true,
              isActive: true,
              city: true,
              country: true,
              instantBook: true,
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { spaces: { where: { isActive: true } } } },
        },
      },
    },
  });

  if (!host || host.venues.length === 0) {
    return res.status(404).json({ message: "Host not found" });
  }

  const cities = Array.from(
    new Set(host.venues.map((v) => v.city).filter(Boolean))
  );
  const venueCount = host.venues.length;
  const spaceCount = host.venues.reduce(
    (sum, venue) => sum + (venue._count?.spaces ?? 0),
    0
  );

  res.status(200).json({
    id: host.id,
    name: host.name,
    username: host.username,
    image: host.image,
    bio: host.bio,
    hostingSince: host.hostingSince ? host.hostingSince.toISOString() : null,
    hostVerified: host.hostVerified,
    venueCount,
    spaceCount,
    cities,
    venues: host.venues,
  });
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --filter product-service test -- src/controllers/host.controller.test.ts
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/product-service/src/controllers/host.controller.ts apps/product-service/src/controllers/host.controller.test.ts
git commit -m "feat(product-service): add host directory and detail controllers"
```

---

## Task 6: Mount host route on the product-service

**Files:**
- Create: `apps/product-service/src/routes/host.route.ts`
- Modify: `apps/product-service/src/index.ts:7-10,47-53`

- [ ] **Step 1: Create the host router**

Create `apps/product-service/src/routes/host.route.ts`:

```ts
import { Router } from "express";
import { getHosts, getHost } from "../controllers/host.controller.js";

const router: Router = Router();

router.get("/", getHosts);
router.get("/:id", getHost);

export default router;
```

- [ ] **Step 2: Mount it in `index.ts`**

In `apps/product-service/src/index.ts`, add the import alongside the other route imports:

```ts
import hostRouter from "./routes/host.route.js";
```

And mount it next to the existing `app.use("/venues", venueRouter);` line:

```ts
app.use("/hosts", hostRouter);
```

- [ ] **Step 3: Verify the service builds**

Run:

```bash
pnpm --filter product-service build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/product-service/src/routes/host.route.ts apps/product-service/src/index.ts
git commit -m "feat(product-service): expose /hosts endpoints"
```

---

## Task 7: Add `workingHours` to the admin venue form (shared)

**Files:**
- Modify: `apps/admin/src/components/venues/venue-form.shared.ts`

- [ ] **Step 1: Update form values, payload, defaults, and mapping**

In `apps/admin/src/components/venues/venue-form.shared.ts`, add a weekday helper and extend the three exported shapes:

After the existing imports/constants and **before** `export interface VenueFormValues`, add:

```ts
export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface WorkingHoursDay {
  open: string;
  close: string;
}

export type WorkingHoursValue = Record<WeekdayKey, WorkingHoursDay | null>;

export const createEmptyWorkingHours = (): WorkingHoursValue => ({
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
});

export const sanitizeWorkingHours = (
  value: WorkingHoursValue
): WorkingHoursValue | null => {
  const hasAny = WEEKDAYS.some((day) => value[day] !== null);
  return hasAny ? value : null;
};
```

Add `workingHours` to `VenueFormValues`:

```ts
  workingHours: WorkingHoursValue;
```

Add `workingHours` to `VenueFormPayload`:

```ts
  workingHours: WorkingHoursValue | null;
```

Update `createEmptyVenueFormValues` so the returned object has `workingHours: createEmptyWorkingHours(),` after `currency: "USD",`.

Update `buildVenuePayload` so it returns `workingHours: sanitizeWorkingHours(formData.workingHours),` in addition to existing fields.

Add `workingHours?: WorkingHoursValue | null;` to `VenueResponse`.

Update `mapVenueToFormValues` so the returned object includes `workingHours: venue.workingHours ?? createEmptyWorkingHours(),`.

- [ ] **Step 2: Verify the admin app type-checks**

Run:

```bash
pnpm --filter admin tsc --noEmit
```

Expected: no errors. If errors point at `venue-form.tsx` not setting `workingHours`, that is expected and gets fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/components/venues/venue-form.shared.ts
git commit -m "feat(admin): add workingHours to venue form shared shapes"
```

---

## Task 8: Add working-hours UI to the admin venue form

**Files:**
- Modify: `apps/admin/src/components/venues/venue-form.tsx`

- [ ] **Step 1: Read the existing form**

Open `apps/admin/src/components/venues/venue-form.tsx` and locate the JSX block where currency or media is rendered. Plan to add a new collapsible section labeled "Working hours" near the end of the form, before the submit button.

- [ ] **Step 2: Add weekday rows**

Import the new helpers at the top:

```ts
import {
  WEEKDAYS,
  WeekdayKey,
  WorkingHoursDay,
} from "./venue-form.shared";
```

Add this section to the JSX, immediately before the submit button block:

```tsx
<section className="space-y-3">
  <div>
    <h3 className="text-base font-semibold text-foreground">Working hours</h3>
    <p className="text-sm text-muted-foreground">
      Set per-day open/close times. Leave a day closed to omit it from the public venue page.
    </p>
  </div>
  <div className="space-y-2">
    {WEEKDAYS.map((day) => {
      const value = formData.workingHours[day];
      const isOpen = value !== null;
      const setDay = (next: WorkingHoursDay | null) => {
        setFormData((prev) => ({
          ...prev,
          workingHours: { ...prev.workingHours, [day]: next },
        }));
      };
      return (
        <div key={day} className="grid grid-cols-[120px_80px_1fr_1fr] items-center gap-3">
          <span className="text-sm capitalize">{day}</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => {
                if (e.target.checked) {
                  setDay({ open: "09:00", close: "18:00" });
                } else {
                  setDay(null);
                }
              }}
            />
            Open
          </label>
          <input
            type="time"
            disabled={!isOpen}
            value={value?.open ?? ""}
            onChange={(e) =>
              setDay({ open: e.target.value, close: value?.close ?? "18:00" })
            }
            className={fieldClassName}
          />
          <input
            type="time"
            disabled={!isOpen}
            value={value?.close ?? ""}
            onChange={(e) =>
              setDay({ open: value?.open ?? "09:00", close: e.target.value })
            }
            className={fieldClassName}
          />
        </div>
      );
    })}
  </div>
</section>
```

Notes:
- This assumes the form already uses `formData` from a `useState<VenueFormValues>` pair (`formData`, `setFormData`) — match the local variable names in the file. If the form uses a different name (e.g. `values`, `setValues`), use those instead.
- The `fieldClassName` import already exists in this file; reuse it.

- [ ] **Step 3: Verify the admin app type-checks and builds**

Run:

```bash
pnpm --filter admin tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual smoke (optional)**

The user runs admin on port 5001. Open `http://localhost:5001/host/venues/new` and confirm the Working hours section renders, the checkbox toggles enable/disable, and the time inputs accept values. If admin is not running, skip and rely on the type check.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/venues/venue-form.tsx
git commit -m "feat(admin): edit venue working hours from the host form"
```

---

## Task 9: Working hours display component (client)

**Files:**
- Create: `apps/client/src/components/WorkingHoursDisplay.tsx`

- [ ] **Step 1: Create the component**

Create `apps/client/src/components/WorkingHoursDisplay.tsx`:

```tsx
import type { WorkingHours } from "@repo/types";
import { useTranslations } from "next-intl";

const ORDER: Array<keyof WorkingHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const WorkingHoursDisplay = ({ hours }: { hours: WorkingHours | null | undefined }) => {
  const t = useTranslations("venue.workingHours");
  if (!hours) return null;
  const allClosed = ORDER.every((d) => hours[d] === null);
  if (allClosed) return null;

  return (
    <dl className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
      {ORDER.map((day) => {
        const value = hours[day];
        return (
          <div key={day} className="contents">
            <dt className="text-muted capitalize">{t(`day.${day}`)}</dt>
            <dd className="text-foreground">
              {value ? `${value.open} – ${value.close}` : t("closed")}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};

export default WorkingHoursDisplay;
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/components/WorkingHoursDisplay.tsx
git commit -m "feat(client): WorkingHoursDisplay component"
```

---

## Task 10: Add i18n strings for venue & host pages

**Files:**
- Modify: `apps/client/messages/en.json`
- Modify: `apps/client/messages/ro.json`
- Modify: `apps/client/messages/ru.json`

- [ ] **Step 1: Add `common.browseHosts` to all three files**

In each file, inside the `"common"` object, add the line `"browseHosts": "<value>"` (after `"browseSpaces"`):

- `en.json`: `"browseHosts": "Browse Hosts"`
- `ro.json`: `"browseHosts": "Explorează gazde"`
- `ru.json`: `"browseHosts": "Все хосты"`

- [ ] **Step 2: Add a new top-level `"venue"` section**

Add this JSON object as a new top-level key in each file. Pick translations that fit the existing tone:

`en.json`:

```json
  "venue": {
    "metaTitle": "{name} — Spacefly.ai",
    "backToSpaces": "Back to spaces",
    "hostedBy": "Hosted by {name}",
    "viewHost": "View host",
    "hostingSince": "Hosting since {year}",
    "verified": "Verified host",
    "about": "About this venue",
    "address": "Address",
    "spaces": "Spaces at this venue",
    "noSpaces": "No spaces are currently available at this venue.",
    "detailLoadError": "We couldn't load this venue.",
    "retry": "Retry",
    "workingHours": {
      "title": "Working hours",
      "closed": "Closed",
      "day": {
        "monday": "Monday",
        "tuesday": "Tuesday",
        "wednesday": "Wednesday",
        "thursday": "Thursday",
        "friday": "Friday",
        "saturday": "Saturday",
        "sunday": "Sunday"
      }
    }
  }
```

`ro.json` (Romanian):

```json
  "venue": {
    "metaTitle": "{name} — Spacefly.ai",
    "backToSpaces": "Înapoi la spații",
    "hostedBy": "Gazdă: {name}",
    "viewHost": "Vezi gazda",
    "hostingSince": "Gazdă din {year}",
    "verified": "Gazdă verificată",
    "about": "Despre acest local",
    "address": "Adresă",
    "spaces": "Spații la acest local",
    "noSpaces": "Nu există spații disponibile la acest local.",
    "detailLoadError": "Nu am putut încărca localul.",
    "retry": "Încearcă din nou",
    "workingHours": {
      "title": "Orar de lucru",
      "closed": "Închis",
      "day": {
        "monday": "Luni",
        "tuesday": "Marți",
        "wednesday": "Miercuri",
        "thursday": "Joi",
        "friday": "Vineri",
        "saturday": "Sâmbătă",
        "sunday": "Duminică"
      }
    }
  }
```

`ru.json` (Russian):

```json
  "venue": {
    "metaTitle": "{name} — Spacefly.ai",
    "backToSpaces": "К списку пространств",
    "hostedBy": "Хост: {name}",
    "viewHost": "Профиль хоста",
    "hostingSince": "С {year} года",
    "verified": "Проверенный хост",
    "about": "О заведении",
    "address": "Адрес",
    "spaces": "Пространства в этом заведении",
    "noSpaces": "В этом заведении пока нет доступных пространств.",
    "detailLoadError": "Не удалось загрузить заведение.",
    "retry": "Повторить",
    "workingHours": {
      "title": "Часы работы",
      "closed": "Закрыто",
      "day": {
        "monday": "Понедельник",
        "tuesday": "Вторник",
        "wednesday": "Среда",
        "thursday": "Четверг",
        "friday": "Пятница",
        "saturday": "Суббота",
        "sunday": "Воскресенье"
      }
    }
  }
```

- [ ] **Step 3: Add a top-level `"hosts"` section**

`en.json`:

```json
  "hosts": {
    "title": "Hosts on Spacefly.ai",
    "description": "Discover the people and companies hosting on Spacefly.ai.",
    "card": {
      "venues": "{count, plural, one {# venue} other {# venues}}",
      "spaces": "{count, plural, one {# space} other {# spaces}}",
      "hostingSince": "Since {year}"
    },
    "profile": {
      "backToHosts": "Back to hosts",
      "venues": "Venues",
      "noVenues": "This host has no public venues yet.",
      "viewVenue": "View venue"
    },
    "empty": "No hosts to show yet.",
    "loadError": "We couldn't load hosts."
  }
```

`ro.json`:

```json
  "hosts": {
    "title": "Gazde pe Spacefly.ai",
    "description": "Descoperă oamenii și companiile care găzduiesc pe Spacefly.ai.",
    "card": {
      "venues": "{count, plural, one {# local} other {# locale}}",
      "spaces": "{count, plural, one {# spațiu} other {# spații}}",
      "hostingSince": "Din {year}"
    },
    "profile": {
      "backToHosts": "Înapoi la gazde",
      "venues": "Locale",
      "noVenues": "Această gazdă nu are localuri publice.",
      "viewVenue": "Vezi localul"
    },
    "empty": "Nu există gazde de afișat.",
    "loadError": "Nu am putut încărca gazdele."
  }
```

`ru.json`:

```json
  "hosts": {
    "title": "Хосты на Spacefly.ai",
    "description": "Знакомьтесь с людьми и компаниями, размещающими пространства.",
    "card": {
      "venues": "{count, plural, one {# заведение} few {# заведения} other {# заведений}}",
      "spaces": "{count, plural, one {# пространство} few {# пространства} other {# пространств}}",
      "hostingSince": "С {year}"
    },
    "profile": {
      "backToHosts": "К списку хостов",
      "venues": "Заведения",
      "noVenues": "У этого хоста пока нет публичных заведений.",
      "viewVenue": "Открыть заведение"
    },
    "empty": "Хостов пока нет.",
    "loadError": "Не удалось загрузить хостов."
  }
```

- [ ] **Step 4: Verify the messages parse**

Run from repo root:

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/client/messages/en.json','utf8')); console.log('en ok');"
node -e "JSON.parse(require('fs').readFileSync('apps/client/messages/ro.json','utf8')); console.log('ro ok');"
node -e "JSON.parse(require('fs').readFileSync('apps/client/messages/ru.json','utf8')); console.log('ru ok');"
```

Expected: prints `en ok`, `ro ok`, `ru ok`.

- [ ] **Step 5: Commit**

```bash
git add apps/client/messages/en.json apps/client/messages/ro.json apps/client/messages/ru.json
git commit -m "feat(client): i18n strings for venue and host pages"
```

---

## Task 11: Build the Venue detail page

**Files:**
- Create: `apps/client/src/app/[locale]/(main)/venues/[id]/page.tsx`

- [ ] **Step 1: Create the page**

Create the file:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { AlertCircle, MapPin, RefreshCw, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import { parseImages } from "@/lib/utils";
import ImageGallery from "@/components/ImageGallery";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SpaceCard from "@/components/SpaceCard";
import WorkingHoursDisplay from "@/components/WorkingHoursDisplay";
import type { Space } from "@repo/types";

interface VenueDetailResponse {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  images: string[] | string;
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  workingHours: Record<string, { open: string; close: string } | null> | null;
  host: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    hostingSince: string | null;
    hostVerified: boolean;
  };
  spaces: Array<Space & { city: string; country: string }>;
}

async function getVenue(
  id: string,
  locale?: string
): Promise<{ error: boolean; notFound: boolean; venue: VenueDetailResponse | null }> {
  try {
    const langParam = locale && locale !== "en" ? `?lang=${locale}` : "";
    const res = await fetch(`${PRODUCT_SERVICE_URL}/venues/${id}${langParam}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return { error: false, notFound: true, venue: null };
    if (!res.ok) return { error: true, notFound: false, venue: null };
    return { error: false, notFound: false, venue: await res.json() };
  } catch {
    return { error: true, notFound: false, venue: null };
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const result = await getVenue(id, locale);

  if (result.notFound) notFound();

  const t = await getTranslations("venue");
  const tCommon = await getTranslations("common");

  if (result.error || !result.venue) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("detailLoadError")}</h1>
        <Link
          href={`/venues/${id}`}
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle"
        >
          <RefreshCw className="size-4" />
          {t("retry")}
        </Link>
      </div>
    );
  }

  const venue = result.venue;
  const images = parseImages(venue.images);
  const hostingYear = venue.host.hostingSince
    ? new Date(venue.host.hostingSince).getFullYear()
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          {venue.name}
        </h1>
        <p className="text-muted mt-2 flex items-center gap-1.5">
          <MapPin className="size-4" />
          {venue.address}, {venue.city}, {venue.country}
        </p>
      </div>

      {images.length > 0 && <ImageGallery images={images} title={venue.name} />}

      {venue.videoUrl && (
        <YouTubeEmbed url={venue.videoUrl} title={venue.name} />
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {venue.description && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t("about")}</h2>
              <p className="text-muted whitespace-pre-line text-pretty">{venue.description}</p>
            </section>
          )}

          {venue.workingHours && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t("workingHours.title")}
              </h2>
              <WorkingHoursDisplay hours={venue.workingHours as never} />
            </section>
          )}
        </div>

        <aside className="border border-border rounded-2xl p-5 h-fit space-y-3">
          <div className="flex items-center gap-3">
            {venue.host.image ? (
              <Image
                src={venue.host.image}
                alt={venue.host.name ?? venue.host.username}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-subtle flex items-center justify-center text-foreground font-semibold">
                {(venue.host.name ?? venue.host.username).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground line-clamp-1">
                {t("hostedBy", { name: venue.host.name ?? venue.host.username })}
              </p>
              {hostingYear && (
                <p className="text-xs text-muted">
                  {t("hostingSince", { year: hostingYear })}
                </p>
              )}
              {venue.host.hostVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-success mt-1">
                  <Check className="size-3.5" />
                  {t("verified")}
                </span>
              )}
            </div>
          </div>
          {venue.host.bio && (
            <p className="text-sm text-muted whitespace-pre-line">{venue.host.bio}</p>
          )}
          <Link
            href={`/hosts/${venue.host.id}`}
            className="inline-flex items-center justify-center w-full px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
          >
            {t("viewHost")}
          </Link>
        </aside>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t("spaces")}</h2>
        {venue.spaces.length === 0 ? (
          <p className="text-muted">{t("noSpaces")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venue.spaces.map((space) => (
              <SpaceCard key={space.id} space={space as Space} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify the client app type-checks**

Run:

```bash
pnpm --filter client tsc --noEmit
```

Expected: no errors. If a type complaint comes from `WorkingHoursDisplay`'s `hours` prop typing, that's why we cast `as never` — the JSON shape is identical to the typed shape; the cast bridges any nominal mismatch from the response type.

- [ ] **Step 3: Manual smoke**

The client runs on port 5002. Visit `http://localhost:5002/en/venues/<existing-venue-id>`. Confirm:
- Title, address, photos, video render
- Description and working hours render (if set)
- Host card on the right shows name, "since YYYY", and "View host" button linking to `/hosts/<host-id>`
- Spaces grid at the bottom uses the same card as Browse Spaces

If the dev stack is not running, skip the manual smoke — Task 17 covers the end-to-end check.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/app/[locale]/\(main\)/venues
git commit -m "feat(client): Venue detail page with host card and spaces grid"
```

---

## Task 12: Link the venue label on `SpaceCard` to `/venues/[id]`

**Files:**
- Modify: `apps/client/src/components/SpaceCard.tsx`

- [ ] **Step 1: Restructure the card so the venue label is a separate link**

Replace the JSX returned from the component with a structure that does not nest links:

```tsx
return (
  <div className="group">
    {/* IMAGE — links to the space */}
    <Link href={`/spaces/${space.id}`} className="block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        <Image
          src={images[0] || "/placeholder-space.jpg"}
          alt={space.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {space.instantBook && (
          <span className="absolute top-3 left-3 bg-success/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {tc("instantBook")}
          </span>
        )}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full border border-border/50">
          {categoryLabel || t(`spaceTypes.${space.spaceType}`) || space.spaceType}
        </span>
      </div>
    </Link>

    {/* DETAILS */}
    <div className="pt-3 flex flex-col gap-0.5">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/spaces/${space.id}`} className="min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1 hover:underline">
            {space.name}
          </h3>
        </Link>
        {space.averageRating !== undefined && space.averageRating > 0 && (
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
            <span className="font-medium">{space.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {"venue" in space && space.venue && space.venue.name !== space.name && (
        <Link
          href={`/venues/${space.venue.id}`}
          className="text-xs text-muted line-clamp-1 hover:underline"
        >
          {t("atVenue", { venue: space.venue.name })}
        </Link>
      )}

      <p className="text-sm text-muted line-clamp-1">
        {space.city}, {space.country}
      </p>

      <p className="text-sm font-semibold text-foreground mt-1">
        {getPriceDisplay(space, priceLabels)}
      </p>
    </div>
  </div>
);
```

- [ ] **Step 2: Verify the client app type-checks and builds**

Run:

```bash
pnpm --filter client tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual smoke**

Visit `http://localhost:5002/en/spaces` and confirm:
- Clicking the photo or the title still opens the space.
- Clicking the small "at Venue X" label opens `/venues/<id>`.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/components/SpaceCard.tsx
git commit -m "feat(client): link venue label on SpaceCard to venue page"
```

---

## Task 13: Host directory page (`/hosts`)

**Files:**
- Create: `apps/client/src/components/HostCard.tsx`
- Create: `apps/client/src/app/[locale]/(main)/hosts/page.tsx`

- [ ] **Step 1: Create the host card component**

Create `apps/client/src/components/HostCard.tsx`:

```tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HostSummary } from "@repo/types";

const HostCard = ({ host }: { host: HostSummary }) => {
  const t = useTranslations("hosts.card");
  const displayName = host.name ?? host.username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const hostingYear = host.hostingSince ? new Date(host.hostingSince).getFullYear() : null;

  return (
    <Link
      href={`/hosts/${host.id}`}
      className="group border border-border rounded-2xl p-5 hover:border-foreground/40 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        {host.image ? (
          <Image
            src={host.image}
            alt={displayName}
            width={56}
            height={56}
            className="rounded-full object-cover size-14"
          />
        ) : (
          <div className="size-14 rounded-full bg-subtle flex items-center justify-center text-foreground font-semibold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground line-clamp-1">{displayName}</p>
          {hostingYear && (
            <p className="text-xs text-muted">{t("hostingSince", { year: hostingYear })}</p>
          )}
          {host.hostVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-success mt-0.5">
              <Check className="size-3.5" /> Verified
            </span>
          )}
        </div>
      </div>
      {host.bio && <p className="text-sm text-muted line-clamp-3">{host.bio}</p>}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">
          {t("venues", { count: host.venueCount })} · {t("spaces", { count: host.spaceCount })}
        </span>
        {host.cities.length > 0 && (
          <span className="text-muted line-clamp-1 inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {host.cities.slice(0, 2).join(", ")}
          </span>
        )}
      </div>
    </Link>
  );
};

export default HostCard;
```

- [ ] **Step 2: Create the hosts directory page**

Create `apps/client/src/app/[locale]/(main)/hosts/page.tsx`:

```tsx
import { AlertCircle, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import HostCard from "@/components/HostCard";
import type { HostSummary } from "@repo/types";

interface HostsResponse {
  hosts: HostSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

async function getHosts(): Promise<{ error: boolean; data: HostsResponse | null }> {
  try {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/hosts?limit=24`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { error: true, data: null };
    return { error: false, data: await res.json() };
  } catch {
    return { error: true, data: null };
  }
}

export default async function HostsPage() {
  const t = await getTranslations("hosts");
  const result = await getHosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground text-balance">{t("title")}</h1>
        <p className="text-muted mt-2 text-pretty">{t("description")}</p>
      </div>

      {result.error || !result.data ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-foreground text-lg font-medium">{t("loadError")}</p>
          <Link
            href="/hosts"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
          >
            <RefreshCw className="size-4" /> Retry
          </Link>
        </div>
      ) : result.data.hosts.length === 0 ? (
        <p className="text-muted py-12 text-center">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {result.data.hosts.map((host) => (
            <HostCard key={host.id} host={host} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check the client**

Run:

```bash
pnpm --filter client tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual smoke**

Visit `http://localhost:5002/en/hosts`. Confirm a grid of host cards renders, each linking to `/hosts/<id>`.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/components/HostCard.tsx apps/client/src/app/[locale]/\(main\)/hosts/page.tsx
git commit -m "feat(client): browse hosts directory page"
```

---

## Task 14: Host profile page (`/hosts/[id]`)

**Files:**
- Create: `apps/client/src/components/VenueSpaceCard.tsx`
- Create: `apps/client/src/app/[locale]/(main)/hosts/[id]/page.tsx`

- [ ] **Step 1: Create the venue card used on the host page**

Create `apps/client/src/components/VenueSpaceCard.tsx`:

```tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseImages } from "@/lib/utils";

interface VenueCardData {
  id: number;
  name: string;
  shortDescription?: string;
  city: string;
  country: string;
  images: string[] | string;
  spaceCount: number;
}

const VenueSpaceCard = ({ venue }: { venue: VenueCardData }) => {
  const images = parseImages(venue.images);
  const t = useTranslations("hosts.card");
  const tProfile = useTranslations("hosts.profile");
  return (
    <Link href={`/venues/${venue.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        <Image
          src={images[0] || "/placeholder-space.jpg"}
          alt={venue.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="pt-3 flex flex-col gap-0.5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:underline">
          {venue.name}
        </h3>
        <p className="text-sm text-muted line-clamp-1 inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {venue.city}, {venue.country}
        </p>
        <p className="text-sm text-foreground mt-1">
          {t("spaces", { count: venue.spaceCount })}
        </p>
        <span className="text-xs text-muted mt-1 group-hover:underline">
          {tProfile("viewVenue")} →
        </span>
      </div>
    </Link>
  );
};

export default VenueSpaceCard;
```

- [ ] **Step 2: Create the host profile page**

Create `apps/client/src/app/[locale]/(main)/hosts/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { Check, RefreshCw, AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import VenueSpaceCard from "@/components/VenueSpaceCard";

interface HostVenue {
  id: number;
  name: string;
  shortDescription: string;
  city: string;
  country: string;
  images: string[] | string;
  _count?: { spaces: number };
}

interface HostDetailResponse {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  hostingSince: string | null;
  hostVerified: boolean;
  venueCount: number;
  spaceCount: number;
  cities: string[];
  venues: HostVenue[];
}

async function getHost(
  id: string
): Promise<{ notFound: boolean; error: boolean; host: HostDetailResponse | null }> {
  try {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/hosts/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return { notFound: true, error: false, host: null };
    if (!res.ok) return { notFound: false, error: true, host: null };
    return { notFound: false, error: false, host: await res.json() };
  } catch {
    return { notFound: false, error: true, host: null };
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function HostProfilePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getHost(id);
  if (result.notFound) notFound();

  const t = await getTranslations("hosts");
  const tCard = await getTranslations("hosts.card");
  const tVenue = await getTranslations("venue");

  if (result.error || !result.host) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">{t("loadError")}</h1>
        <Link
          href={`/hosts/${id}`}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle"
        >
          <RefreshCw className="size-4" /> {tVenue("retry")}
        </Link>
      </div>
    );
  }

  const host = result.host;
  const displayName = host.name ?? host.username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const hostingYear = host.hostingSince ? new Date(host.hostingSince).getFullYear() : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center gap-5 border border-border rounded-2xl p-6">
        {host.image ? (
          <Image
            src={host.image}
            alt={displayName}
            width={96}
            height={96}
            className="rounded-full object-cover size-24"
          />
        ) : (
          <div className="size-24 rounded-full bg-subtle flex items-center justify-center text-3xl font-semibold text-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
          <div className="text-muted text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {hostingYear && <span>{tCard("hostingSince", { year: hostingYear })}</span>}
            <span>
              {tCard("venues", { count: host.venueCount })} ·{" "}
              {tCard("spaces", { count: host.spaceCount })}
            </span>
            {host.hostVerified && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="size-3.5" /> {tVenue("verified")}
              </span>
            )}
          </div>
          {host.bio && (
            <p className="text-muted mt-3 whitespace-pre-line text-pretty">{host.bio}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t("profile.venues")}</h2>
        {host.venues.length === 0 ? (
          <p className="text-muted">{t("profile.noVenues")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {host.venues.map((venue) => (
              <VenueSpaceCard
                key={venue.id}
                venue={{
                  id: venue.id,
                  name: venue.name,
                  shortDescription: venue.shortDescription,
                  city: venue.city,
                  country: venue.country,
                  images: venue.images,
                  spaceCount: venue._count?.spaces ?? 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Type-check the client**

Run:

```bash
pnpm --filter client tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual smoke**

Visit `http://localhost:5002/en/hosts/<existing-host-id>` (use an id from the directory). Confirm the header, bio, venue cards render, and clicking a venue card opens `/venues/<id>`.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/components/VenueSpaceCard.tsx apps/client/src/app/[locale]/\(main\)/hosts/\[id\]/page.tsx
git commit -m "feat(client): host profile page with venue grid"
```

---

## Task 15: Navbar — add "Browse Hosts"

**Files:**
- Modify: `apps/client/src/components/navbar/NavbarV4.tsx`
- Modify: `apps/client/src/components/navbar/MobileMenu.tsx`

- [ ] **Step 1: Add the link in `NavbarV4.tsx`**

Right after the existing `<Link href="/spaces" ...>{t("browseSpaces")}</Link>` block, add:

```tsx
<Link
  href="/hosts"
  className={cn(
    "text-sm font-semibold transition-colors",
    pathname === "/hosts" ? "text-primary" : "text-foreground hover:text-primary"
  )}
>
  {t("browseHosts")}
</Link>
```

- [ ] **Step 2: Add the link in `MobileMenu.tsx`**

Locate the existing `t("browseSpaces")` link (around line 54). Add an analogous mobile menu entry directly after it pointing at `/hosts` with text `t("browseHosts")`. Match the existing classNames and onClick handler used by the mobile menu's other links.

- [ ] **Step 3: Type-check the client**

Run:

```bash
pnpm --filter client tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/components/navbar/NavbarV4.tsx apps/client/src/components/navbar/MobileMenu.tsx
git commit -m "feat(client): add Browse Hosts to navbar (desktop and mobile)"
```

---

## Task 16: End-to-end smoke and integration check

**Files:** (no code changes — verification only)

- [ ] **Step 1: Run the migration locally**

The dev DB is reachable via `DATABASE_URL` in `.env`. Run:

```bash
pnpm --filter @repo/db prisma migrate deploy
```

Expected: "All migrations have been successfully applied" (or "No pending migrations" if already applied).

- [ ] **Step 2: Restart the product-service if the user has it running**

Per AGENTS.md, the user runs dev processes manually. If the service is not picking up code changes, report that the service needs a restart instead of starting it.

- [ ] **Step 3: Hit the new endpoints**

```bash
curl -s "http://localhost:8000/hosts?limit=5" | head -40
curl -s "http://localhost:8000/hosts/<host-id>" | head -60
curl -s "http://localhost:8000/venues/<venue-id>" | head -60
```

Expected:
- `/hosts` returns `{ hosts: [...], pagination: {...} }` with the new summary fields.
- `/hosts/:id` returns the host with `venues[]` each containing `spaces[]`.
- `/venues/:id` returns `workingHours` (may be null) and richer `host` and `spaces` fields.

If any host is unset, accept that and verify the empty state from a known-good seed.

- [ ] **Step 4: Verify the UI flow**

On `http://localhost:5002/en/`:
1. Browse Hosts is present in the top nav. Click it → `/hosts`.
2. Click a host card → `/hosts/[id]` with venues grid.
3. Click a venue card → `/venues/[id]` with photos, working hours (if set), host card, and spaces grid.
4. From any space card on `/spaces` or homepage, the small venue label is clickable and goes to `/venues/[id]`.
5. The "View host" button on a venue page goes to the host profile.

- [ ] **Step 5: Final commit if anything tweaked**

If the smoke pass surfaces a minor fix, commit it. Otherwise nothing to do — close out.

---

## Self-review notes

- All spec items covered: venue info (photos, video, address, working hours, host) on `/venues/[id]`; spaces grid below the venue info using the same card as Browse Spaces; clickable venue label on Space cards; Browse Hosts and host profile pages.
- The host directory endpoint orders verified hosts first; admin can promote hosts to verified outside this plan (the field already exists).
- Working hours are optional and gracefully hidden when null.
- Tests cover the new backend behavior (controller-level). Frontend pages are server-rendered and rely on type checks + manual smoke; no new test framework introduced.
- If the existing venue form file uses different state variable names than `formData`/`setFormData`, Task 8 step 2 calls that out — match what's there rather than rewriting the form.
