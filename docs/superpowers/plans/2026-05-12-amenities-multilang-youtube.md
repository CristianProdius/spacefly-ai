# Phase 4: Custom Amenities, Multi-Language Content, YouTube Video — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three independent features: (A) space-type-specific amenity categories so hosts can add contextual options like "stage lighting" for event venues, (B) multi-language space/venue titles and descriptions, and (C) YouTube video embedding on space/venue detail pages.

**Architecture:** (A) Add `spaceTypes` field to Amenity model so amenities can be filtered by space type. (B) Store translations as JSON columns (`nameTranslations`, `descriptionTranslations`) alongside the original text fields — the API returns the right language based on an `Accept-Language` header or `?lang=` param, falling back to the original. (C) Add `videoUrl` to Space and Venue models, render a YouTube embed on the detail page.

**Tech Stack:** Prisma (PostgreSQL), Express (product-service), Next.js (client + admin), TypeScript, Tailwind CSS, next-intl

---

## Feature A: Space-Type-Specific Amenities

### File Structure

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add `spaceTypes` field to Amenity |
| `apps/product-service/src/controllers/category.controller.ts` | Update amenity query to accept spaceType filter |
| `apps/admin/src/app/(dashboard)/admin/amenities/page.tsx` | Add spaceType tags when creating amenities |
| `apps/admin/src/components/spaces/space-form.tsx` | Filter amenity list by selected category's space type |
| `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx` | No change needed (amenities already display by name) |

---

### Task 1: Schema — Add spaceTypes to Amenity

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add spaceTypes array to Amenity model**

In the `Amenity` model, add after `category`:

```prisma
  spaceTypes SpaceType[] // Which space types this amenity applies to (empty = all types)
```

This uses Prisma's native array support on PostgreSQL.

- [ ] **Step 2: Generate and run migration**

```bash
cd packages/db
pnpm prisma migrate dev --name add_amenity_space_types
pnpm prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/ packages/db/generated/
git commit -m "feat(db): add spaceTypes array to Amenity for type-specific filtering"
```

---

### Task 2: API — Filter Amenities by Space Type

**Files:**
- Modify: `apps/product-service/src/controllers/category.controller.ts`

- [ ] **Step 1: Update the GET /amenities endpoint**

Read the category controller first. Find the amenities handler. Add an optional `spaceType` query param:

```typescript
// In the amenities handler:
const { spaceType } = req.query;

const amenities = await prisma.amenity.findMany({
  where: spaceType
    ? {
        OR: [
          { spaceTypes: { has: spaceType as SpaceType } },
          { spaceTypes: { isEmpty: true } }, // Amenities with no type restriction apply to all
        ],
      }
    : undefined,
  orderBy: [{ category: "asc" }, { name: "asc" }],
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/product-service/src/controllers/category.controller.ts
git commit -m "feat(api): filter amenities by spaceType query param"
```

---

### Task 3: Admin — SpaceType Tags on Amenity Management

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/admin/amenities/page.tsx`

- [ ] **Step 1: Update the admin amenities page**

Read the file first. Add:

1. A multi-select for space types when creating an amenity (checkboxes for OFFICE_DESK, PRIVATE_OFFICE, MEETING_ROOM, EVENT_VENUE, WEDDING_VENUE, COWORKING_SPACE). Empty selection = applies to all.

2. Display the space type tags next to each amenity in the list.

3. Send `spaceTypes` array in the POST body when creating.

In the `Amenity` interface, add:
```typescript
spaceTypes: string[];
```

In the add form, add checkboxes:
```tsx
<div>
  <label className="text-sm font-medium">Applies to (leave empty for all)</label>
  <div className="flex flex-wrap gap-2 mt-1">
    {["OFFICE_DESK", "PRIVATE_OFFICE", "MEETING_ROOM", "EVENT_VENUE", "WEDDING_VENUE", "COWORKING_SPACE"].map((type) => (
      <label key={type} className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={newSpaceTypes.includes(type)}
          onChange={(e) => {
            if (e.target.checked) setNewSpaceTypes([...newSpaceTypes, type]);
            else setNewSpaceTypes(newSpaceTypes.filter((t) => t !== type));
          }}
        />
        {type.replace(/_/g, " ")}
      </label>
    ))}
  </div>
