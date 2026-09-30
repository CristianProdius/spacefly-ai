import { describe, expect, it } from "vitest";
import {
  allocateUniqueSlug,
  slugify,
  spaceHref,
  spaceSlugSource,
  venueHref,
} from "./slug";

describe("slugify", () => {
  it("builds a lowercase hyphenated slug", () => {
    expect(slugify("Regus Iride Business Centre")).toBe(
      "regus-iride-business-centre",
    );
  });

  it("folds diacritics instead of dropping the letter", () => {
    expect(slugify("Regus Berlin Kurfürstendamm")).toBe(
      "regus-berlin-kurfurstendamm",
    );
    expect(slugify("Spațiu de lucru")).toBe("spatiu-de-lucru");
  });

  it("never ends with a hyphen after truncation", () => {
    const slug = slugify(`${"a".repeat(71)} tail`);
    expect(slug).toBe("a".repeat(71));
  });

  it("rejects numeric-only names so they cannot shadow id lookup", () => {
    expect(slugify("23")).toBe("");
    expect(slugify("  ")).toBe("");
  });
});

describe("venueHref / spaceHref", () => {
  it("prefers slug over numeric id", () => {
    expect(venueHref({ id: 23, slug: "regus-iride-business-centre" })).toBe(
      "/venues/regus-iride-business-centre",
    );
    expect(spaceHref({ id: 9, slug: "iride-hot-desk" })).toBe(
      "/spaces/iride-hot-desk",
    );
  });

  it("falls back to id when slug is missing", () => {
    expect(venueHref({ id: 23 })).toBe("/venues/23");
    expect(spaceHref({ id: 9, slug: "  " })).toBe("/spaces/9");
  });
});

describe("spaceSlugSource", () => {
  it("prefixes the space with its venue name", () => {
    expect(slugify(spaceSlugSource("Regus Iride", "Hot Desk"))).toBe(
      "regus-iride-hot-desk",
    );
  });

  it("doesn't repeat the venue when the space name already starts with it", () => {
    expect(
      slugify(spaceSlugSource("Hub Chișinău", "Hub Chisinau Coworking")),
    ).toBe("hub-chisinau-coworking");
  });
});

describe("allocateUniqueSlug", () => {
  it("suffixes -2, -3 past taken slugs", async () => {
    const taken = new Set(["hot-desk", "hot-desk-2"]);
    expect(
      await allocateUniqueSlug("Hot Desk", async (s) => taken.has(s), "space"),
    ).toBe("hot-desk-3");
  });

  it("uses the fallback when the name has no slug characters", async () => {
    expect(await allocateUniqueSlug("Коворкинг", async () => false, "venue")).toBe(
      "venue",
    );
  });
});
