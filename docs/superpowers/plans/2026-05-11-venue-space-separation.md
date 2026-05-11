# Phase 2: Venue/Space Entity Separation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a `Venue` entity (Business Center, Hotel, Coworking Hub) that groups multiple `Space` listings so hosts don't re-enter address, map location, building photos, and general description for every room.

**Architecture:** Add a `Venue` model to Prisma that owns the location/building-level data currently duplicated on `Space`. Each `Space` gets a `venueId` foreign key. A data migration creates one Venue per existing Space (1:1 initially). The API includes venue data in all space responses so existing client code needs minimal changes — `space.venue.city` instead of `space.city`. Admin gets a Venue management flow; hosts create a Venue first, then add Spaces under it.

**Tech Stack:** Prisma (PostgreSQL), Express (product-service), Next.js (client + admin), TypeScript, Zustand, next-intl, Tailwind CSS

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `packages/db/prisma/migrations/[timestamp]_add_venue_model/migration.sql` | Schema migration |
| `scripts/migrate-spaces-to-venues.ts` | One-time data migration script |
| `packages/types/src/venue.ts` | Venue TypeScript interfaces |
| `apps/product-service/src/controllers/venue.controller.ts` | Venue CRUD controller |
| `apps/product-service/src/routes/venue.route.ts` | Venue API routes |
| `apps/admin/src/app/(dashboard)/host/venues/page.tsx` | Host venue list page |
| `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx` | Create venue page |
| `apps/admin/src/app/(dashboard)/host/venues/[id]/edit/page.tsx` | Edit venue page |
| `apps/admin/src/components/venues/venue-form.tsx` | Venue form component |
| `apps/admin/src/components/venues/venue-form.shared.ts` | Venue form types/helpers |

### Modified Files
| File | What Changes |
|------|-------------|
| `packages/db/prisma/schema.prisma` | Add Venue model, add venueId to Space, move location fields |
| `packages/types/src/space.ts` | Remove location fields from Space, add venue relation, re-export Venue |
| `apps/product-service/src/controllers/space.controller.ts` | Include venue in queries, accept venueId on create, flatten venue fields for backward compat |
| `apps/product-service/src/routes/space.route.ts` | Mount venue routes |
| `apps/product-service/src/index.ts` | Register venue routes |
| `apps/admin/src/components/spaces/space-form.shared.ts` | Remove location fields, add venueId |
| `apps/admin/src/components/spaces/space-form.tsx` | Replace location section with venue selector |
| `apps/admin/src/components/AppSidebar.tsx` | Add "Venues" nav item |
| `apps/admin/src/app/(dashboard)/host/spaces/page.tsx` | Show venue name per space |
| `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx` | Read location from venue |
| `apps/client/src/components/SpaceCard.tsx` | Read city/country from venue |
| `apps/client/src/components/SpaceList.tsx` | Update SpaceWithCategory type |
| `apps/client/messages/en.json`, `ro.json`, `ru.json` | Add venue i18n keys |

---

## Task 1: Schema Migration — Add Venue Model

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/[timestamp]_add_venue_model/migration.sql` (auto-generated)

### Step-by-step:

- [ ] **Step 1: Add Venue model to schema.prisma**

Add this model BEFORE the Space model (after the Session model section):

```prisma
// ==================== VENUES ====================

model Venue {
  id               Int      @id @default(autoincrement())
  name             String
  shortDescription String   @default("")
  description      String   @default("")
  images           Json     @default("[]") // Array of venue/building image URLs

  // Location
  address    String
  city       String
  state      String?
  country    String
  postalCode String?
  latitude   Float?
  longitude  Float?

  // Owner
  hostId String
  host   User   @relation(fields: [hostId], references: [id])

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  spaces Space[]

  @@index([hostId])
  @@index([city])
  @@index([isActive])
}
```

- [ ] **Step 2: Add venueId to Space model and Venue relation to User**

In the `Space` model, add after the `hostId`/`host` relation:

```prisma
  venueId      Int?
  venue        Venue?         @relation(fields: [venueId], references: [id])