</div>
```

Add `spaceTypes: newSpaceTypes` to the POST body.

- [ ] **Step 2: Update space form to filter amenities**

In `apps/admin/src/components/spaces/space-form.tsx`, when fetching amenities on mount, pass the selected category's space type:

```typescript
const fetchAmenities = async () => {
  const spaceType = formData.spaceType;
  const url = spaceType
    ? `${PRODUCT_SERVICE_URL}/amenities?spaceType=${spaceType}`
    : `${PRODUCT_SERVICE_URL}/amenities`;
  const res = await fetch(url);
  // ...
};
```

Re-fetch amenities when `formData.spaceType` changes.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/admin/amenities/page.tsx apps/admin/src/components/spaces/space-form.tsx
git commit -m "feat(admin): space-type-specific amenity management and filtering"
```

---

## Feature B: Multi-Language Content

### File Structure

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add JSON translation columns to Space and Venue |
| `packages/types/src/space.ts` | Add translation fields to interfaces |
| `apps/product-service/src/controllers/space.controller.ts` | Resolve translations based on lang param |
| `apps/product-service/src/controllers/venue.controller.ts` | Same for venues |
| `apps/admin/src/components/spaces/space-form.tsx` | Add translation tabs for name/description |
| `apps/admin/src/components/venues/venue-form.tsx` | Same for venues |
| `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx` | Pass locale to API |
| `apps/client/src/components/SpaceList.tsx` | Pass locale to API |

### Design

Store translations as JSON columns alongside the original fields. The original `name`/`description`/`shortDescription` remain the "default" language. Translation JSON has the structure:

```json
{ "ro": "Translated name in Romanian", "ru": "Translated name in Russian" }
```

The API resolves: if `?lang=ro` is passed and a Romanian translation exists, return it as `name`. Otherwise return the original. This keeps backward compat — no client changes needed except passing the locale.

---

### Task 4: Schema — Add Translation JSON Columns

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add translation fields to Space**

In the Space model, add after `description`:

```prisma
  nameTranslations        Json? // { "ro": "...", "ru": "..." }
  shortDescTranslations   Json? // { "ro": "...", "ru": "..." }
  descriptionTranslations Json? // { "ro": "...", "ru": "..." }
```

- [ ] **Step 2: Add translation fields to Venue**

In the Venue model, add after `description`:

```prisma
  nameTranslations        Json? // { "ro": "...", "ru": "..." }
  shortDescTranslations   Json? // { "ro": "...", "ru": "..." }
  descriptionTranslations Json? // { "ro": "...", "ru": "..." }
```

- [ ] **Step 3: Generate and run migration**

```bash
cd packages/db
pnpm prisma migrate dev --name add_translation_columns
pnpm prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/ packages/db/generated/
git commit -m "feat(db): add JSON translation columns to Space and Venue"
```

---

### Task 5: API — Resolve Translations by Language

**Files:**
- Create: `apps/product-service/src/lib/translations.ts`
- Modify: `apps/product-service/src/controllers/space.controller.ts`
- Modify: `apps/product-service/src/controllers/venue.controller.ts`

- [ ] **Step 1: Create translation resolver utility**

Create `apps/product-service/src/lib/translations.ts`:

