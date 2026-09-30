export function slugify(input: string): string {
  const slug = input
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 72)
    .replace(/^-+|-+$/g, "");
  if (!slug || /^\d+$/.test(slug)) return "";
  return slug;
}

// Space slugs read "<venue> <space>" (e.g. "regus-iride-hot-desk"), unless the
// space name already starts with the venue name — single-space venues often
// share it — so we don't emit "hub-chisinau-hub-chisinau".
export function spaceSlugSource(venueName: string, spaceName: string): string {
  const venue = slugify(venueName);
  if (!venue || slugify(spaceName).startsWith(venue)) return spaceName;
  return `${venueName} ${spaceName}`;
}

// Picks `base`, then `base-2`, `base-3`… until `taken` says a candidate is
// free. Shared by the API and the scripts/ importers so every writer produces
// the same slugs and none of them trips the unique index.
export async function allocateUniqueSlug(
  source: string,
  taken: (slug: string) => Promise<boolean>,
  fallback: string,
): Promise<string> {
  const base = slugify(source) || fallback;
  if (!(await taken(base))) return base;
  for (let n = 2; n < 80; n += 1) {
    const candidate = `${base}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function venueHref(venue: {
  id: number;
  slug?: string | null;
}): `/venues/${string}` {
  const slug = venue.slug?.trim();
  if (slug) return `/venues/${encodeURIComponent(slug)}`;
  return `/venues/${venue.id}`;
}

export function spaceHref(space: {
  id: number;
  slug?: string | null;
}): `/spaces/${string}` {
  const slug = space.slug?.trim();
  if (slug) return `/spaces/${encodeURIComponent(slug)}`;
  return `/spaces/${space.id}`;
}