```

Add index:
```prisma
  @@index([venueId])
```

In the `User` model, add to the relations section:
```prisma
  venues           Venue[]          // Venues owned by this host
```

**Important:** `venueId` is `Int?` (nullable) for now. It becomes required AFTER the data migration in Task 2. Do NOT remove any existing location fields from Space yet — they stay for backward compatibility during migration.

- [ ] **Step 3: Generate and run migration**

```bash
cd packages/db
pnpm prisma migrate dev --name add_venue_model
```

This creates the migration SQL and applies it locally.

- [ ] **Step 4: Regenerate Prisma client**

```bash
pnpm prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations/ packages/db/generated/
git commit -m "feat(db): add Venue model with optional venueId on Space"
```

---

## Task 2: Data Migration — Create Venues from Existing Spaces

**Files:**
- Create: `scripts/migrate-spaces-to-venues.ts`
- Modify: `packages/db/prisma/schema.prisma` (make venueId required after migration)

### Step-by-step:

- [ ] **Step 1: Create migration script**

Create `scripts/migrate-spaces-to-venues.ts`:

```typescript
/**
 * One-time data migration: creates a Venue for each existing Space,
 * copying location/description fields, then links the Space to its Venue.
 *
 * Run with: pnpm tsx scripts/migrate-spaces-to-venues.ts
 */
