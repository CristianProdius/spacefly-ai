// Venue/Space slugs for the scripts/ importers. Same algorithm as the API
// (createVenue/createSpace) via the shared @repo/types helper, imported by
// relative path because prod node_modules can't resolve @repo/* from scripts/.
import type { Prisma } from "../../packages/db/generated/prisma/index.js";
import { allocateUniqueSlug, slugify, spaceSlugSource } from "../../packages/types/src/slug.ts";

type SlugClient = Pick<Prisma.TransactionClient, "venue" | "space">;

// The API slugs venues by name alone; imports append the city so the same
// brand in two cities ("Regus Iride" Bucharest vs Cluj) gets distinct slugs —
// unless the name already carries it ("Regus Dublin Five Lamps").
export const uniqueVenueSlug = (tx: SlugClient, name: string, city: string) =>
  allocateUniqueSlug(
    slugify(name).includes(slugify(city)) ? name : `${name} ${city}`,
    async (slug) =>
      !!(await tx.venue.findUnique({ where: { slug }, select: { id: true } })),
    "venue",
  );

// Matches createSpace.
export const uniqueSpaceSlug = (
  tx: SlugClient,
  venueName: string,
  spaceName: string,
) =>
  allocateUniqueSlug(
    spaceSlugSource(venueName, spaceName),
    async (slug) =>
      !!(await tx.space.findUnique({ where: { slug }, select: { id: true } })),
    "space",
  );
