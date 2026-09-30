-- Public, SEO-friendly URLs for venues and spaces (/venues/<slug>,
-- /spaces/<slug>). Numeric ids keep working: the client 301s them to the slug.
--
-- Backfill mirrors slugify()/spaceSlugSource() in packages/types/src/slug.ts so
-- existing rows get the same slugs the API gives new ones: diacritics folded
-- (not dropped), max 72 chars, never numeric-only, spaces prefixed with their
-- venue name unless the space name already starts with it.

CREATE FUNCTION pg_temp.spacefly_slugify(input text) RETURNS text AS $$
  SELECT CASE WHEN slug ~ '^[0-9]*$' THEN '' ELSE slug END
  FROM (SELECT trim(both '-' from left(
    regexp_replace(
      lower(translate(replace(replace(coalesce(input, ''), 'ß', 'ss'), 'ẞ', 'SS'),
        'ĂăÂâÎîȘșŞşȚțŢţÄäÖöÜüÉéÈèÊêËëÁáÀàÃãÅåÍíÌìÏïÓóÒòÔôÕõØøÚúÙùÛûÇçÑñŁłŚśŹźŻżĆćŃńĘęĄąČčŠšŽžŘřĎďŤťŇňĚěŮůŐőŰű',
        'AaAaIiSsSsTtTtAaOoUuEeEeEeEeAaAaAaAaIiIiIiOoOoOoOoOoUuUuUuCcNnLlSsZzZzCcNnEeAaCcSsZzRrDdTtNnEeUuOoUu')),
      '[^a-z0-9]+', '-', 'g'),
    72)) AS slug) AS folded
$$ LANGUAGE sql IMMUTABLE;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "slug" TEXT;

UPDATE "Venue" SET "slug" = pg_temp.spacefly_slugify("name");

UPDATE "Venue"
SET "slug" = 'venue-' || "id"::text
WHERE "slug" = '';

-- AlterTable
ALTER TABLE "Space" ADD COLUMN "slug" TEXT;

UPDATE "Space" AS s
SET "slug" = CASE
  WHEN pg_temp.spacefly_slugify(v."name") = ''
    OR pg_temp.spacefly_slugify(s."name") LIKE pg_temp.spacefly_slugify(v."name") || '%'
    THEN pg_temp.spacefly_slugify(s."name")
  ELSE pg_temp.spacefly_slugify(v."name" || ' ' || s."name")
END
FROM "Venue" AS v
WHERE v."id" = s."venueId";

UPDATE "Space"
SET "slug" = 'space-' || "id"::text
WHERE "slug" IS NULL OR "slug" = '';

-- De-duplicate with -2, -3 … (lowest id keeps the bare slug), repeating until
-- no suffixed slug collides with an existing one.
DO $$
BEGIN
  LOOP
    WITH ranked AS (
      SELECT "id", "slug", ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "id") AS rn
      FROM "Venue"
    )
    UPDATE "Venue" AS t
    SET "slug" = rtrim(left(r."slug", 68), '-') || '-' || r.rn::text
    FROM ranked AS r
    WHERE t."id" = r."id" AND r.rn > 1;
    EXIT WHEN NOT FOUND;
  END LOOP;

  LOOP
    WITH ranked AS (
      SELECT "id", "slug", ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "id") AS rn
      FROM "Space"
    )
    UPDATE "Space" AS t
    SET "slug" = rtrim(left(r."slug", 68), '-') || '-' || r.rn::text
    FROM ranked AS r
    WHERE t."id" = r."id" AND r.rn > 1;
    EXIT WHEN NOT FOUND;
  END LOOP;
END $$;

ALTER TABLE "Venue" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

ALTER TABLE "Space" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Space_slug_key" ON "Space"("slug");

-- Hide the leftover Iride coworking listing that stayed public after delete
-- failed (DELETE returned 409 for spaces with bookings; see deleteSpace).
UPDATE "Space"
SET "isActive" = false
WHERE "isActive" = true
  AND "name" = 'Regus Iride Business Centre Coworking';
