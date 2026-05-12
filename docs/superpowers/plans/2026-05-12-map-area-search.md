# Phase 5: Map-Based Area Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a map view to the browse page where users can see space pins, pan/zoom to search an area, and click pins to view spaces — alongside the existing list view.

**Architecture:** Add bounding-box query params (`neLat`, `neLng`, `swLat`, `swLng`) to the spaces API. On the client, add a split-view browse mode: list on the left, Leaflet map on the right showing pins for visible spaces. As the user pans/zooms the map, re-fetch spaces within the new bounds. The admin venue form gets a click-to-place map picker for setting lat/lng. Uses existing Leaflet + react-leaflet (already installed).

**Tech Stack:** Leaflet, react-leaflet, Prisma (PostgreSQL), Express, Next.js, Tailwind CSS

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `apps/client/src/components/SpaceMap.tsx` | Leaflet map with space pins for browse page |
| `apps/client/src/components/SpaceMapPin.tsx` | Custom popup for map markers |
| `apps/admin/src/components/venues/map-picker.tsx` | Click-to-place map for setting venue lat/lng |

### Modified Files
| File | What Changes |
|------|-------------|
| `apps/product-service/src/controllers/space.controller.ts` | Add bounding-box filter (neLat/neLng/swLat/swLng) |
| `apps/client/src/components/SpaceListBrowse.tsx` | Add map/list toggle, render SpaceMap in map mode |
| `apps/client/src/components/SpaceFilter.tsx` | Add map/list view toggle button |
| `apps/admin/src/components/venues/venue-form.tsx` | Integrate map picker for lat/lng |
| `apps/admin/src/components/venues/venue-form.shared.ts` | Ensure lat/lng in form types |
| `apps/client/messages/en.json`, `ro.json`, `ru.json` | Map-related i18n keys |

---

## Task 1: API — Bounding Box Filter for Spaces

**Files:**
- Modify: `apps/product-service/src/controllers/space.controller.ts`

- [ ] **Step 1: Add bounding box params to getSpaces**

In `getSpaces`, add to the destructured query params:

```typescript
neLat: neLat, // Northeast latitude (top-right)
neLng: neLng, // Northeast longitude (top-right)
swLat: swLat, // Southwest latitude (bottom-left)
swLng: swLng, // Southwest longitude (bottom-left)
```

Add to the `where` clause (filter via venue relation since venue owns the coordinates):

```typescript
...(neLat && neLng && swLat && swLng && {
  venue: {
    ...((city as string) ? { city: { contains: city as string, mode: "insensitive" } } : {}),
    latitude: {
      gte: parseFloat(swLat as string),
      lte: parseFloat(neLat as string),
    },
    longitude: {
      gte: parseFloat(swLng as string),
      lte: parseFloat(neLng as string),
    },
  },
}),
```

**Important:** When bounding box params are present, the city filter should move inside the venue filter (both are on venue). When bbox is NOT present, keep the existing city filter behavior. Restructure the where clause accordingly — if bbox params exist, build the venue filter with both city and bounds; if only city, use the existing venue.city filter.

- [ ] **Step 2: Commit**

```bash
git add apps/product-service/src/controllers/space.controller.ts
git commit -m "feat(api): add bounding box filter for map-based space search"
```

---

## Task 2: Client — SpaceMap Component

**Files:**
- Create: `apps/client/src/components/SpaceMap.tsx`
- Create: `apps/client/src/components/SpaceMapPin.tsx`

- [ ] **Step 1: Create SpaceMapPin component**

Create `apps/client/src/components/SpaceMapPin.tsx`:

A small popup card shown when clicking a map pin. Shows: space image thumbnail, name, venue name, price, and a link to the detail page. Props:

```typescript
interface SpaceMapPinProps {
  space: {
    id: number;
    name: string;
    images: string[] | unknown;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricingType: string;
    currency?: string;
    venue?: { name: string } | null;
  };
}
```

Uses `formatPrice` from `@/lib/utils` and `Link` from `@/i18n/navigation`.

Render as a compact card: 200px wide, image on top (80px height), name, venue name (muted), price, "View" link.

- [ ] **Step 2: Create SpaceMap component**