```typescript
/**
 * Resolve translated fields on an entity.
 * If lang is provided and a translation exists, overwrite the original field.
 * Falls back to the original value if no translation found.
 */
export function resolveTranslations<T extends Record<string, unknown>>(
  entity: T,
  lang: string | undefined,
  fields: Array<{ original: string; translations: string }>
): T {
  if (!lang || lang === "en") return entity;

  const resolved = { ...entity };
  for (const { original, translations: translationsKey } of fields) {
    const translations = entity[translationsKey];
    if (translations && typeof translations === "object" && !Array.isArray(translations)) {
      const translated = (translations as Record<string, string>)[lang];
      if (translated) {
        (resolved as any)[original] = translated;
      }
    }
  }
  return resolved;
}

/** Standard translation field mapping for spaces */
export const SPACE_TRANSLATION_FIELDS = [
  { original: "name", translations: "nameTranslations" },
  { original: "shortDescription", translations: "shortDescTranslations" },
  { original: "description", translations: "descriptionTranslations" },
];

/** Standard translation field mapping for venues */
export const VENUE_TRANSLATION_FIELDS = [
  { original: "name", translations: "nameTranslations" },
  { original: "shortDescription", translations: "shortDescTranslations" },
  { original: "description", translations: "descriptionTranslations" },
];
```

- [ ] **Step 2: Update space controller — resolve translations**

In `space.controller.ts`:

Import the utility:
```typescript
import { resolveTranslations, SPACE_TRANSLATION_FIELDS } from "../lib/translations.js";
```

In `getSpaces`, read `lang` from query: `const lang = req.query.lang as string | undefined;`

After building `spacesWithRating`, apply translations:
```typescript
const resolved = spacesWithRating.map((space) =>
  resolveTranslations(space, lang, SPACE_TRANSLATION_FIELDS)
);
```

Return `resolved` instead of `spacesWithRating`.

In `getSpace`, same pattern: read `lang`, apply `resolveTranslations` before sending response.

- [ ] **Step 3: Update venue controller — resolve translations**

In `venue.controller.ts`, import and apply `resolveTranslations` with `VENUE_TRANSLATION_FIELDS` in `getVenue`.

- [ ] **Step 4: Commit**

```bash
git add apps/product-service/src/lib/translations.ts apps/product-service/src/controllers/space.controller.ts apps/product-service/src/controllers/venue.controller.ts
git commit -m "feat(api): resolve Space/Venue translations by lang query param"
```

---

### Task 6: Admin — Translation Tabs in Space/Venue Forms

**Files:**
- Create: `apps/admin/src/components/translation-tabs.tsx`
- Modify: `apps/admin/src/components/spaces/space-form.shared.ts`
- Modify: `apps/admin/src/components/spaces/space-form.tsx`
- Modify: `apps/admin/src/components/venues/venue-form.shared.ts`
- Modify: `apps/admin/src/components/venues/venue-form.tsx`

- [ ] **Step 1: Create reusable TranslationTabs component**

Create `apps/admin/src/components/translation-tabs.tsx`:

A component that shows tabs for EN / RO / RU. The EN tab is the main input (existing fields). RO and RU tabs show translation inputs. Props:

```typescript
interface TranslationTabsProps {
  fields: Array<{
    name: string;
    label: string;
    type: "input" | "textarea";
    value: string;                    // EN value (from main form)
    translations: Record<string, string>; // { ro: "...", ru: "..." }
    onTranslationChange: (lang: string, value: string) => void;
  }>;
}
```

Renders as tab buttons (EN active by default, greyed out tabs for RO/RU). When RO/RU is selected, show the same fields but bound to the translations. Mark with a small flag or language code.

- [ ] **Step 2: Update space form types**

In `space-form.shared.ts`, add to `SpaceFormValues`:
```typescript
nameTranslations: Record<string, string>;
shortDescTranslations: Record<string, string>;
descriptionTranslations: Record<string, string>;
```

Add to `SpaceFormPayload`, `createEmptySpaceFormValues` (default `{}`), `buildSpacePayload`, and `mapSpaceToFormValues`.

- [ ] **Step 3: Add TranslationTabs to space form**

In `space-form.tsx`, add the TranslationTabs component in the "Basic Information" section, passing name/shortDescription/description as the translatable fields.

- [ ] **Step 4: Same for venue form**