import { PrismaClient } from "../packages/db/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const spaces = await prisma.space.findMany({
    where: { venueId: null },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      images: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      hostId: true,
    },
  });

  console.log(`Found ${spaces.length} spaces without a venue`);

  for (const space of spaces) {
    const venue = await prisma.venue.create({
      data: {
        name: space.name,
        shortDescription: space.shortDescription,
        description: space.description,
        images: space.images,
        address: space.address,
        city: space.city,
        state: space.state,
        country: space.country,
        postalCode: space.postalCode,
        latitude: space.latitude,
        longitude: space.longitude,
        hostId: space.hostId,
      },
    });

    await prisma.space.update({
      where: { id: space.id },
      data: { venueId: venue.id },
    });

    console.log(`Created venue "${venue.name}" (id=${venue.id}) for space id=${space.id}`);
  }

  // Verify no spaces are left without a venue
  const orphans = await prisma.space.count({ where: { venueId: null } });
  if (orphans > 0) {
    console.error(`ERROR: ${orphans} spaces still have no venue!`);
    process.exit(1);
  }

  console.log("Migration complete. All spaces linked to venues.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the migration script locally**

```bash
pnpm tsx scripts/migrate-spaces-to-venues.ts
```

Expected: one venue created per existing space, all spaces linked.

- [ ] **Step 3: Make venueId required in schema**

In `packages/db/prisma/schema.prisma`, change Space's venueId from optional to required:

```prisma
  venueId      Int
  venue        Venue          @relation(fields: [venueId], references: [id])
```

- [ ] **Step 4: Generate migration for required venueId**

```bash
cd packages/db
pnpm prisma migrate dev --name make_venue_id_required
```

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-spaces-to-venues.ts packages/db/prisma/ packages/db/generated/
git commit -m "feat(db): data migration to create venues from existing spaces, make venueId required"
```

---

## Task 3: TypeScript Types — Add Venue Interface

**Files:**
- Create: `packages/types/src/venue.ts`
- Modify: `packages/types/src/space.ts`

### Step-by-step:

- [ ] **Step 1: Create venue types**

Create `packages/types/src/venue.ts`:

```typescript
export interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueWithHost extends Venue {
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface VenueWithSpaces extends Venue {
  spaces: Array<{
    id: number;
    name: string;
    spaceType: string;
    capacity: number;
    isActive: boolean;
  }>;
  _count?: { spaces: number };
}
```

- [ ] **Step 2: Export venue types from package index**

In `packages/types/src/space.ts`, add at the top:

```typescript
export type { Venue, VenueWithHost, VenueWithSpaces } from "./venue";
```

- [ ] **Step 3: Add venue relation to Space interface**

In `packages/types/src/space.ts`, update the `Space` interface. Add after `categorySlug`:

```typescript
  venueId: number;
  venue?: Venue;
```

Import `Venue` at the top if needed (already re-exported).

Also add to `SpaceWithHost`:

```typescript
export interface SpaceWithHost extends Space {
  host: {
    id: string;
    name: string | null;
    image: string | null;
    hostingSince: string | null;
  };
  venue?: Venue;
}
```

**Note:** Keep ALL existing location fields on the `Space` interface for now (`address`, `city`, `state`, `country`, etc.). They will be populated from venue data by the API's backward-compatibility layer (Task 4). This means zero client-side changes are needed initially — all existing code still works.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/venue.ts packages/types/src/space.ts
git commit -m "feat(types): add Venue interface, add venue relation to Space"
```

---

## Task 4: Product Service — Venue CRUD API

**Files:**
- Create: `apps/product-service/src/controllers/venue.controller.ts`
- Create: `apps/product-service/src/routes/venue.route.ts`
- Modify: `apps/product-service/src/index.ts`

### Step-by-step:

- [ ] **Step 1: Create venue controller**

Create `apps/product-service/src/controllers/venue.controller.ts`:

```typescript
import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";

// Get all venues for authenticated host
export const getMyVenues = async (req: Request, res: Response) => {
  const hostId = req.userId!;

  const venues = await prisma.venue.findMany({
    where: { hostId },
    include: {
      _count: { select: { spaces: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(venues);
};

// Get single venue by ID
export const getVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id);

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      host: {
        select: { id: true, name: true, image: true },
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
          images: true,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!venue) {
    return res.status(404).json({ message: "Venue not found" });
  }

  res.status(200).json(venue);
};

// Create venue
export const createVenue = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const {
    name,
    shortDescription,
    description,
    images,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
  } = req.body;

  if (!name || !address || !city || !country) {
    return res.status(400).json({ message: "Name, address, city, and country are required" });
  }

  const venue = await prisma.venue.create({
    data: {
      name,
      shortDescription: shortDescription || "",
      description: description || "",
      images: images || [],
      address,
      city,
      state: state || null,
      country,
      postalCode: postalCode || null,
      latitude: latitude || null,
      longitude: longitude || null,
      hostId,
    },
  });

  producer.send("venue.created", { value: { id: venue.id, hostId } });

  res.status(201).json(venue);
};

// Update venue
export const updateVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) {
    return res.status(404).json({ message: "Venue not found" });
  }

  if (existing.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to update this venue" });
  }

  const {
    name,
    shortDescription,
    description,
    images,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    isActive,
  } = req.body;

  const venue = await prisma.venue.update({
    where: { id: venueId },
    data: {
      ...(name !== undefined && { name }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(postalCode !== undefined && { postalCode }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  producer.send("venue.updated", { value: { id: venue.id } });

  res.status(200).json(venue);
};

// Delete venue (soft delete)
export const deleteVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) {
    return res.status(404).json({ message: "Venue not found" });
  }

  if (existing.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to delete this venue" });
  }

  // Deactivate venue and all its spaces
  await prisma.$transaction([
    prisma.venue.update({ where: { id: venueId }, data: { isActive: false } }),
    prisma.space.updateMany({ where: { venueId }, data: { isActive: false } }),
  ]);

  producer.send("venue.deleted", { value: { id: venueId } });

  res.status(200).json({ message: "Venue deleted successfully" });
};
```

- [ ] **Step 2: Create venue routes**

Create `apps/product-service/src/routes/venue.route.ts`:

```typescript
import { Router } from "express";
import { shouldBeHost, shouldBeHostOrAdmin } from "@repo/auth-middleware/express";
import {
  getMyVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venue.controller.js";

const router: Router = Router();

// Host routes (authenticated)
router.get("/host/my", shouldBeHost, getMyVenues);
router.post("/", shouldBeHost, createVenue);

// Public + protected routes
router.get("/:id", getVenue);
router.put("/:id", shouldBeHostOrAdmin, updateVenue);
router.delete("/:id", shouldBeHostOrAdmin, deleteVenue);

export default router;
```

- [ ] **Step 3: Register venue routes in product-service**

In `apps/product-service/src/index.ts`, add:

```typescript
import venueRoutes from "./routes/venue.route.js";
```

And register the route (after the existing space routes):

```typescript
app.use("/venues", venueRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add apps/product-service/src/controllers/venue.controller.ts apps/product-service/src/routes/venue.route.ts apps/product-service/src/index.ts
git commit -m "feat(api): add Venue CRUD endpoints"
```

---

## Task 5: Product Service — Update Space Endpoints for Venue

**Files:**
- Modify: `apps/product-service/src/controllers/space.controller.ts`

This is the critical backward-compatibility task. Space API responses must include venue data AND continue to return flat location fields so existing client code works without changes.

### Step-by-step:

- [ ] **Step 1: Add venue include to all space queries**

In `space.controller.ts`, add a shared `venueInclude` constant at the top (after existing includes):

```typescript
const venueInclude = {
  select: {
    id: true,
    name: true,
    shortDescription: true,
    description: true,
    images: true,
    address: true,
    city: true,
    state: true,
    country: true,
    postalCode: true,
    latitude: true,
    longitude: true,
    hostId: true,
    isActive: true,
  },
};
```

- [ ] **Step 2: Create a flatten helper for backward compatibility**

Add this helper after the includes:

```typescript
/**
 * Flatten venue location fields onto the space object for backward compat.
 * Existing clients read space.city, space.address, etc. — this keeps them working
 * while also providing space.venue for new code.
 */
const flattenVenue = (space: any) => {
  if (!space?.venue) return space;
  return {
    ...space,
    // Flatten venue location fields onto space for backward compat
    address: space.venue.address,
    city: space.venue.city,
    state: space.venue.state,
    country: space.venue.country,
    postalCode: space.venue.postalCode,
    latitude: space.venue.latitude,
    longitude: space.venue.longitude,
  };
};
```

- [ ] **Step 3: Update `getSpaces` — include venue, filter by venue.city**

In the `getSpaces` function:

1. Change the city filter from `space.city` to `venue.city`:

```typescript
// Replace:
...(city && {
  city: { contains: city as string, mode: "insensitive" },
}),
// With:
...(city && {
  venue: {
    city: { contains: city as string, mode: "insensitive" },
  },
}),
```

2. Add `venue: venueInclude` to the `include` in `prisma.space.findMany`:

```typescript
include: {
  venue: venueInclude,
  category: categoryInclude,
  host: { ... },
  amenities: { ... },
  _count: { ... },
},
```

3. Wrap the response with `flattenVenue`:

```typescript
const spacesWithRating = await Promise.all(
  spaces.map(async (space) => {
    const avgRating = await prisma.review.aggregate({ ... });
    return flattenVenue({
      ...space,
      averageRating: avgRating._avg.rating || 0,
      reviewCount: space._count.reviews,
    });
  })
);
```

- [ ] **Step 4: Update `getSpace` — include venue**

Add `venue: venueInclude` to the include in `prisma.space.findUnique`, and wrap response:

```typescript
res.status(200).json(flattenVenue({
  ...space,
  averageRating: avgRating._avg.rating || 0,
  reviewCount,
}));
```

- [ ] **Step 5: Update `createSpace` — accept venueId**

In the `createSpace` function, extract `venueId` from the body:

```typescript
const { amenityIds, venueId, ...spaceData } = req.body;
```

Validate that the venue exists and belongs to the host:

```typescript
if (!venueId) {
  return res.status(400).json({ message: "venueId is required" });
}

const venue = await prisma.venue.findUnique({ where: { id: venueId } });
if (!venue) {
  return res.status(400).json({ message: "Venue not found" });
}
if (venue.hostId !== hostId) {
  return res.status(403).json({ message: "Venue does not belong to you" });
}
```

Add `venueId` to the create data:

```typescript
const space = await prisma.space.create({
  data: {
    ...buildCategoryPayload(spaceData),
    hostId,
    venueId,
    // Copy venue location fields to space for backward compat
    address: venue.address,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    postalCode: venue.postalCode,
    latitude: venue.latitude,
    longitude: venue.longitude,
    amenities: amenityIds
      ? { create: amenityIds.map((amenityId: number) => ({ amenityId })) }
      : undefined,
  },
  include: spaceDetailsInclude,
});
```

- [ ] **Step 6: Update `getMySpaces` — include venue**

Add `venue: venueInclude` to the include and map with `flattenVenue`:

```typescript
const spaces = await prisma.space.findMany({
  where: { hostId },
  include: {
    venue: venueInclude,
    category: categoryInclude,
    _count: { select: { bookings: true, reviews: true } },
  },
  orderBy: { createdAt: "desc" },
});

res.status(200).json(spaces.map(flattenVenue));
```

- [ ] **Step 7: Commit**

```bash
git add apps/product-service/src/controllers/space.controller.ts
git commit -m "feat(api): include venue in space responses with backward-compat flattening"
```

---

## Task 6: Admin — Venue Management Pages

**Files:**
- Create: `apps/admin/src/components/venues/venue-form.shared.ts`
- Create: `apps/admin/src/components/venues/venue-form.tsx`
- Create: `apps/admin/src/app/(dashboard)/host/venues/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/host/venues/[id]/edit/page.tsx`
- Modify: `apps/admin/src/components/AppSidebar.tsx`

### Step-by-step:

- [ ] **Step 1: Create venue form shared types**

Create `apps/admin/src/components/venues/venue-form.shared.ts`:

```typescript
export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

export const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const labelClassName = "mb-1 block text-sm font-medium text-foreground";

export interface VenueFormValues {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  images: string[];
}

export const createEmptyVenueFormValues = (): VenueFormValues => ({
  name: "",
  shortDescription: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  images: [],
});

export const buildVenuePayload = (formData: VenueFormValues) => ({
  ...formData,
  state: formData.state || null,
  postalCode: formData.postalCode || null,
});
```

- [ ] **Step 2: Create venue form component**

Create `apps/admin/src/components/venues/venue-form.tsx`. Follow the same patterns as `apps/admin/src/components/spaces/space-form.tsx` but with venue-specific fields:

- Name, short description, full description
- Address, city, state, country, postal code
- Image upload section (reuse existing upload component pattern from space-form)
- Submit button

The form should accept `mode: "create" | "edit"`, `initialValues?: VenueFormValues`, and `onSubmit` handler. Look at the existing `space-form.tsx` for the exact pattern — same styling, same field layout, same image upload approach.

- [ ] **Step 3: Create venue list page**

Create `apps/admin/src/app/(dashboard)/host/venues/page.tsx`:

Fetches `GET /venues/host/my` with the auth token. Displays a list/grid of venues showing: name, city/country, space count, active status, edit/delete actions. Follow the pattern of `host/spaces/page.tsx`.

- [ ] **Step 4: Create new venue page**

Create `apps/admin/src/app/(dashboard)/host/venues/new/page.tsx`:

Renders `<VenueForm mode="create">`. On submit, POST to `/venues`. On success, redirect to `/host/venues`.

- [ ] **Step 5: Create edit venue page**

Create `apps/admin/src/app/(dashboard)/host/venues/[id]/edit/page.tsx`:

Fetches `GET /venues/:id`, pre-populates `<VenueForm mode="edit">`. On submit, PUT to `/venues/:id`. On success, redirect to `/host/venues`.

- [ ] **Step 6: Add "Venues" to admin sidebar**

In `apps/admin/src/components/AppSidebar.tsx`, add a "Venues" nav item under the host section (before "Spaces"), using the `Building2` icon from lucide-react:

```typescript
{ title: "Venues", url: "/host/venues", icon: Building2 },
```

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/components/venues/ apps/admin/src/app/\(dashboard\)/host/venues/ apps/admin/src/components/AppSidebar.tsx
git commit -m "feat(admin): add venue management pages for hosts"
```

---

## Task 7: Admin — Update Space Form to Use Venue Selector

**Files:**
- Modify: `apps/admin/src/components/spaces/space-form.shared.ts`
- Modify: `apps/admin/src/components/spaces/space-form.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/spaces/new/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/spaces/[id]/edit/page.tsx`
- Modify: `apps/admin/src/app/(dashboard)/host/spaces/page.tsx`

### Step-by-step:

- [ ] **Step 1: Update SpaceFormValues — remove location fields, add venueId**

In `apps/admin/src/components/spaces/space-form.shared.ts`:

Remove from `SpaceFormValues`: `address`, `city`, `state`, `country`, `postalCode`
Add to `SpaceFormValues`: `venueId: number | null`

Same changes for `SpaceFormPayload` and `createEmptySpaceFormValues` (add `venueId: null`, remove location fields).

Update `buildSpacePayload` to include `venueId` and remove location fields.

Update `mapSpaceToFormValues` to read `venueId` from `space.venueId` instead of location fields.

- [ ] **Step 2: Update space form — replace location section with venue selector**

In `apps/admin/src/components/spaces/space-form.tsx`:

Replace the "Location" section (address, city, state, country, postalCode inputs) with a venue selector dropdown:

```tsx
{/* Venue Selection */}
<div>
  <h3 className="text-lg font-semibold mb-4">Venue</h3>
  <label className={labelClassName}>Select Venue *</label>
  <select
    value={formData.venueId ?? ""}
    onChange={(e) => setFormData({ ...formData, venueId: parseInt(e.target.value) || null })}
    className={fieldClassName}
    required
  >
    <option value="">Select a venue...</option>
    {venues.map((venue) => (
      <option key={venue.id} value={venue.id}>
        {venue.name} — {venue.city}, {venue.country}
      </option>
    ))}
  </select>
  <p className="text-sm text-muted-foreground mt-1">
    <a href="/host/venues/new" className="text-primary hover:underline">
      + Create new venue
    </a>
  </p>
</div>
```

The space form needs to fetch the host's venues on mount: `GET /venues/host/my`. Store in local state `venues`.

- [ ] **Step 3: Update new space page**

In `apps/admin/src/app/(dashboard)/host/spaces/new/page.tsx`:

The page should accept an optional `?venueId=` query param so hosts can go directly from a venue to "add space to this venue". Pre-select the venue in the form if provided.

- [ ] **Step 4: Update edit space page**

In `apps/admin/src/app/(dashboard)/host/spaces/[id]/edit/page.tsx`:

When loading space data, also load the space's `venueId` and populate the venue selector.

- [ ] **Step 5: Update host spaces list — show venue name**

In `apps/admin/src/app/(dashboard)/host/spaces/page.tsx`:

Add a "Venue" column/badge showing `space.venue?.name` for each space. The API already includes venue data (from Task 5).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/components/spaces/ apps/admin/src/app/\(dashboard\)/host/spaces/
git commit -m "feat(admin): replace location fields with venue selector in space form"
```

---

## Task 8: Client — Update Space Display for Venue Data

**Files:**
- Modify: `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`
- Modify: `apps/client/src/components/SpaceCard.tsx`
- Modify: `apps/client/src/components/SpaceList.tsx`
- Modify: `apps/client/messages/en.json`, `ro.json`, `ru.json`

### Step-by-step:

- [ ] **Step 1: Minimal client changes — everything works via backward compat**

Because of the `flattenVenue` helper in Task 5, ALL existing client code continues to work without changes. `space.city`, `space.address`, `space.latitude` etc. are all still present in the API response.

The only client changes needed are cosmetic improvements to show venue info:

- [ ] **Step 2: Update space detail page — show venue name**

In `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`:

After the space name `<h1>`, add a venue name if the space has a venue with a different name:

```tsx
{space.venue && space.venue.name !== space.name && (
  <p className="text-sm text-muted">
    {t("atVenue", { venue: space.venue.name })}
  </p>
)}
```

- [ ] **Step 3: Update SpaceCard — show venue name as subtitle**

In `apps/client/src/components/SpaceCard.tsx`:

If `space.venue` exists and has a different name from the space, show it as a subtle subtitle under the space name.

- [ ] **Step 4: Update SpaceWithCategory type in SpaceList.tsx**

In `apps/client/src/components/SpaceList.tsx`, add `venue` to the `SpaceWithCategory` type:

```typescript
export type SpaceWithCategory = Space & {
  category?: { ... } | null;
  venue?: {
    id: number;
    name: string;
    city: string;
    country: string;
  } | null;
};
```

- [ ] **Step 5: Add i18n keys**

Add to the `"spaces"` namespace in all 3 locale files:

**en.json:**
```json
"atVenue": "at {venue}"
```

**ro.json:**
```json
"atVenue": "la {venue}"
```

**ru.json:**
```json
"atVenue": "в {venue}"
```

- [ ] **Step 6: Commit**

```bash
git add apps/client/src/app/\[locale\]/\(main\)/spaces/ apps/client/src/components/SpaceCard.tsx apps/client/src/components/SpaceList.tsx apps/client/messages/
git commit -m "feat(client): display venue name on space cards and detail page"
```

---

## Task 9: Deployment — Run Migration on Production

**Files:** None (operational task)

### Step-by-step:

- [ ] **Step 1: Deploy the new code**

```bash
ssh root@138.197.178.212
cd /root/spacefly-ai
git pull origin main
scripts/deploy.sh build
```

- [ ] **Step 2: Run Prisma migrations**

```bash
scripts/deploy.sh migrate
```

This applies both migrations: `add_venue_model` and `make_venue_id_required`.

**Important:** The `make_venue_id_required` migration will FAIL if there are spaces without venues. That's why the data migration script must run between the two schema migrations. If deploying with both migrations in sequence, the deploy script handles it. If needed, split into two deploys.

- [ ] **Step 3: Run data migration script**

If the second migration failed because spaces don't have venues yet:

```bash
docker compose exec -it product-service node -e "
  // Run the data migration inside the container
"
```

Or better: run the migration script before the second Prisma migration by temporarily reverting to the optional venueId state, running the script, then applying the required migration.

**Recommended production deploy order:**
1. Deploy with only the first migration (venueId optional)
2. Run `scripts/migrate-spaces-to-venues.ts` against production DB
3. Verify all spaces have venueId
4. Deploy with second migration (venueId required)

- [ ] **Step 4: Start services**

```bash
scripts/deploy.sh up
scripts/deploy.sh health
```

- [ ] **Step 5: Verify**

- Check that existing space pages still load correctly (backward compat)
- Check that the admin venue management pages work
- Check that creating a new space requires selecting a venue
- Check that the venue API endpoints work

---

## Summary

| Task | What | Key Risk |
|------|------|----------|
| 1 | Schema: Add Venue model | None — additive change |
| 2 | Data migration: Create venues from spaces | Must run before making venueId required |
| 3 | Types: Add Venue interfaces | None — additive |
| 4 | API: Venue CRUD endpoints | None — new endpoints |
| 5 | API: Update space endpoints for venue | **Critical** — backward compat flattening |
| 6 | Admin: Venue management pages | Follows existing patterns |
| 7 | Admin: Update space form | Hosts must create venue before space |
| 8 | Client: Display venue info | Minimal — backward compat handles most |
| 9 | Deploy: Run migrations on production | Two-step deploy needed |