Create `apps/client/src/components/SpaceMap.tsx`:

A `"use client"` component using `react-leaflet`. Props:

```typescript
interface SpaceMapProps {
  spaces: Array<{
    id: number;
    name: string;
    images: string[] | unknown;
    latitude: number | null;
    longitude: number | null;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricingType: string;
    currency?: string;
    venue?: { name: string; latitude: number | null; longitude: number | null } | null;
  }>;
  onBoundsChange: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
  isLoading?: boolean;
}
```

Implementation:
- Import `MapContainer`, `TileLayer`, `Marker`, `Popup`, `useMapEvents` from `react-leaflet`
- Import `L` from `leaflet` for custom marker icon
- Use the same custom orange pin SVG from the existing `LocationMap.tsx` (read it for the icon definition)
- Default center: Chisinau, Moldova (47.0105, 28.8638) — or center on the first space with coordinates
- Default zoom: 12
- Use `useMapEvents` to listen for `moveend` and `zoomend` events, call `onBoundsChange` with the new bounds
- Render `<Marker>` for each space that has latitude/longitude (prefer venue coords, fall back to space coords)
- Each marker has a `<Popup>` containing `<SpaceMapPin>`
- Show a loading overlay when `isLoading` is true
- OpenStreetMap tile layer (same as existing LocationMap)

**Important:** Must be dynamically imported (no SSR) since Leaflet requires `window`. Follow the same pattern as `LocationMapLoader.tsx`:

```typescript
import dynamic from "next/dynamic";
const SpaceMap = dynamic(() => import("./SpaceMap"), { ssr: false });
```