Update `venue-form.shared.ts` and `venue-form.tsx` with the same translation fields and TranslationTabs component.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/translation-tabs.tsx apps/admin/src/components/spaces/ apps/admin/src/components/venues/
git commit -m "feat(admin): multi-language translation tabs in space and venue forms"
```

---

### Task 7: Client — Pass Locale to API

**Files:**
- Modify: `apps/client/src/components/SpaceList.tsx`
- Modify: `apps/client/src/components/SpaceListBrowse.tsx`
- Modify: `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`

- [ ] **Step 1: Pass locale in space list fetch**

In `SpaceList.tsx`, the `fetchSpaces` function builds a URL. Add the locale from the page's params. The `SpaceList` component is used in `spaces/page.tsx` which has access to `[locale]` from the route. Pass it as a prop:

Add `locale?: string` to `SpaceListProps`. In `fetchSpaces`, add `if (params.lang) searchParams.set("lang", params.lang)`. Add `lang` to `FetchParams`.

In `spaces/page.tsx`, pass `locale` from the route params to `<SpaceList>`.

- [ ] **Step 2: Pass locale in SpaceListBrowse client-side fetch**

In `SpaceListBrowse.tsx`, the `loadMore` function fetches pages client-side. Include the locale in the API params. Read locale from `window.location.pathname.split("/")[1]` and add as `lang` param.

- [ ] **Step 3: Pass locale in space detail page fetch**

In `spaces/[id]/page.tsx`, the `getSpace` function fetches a single space. The page has access to `params.locale` (from `[locale]` in the route). Append `?lang=${locale}` to the fetch URL:

```typescript
async function getSpace(id: string, locale: string): Promise<SpaceWithHost | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${id}?lang=${locale}`,
    { next: { revalidate: 60 } }
  );
  // ...
}
```

Call it with `const space = await getSpace(id, locale)` where locale comes from `await params`.

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/components/SpaceList.tsx apps/client/src/components/SpaceListBrowse.tsx apps/client/src/app/\[locale\]/\(main\)/spaces/
git commit -m "feat(client): pass locale to space/venue API for translated content"
```

---

## Feature C: YouTube Video Embedding

### File Structure

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Add `videoUrl` to Space and Venue |
| `packages/types/src/space.ts` | Add videoUrl to interfaces |
| `packages/types/src/venue.ts` | Add videoUrl to Venue interface |
| `apps/client/src/components/YouTubeEmbed.tsx` | New component to render YouTube iframe |
| `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx` | Render YouTubeEmbed if videoUrl exists |
| `apps/admin/src/components/spaces/space-form.shared.ts` | Add videoUrl field |
| `apps/admin/src/components/spaces/space-form.tsx` | Add videoUrl input |
| `apps/admin/src/components/venues/venue-form.shared.ts` | Add videoUrl field |
| `apps/admin/src/components/venues/venue-form.tsx` | Add videoUrl input |

---

### Task 8: Schema + Types — Add videoUrl

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/types/src/space.ts`
- Modify: `packages/types/src/venue.ts`

- [ ] **Step 1: Add videoUrl to Space and Venue models**

In Space model, add after `images`:
```prisma
  videoUrl         String? // YouTube URL
```

In Venue model, add after `images`:
```prisma
  videoUrl String? // YouTube URL
```

- [ ] **Step 2: Generate migration**

```bash
cd packages/db
pnpm prisma migrate dev --name add_video_url
pnpm prisma generate
```

- [ ] **Step 3: Add to TypeScript interfaces**

In `packages/types/src/space.ts`, add `videoUrl: string | null;` to the `Space` interface after `images`.

In `packages/types/src/venue.ts`, add `videoUrl: string | null;` to the `Venue` interface after `images`.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/ packages/db/generated/ packages/types/src/
git commit -m "feat(db): add videoUrl field to Space and Venue"
```

---

### Task 9: Client — YouTube Embed Component

**Files:**
- Create: `apps/client/src/components/YouTubeEmbed.tsx`
- Modify: `apps/client/src/app/[locale]/(main)/spaces/[id]/page.tsx`
- Modify: `apps/client/messages/en.json`, `ro.json`, `ru.json`

- [ ] **Step 1: Create YouTubeEmbed component**

Create `apps/client/src/components/YouTubeEmbed.tsx`:

```typescript
/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