The SpaceListBrowse component (Task 3) will use this dynamic import.

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/components/SpaceMap.tsx apps/client/src/components/SpaceMapPin.tsx
git commit -m "feat(client): SpaceMap component with Leaflet pins and popups"
```

---

## Task 3: Client — Map/List Toggle on Browse Page

**Files:**
- Modify: `apps/client/src/components/SpaceListBrowse.tsx`
- Modify: `apps/client/messages/en.json`, `ro.json`, `ru.json`

- [ ] **Step 1: Add map/list view state and map bounds fetching**

In `SpaceListBrowse.tsx`:

Add state:
```typescript
const [viewMode, setViewMode] = useState<"list" | "map">("list");
const [mapSpaces, setMapSpaces] = useState<SpaceWithCategory[]>([]);
const [mapLoading, setMapLoading] = useState(false);
```

Add a `fetchMapSpaces` function that fetches spaces within bounds:
```typescript
const fetchMapSpaces = useCallback(async (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => {
  setMapLoading(true);
  try {
    const params = new URLSearchParams(apiParamsRef.current);
    params.set("neLat", String(bounds.neLat));
    params.set("neLng", String(bounds.neLng));
    params.set("swLat", String(bounds.swLat));
    params.set("swLng", String(bounds.swLng));
    params.set("limit", "100"); // Show more on map
    const url = `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    setMapSpaces(data.spaces || []);
  } catch (err) {
    console.error("Error fetching map spaces:", err);
  } finally {
    setMapLoading(false);
  }
}, []);
```

- [ ] **Step 2: Add view toggle buttons**

After the `<SpaceFilter />` component, add toggle buttons:

```tsx
<div className="flex items-center gap-2 mb-4">
  <button
    onClick={() => setViewMode("list")}
    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
      viewMode === "list" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
    }`}
  >
    <LayoutGrid className="size-4" />
    {t("listView")}
  </button>
  <button
    onClick={() => setViewMode("map")}
    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
      viewMode === "map" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
    }`}
  >
    <MapIcon className="size-4" />
    {t("mapView")}
  </button>
</div>
```

Import `LayoutGrid` and `Map as MapIcon` from `lucide-react`.

- [ ] **Step 3: Conditionally render map or list**

Wrap the existing list rendering in a conditional:

```tsx
{viewMode === "list" ? (
  // ... existing list grid, loading spinner, sentinel, etc.
) : (
  <div className="h-[calc(100vh-280px)] min-h-[500px] rounded-xl overflow-hidden border border-border">
    <SpaceMapDynamic
      spaces={mapSpaces.length > 0 ? mapSpaces : spaces}
      onBoundsChange={fetchMapSpaces}
      isLoading={mapLoading}
    />
  </div>
)}
```

Add the dynamic import at the top of the file:
```typescript
import dynamic from "next/dynamic";
const SpaceMapDynamic = dynamic(() => import("./SpaceMap"), { ssr: false });
```

- [ ] **Step 4: Add i18n keys**

Add to `"spaces"` namespace in all 3 locale files:

**en.json:**
```json
"listView": "List",
"mapView": "Map"
```

**ro.json:**
```json
"listView": "Listă",
"mapView": "Hartă"
```

**ru.json:**
```json
"listView": "Список",
"mapView": "Карта"
```

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/components/SpaceListBrowse.tsx apps/client/messages/
git commit -m "feat(client): map/list toggle on browse page with map-based space search"
```

---

## Task 4: Admin — Map Picker for Venue Lat/Lng

**Files:**
- Create: `apps/admin/src/components/venues/map-picker.tsx`
- Modify: `apps/admin/src/components/venues/venue-form.tsx`

- [ ] **Step 1: Create MapPicker component**

Create `apps/admin/src/components/venues/map-picker.tsx`:

A `"use client"` component that shows a Leaflet map. The host clicks to place a pin, and the component reports the lat/lng back. Props:

```typescript
interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}
```

Implementation:
- `MapContainer` centered on existing pin or Chisinau default (47.0105, 28.8638)
- Zoom: 13
- `TileLayer` with OpenStreetMap tiles
- A `Marker` at the current lat/lng (if set)
- `useMapEvents` to handle `click` — on click, call `onChange(e.latlng.lat, e.latlng.lng)`
- Show instruction text: "Click on the map to set location"
- Height: 300px
- Must be dynamically imported (no SSR)

Check the existing `LocationMap.tsx` in the client app for the marker icon SVG and tile URL pattern.

**Note:** The admin app may not have `leaflet` and `react-leaflet` installed. Check `apps/admin/package.json`. If not installed, they need to be added:

```bash
cd apps/admin && pnpm add leaflet react-leaflet @types/leaflet
```

Also need to import leaflet CSS. Add to the MapPicker component:
```typescript
import "leaflet/dist/leaflet.css";
```

- [ ] **Step 2: Add MapPicker to venue form**

In `apps/admin/src/components/venues/venue-form.tsx`:

After the postal code input in the Location section, add:

```tsx
<div>
  <label className={labelClassName}>Location on Map</label>
  <p className="text-sm text-muted-foreground mb-2">Click the map to set the venue's location pin</p>
  <MapPickerDynamic
    latitude={formData.latitude}
    longitude={formData.longitude}
    onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
  />
  {formData.latitude && formData.longitude && (
    <p className="text-xs text-muted-foreground mt-1">
      Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
    </p>
  )}
</div>
```

Dynamic import:
```typescript
import dynamic from "next/dynamic";
const MapPickerDynamic = dynamic(() => import("./map-picker"), { ssr: false });
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/components/venues/map-picker.tsx apps/admin/src/components/venues/venue-form.tsx
git commit -m "feat(admin): map picker for setting venue location coordinates"
```

---

## Task 5: Deploy

- [ ] **Step 1: Push and deploy**

```bash
git push origin main
ssh root@138.197.178.212 "cd /root/spacefly-ai && git pull origin main && scripts/deploy.sh full"
```

- [ ] **Step 2: Verify**

- Browse page shows List/Map toggle buttons
- Clicking Map shows Leaflet map with pins for spaces
- Panning/zooming the map re-fetches spaces in the visible area
- Clicking a pin shows space popup with name, price, link
- Admin venue form shows a map picker for setting coordinates
- Clicking the map in admin sets the lat/lng values

---

## Summary

| Task | What | Complexity |
|------|------|-----------|
| 1 | API: bounding box filter (neLat/neLng/swLat/swLng) | Low |
| 2 | Client: SpaceMap + SpaceMapPin components | Medium |
| 3 | Client: map/list toggle on browse page | Medium |
| 4 | Admin: map picker for venue coordinates | Medium |
| 5 | Deploy | Low |