const YouTubeEmbed = ({ url, title = "Video" }: YouTubeEmbedProps) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
```

- [ ] **Step 2: Add to space detail page**

In `spaces/[id]/page.tsx`, import and render after the image gallery section:

```tsx
import YouTubeEmbed from "@/components/YouTubeEmbed";

// After ImageGallery, before the grid:
{(space as any).videoUrl && (
  <div className="mb-8">
    <YouTubeEmbed url={(space as any).videoUrl} title={space.name} />
  </div>
)}
```

- [ ] **Step 3: Add i18n key**

Add to `"spaces"` namespace in all 3 locale files:

- en.json: `"video": "Video"`
- ro.json: `"video": "Video"`
- ru.json: `"video": "Видео"`

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/components/YouTubeEmbed.tsx apps/client/src/app/\[locale\]/\(main\)/spaces/ apps/client/messages/
git commit -m "feat(client): YouTube video embed on space detail page"
```

---

### Task 10: Admin — VideoUrl Field in Space/Venue Forms

**Files:**
- Modify: `apps/admin/src/components/spaces/space-form.shared.ts`
- Modify: `apps/admin/src/components/spaces/space-form.tsx`
- Modify: `apps/admin/src/components/venues/venue-form.shared.ts`
- Modify: `apps/admin/src/components/venues/venue-form.tsx`

- [ ] **Step 1: Add videoUrl to space form types**

In `space-form.shared.ts`:
- Add `videoUrl: string` to `SpaceFormValues` and `SpaceFormPayload`
- Add `videoUrl: ""` to `createEmptySpaceFormValues`
- Add `videoUrl: formData.videoUrl || null` to `buildSpacePayload`
- Add `videoUrl: space.videoUrl ?? ""` to `mapSpaceToFormValues`

- [ ] **Step 2: Add videoUrl input to space form**

In `space-form.tsx`, add in the Images/Media section (or after it):

```tsx
<div>
  <label className={labelClassName}>YouTube Video URL (optional)</label>
  <input
    type="url"
    placeholder="https://www.youtube.com/watch?v=..."
    value={formData.videoUrl}
    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
    className={fieldClassName}
  />
  <p className="text-sm text-muted-foreground mt-1">
    Paste a YouTube link to embed a video on the space page
  </p>
</div>
```

- [ ] **Step 3: Same for venue form**

Add `videoUrl` to venue form types and add the same input field.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/components/spaces/ apps/admin/src/components/venues/
git commit -m "feat(admin): YouTube video URL field in space and venue forms"
```

---

### Task 11: Deploy

- [ ] **Step 1: Merge and push**

```bash
git checkout main
git merge feature/phase4-amenities-multilang-youtube --ff-only
git push origin main
```

- [ ] **Step 2: Deploy to production**

```bash
ssh root@138.197.178.212
cd /root/spacefly-ai && git pull origin main
scripts/deploy.sh full
```

- [ ] **Step 3: Verify**

- Admin amenities page: can assign space types to amenities
- Space form: amenities filtered by selected space type
- Space form: translation tabs for name/description (EN/RO/RU)
- Space form: YouTube URL field
- Space detail page: shows YouTube video if URL provided
- Browse page: shows translated names when locale is ro/ru

---

## Summary

| Task | Feature | What |
|------|---------|------|
| 1 | Amenities | Schema: spaceTypes array on Amenity |
| 2 | Amenities | API: filter amenities by spaceType |
| 3 | Amenities | Admin: spaceType tags + space form filtering |
| 4 | Multi-lang | Schema: translation JSON columns on Space/Venue |
| 5 | Multi-lang | API: resolve translations by lang param |
| 6 | Multi-lang | Admin: translation tabs in forms |
| 7 | Multi-lang | Client: pass locale to API |
| 8 | YouTube | Schema + types: videoUrl field |
| 9 | YouTube | Client: YouTube embed component |
| 10 | YouTube | Admin: videoUrl in forms |
| 11 | All | Deploy |
