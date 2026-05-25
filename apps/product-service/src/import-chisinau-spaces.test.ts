import { describe, expect, it } from "vitest";
import {
  type CuratedSpaceSeed,
  validateCuratedSpaceSeeds,
} from "../../../scripts/data/chisinau-spaces";

const buildSeed = (
  overrides: Partial<CuratedSpaceSeed> = {},
): CuratedSpaceSeed => ({
  address: "Main Street 1",
  amenityNames: ["WiFi"],
  capacity: 8,
  categorySlug: "meeting-training-room",
  city: "Chisinau",
  country: "Moldova",
  description: "A validated curated listing.",
  houseRules: "Keep the room tidy.",
  hostSlug: "ihub-chisinau",
  imageSourceUrls: ["https://example.com/image.jpg"],
  latitude: null,
  longitude: null,
  maxBookingHours: 4,
  minBookingHours: 1,
  name: "Single Verified Listing",
  notes: "Verified-only population is allowed to start sparse.",
  postalCode: null,
  pricingType: "HOURLY",
  shortDescription: "Single verified listing",
  sourceUrls: ["https://example.com/source"],
  spaceType: "MEETING_ROOM",
  state: null,
  ...overrides,
});

describe("curated Chisinau space validation", () => {
  it("allows a category to have a single verified listing", () => {
    expect(() => validateCuratedSpaceSeeds([buildSeed()])).not.toThrow();
  });

  it("still rejects duplicate listing names", () => {
    const seed = buildSeed();

    expect(() =>
      validateCuratedSpaceSeeds([
        seed,
        buildSeed({ address: "Other Street 2" }),
      ]),
    ).toThrow("Duplicate space name in manifest");
  });

  it("requires each listing to identify a local host", () => {
    const seed: Partial<CuratedSpaceSeed> = buildSeed();
    delete seed.hostSlug;

    expect(() => validateCuratedSpaceSeeds([seed as CuratedSpaceSeed])).toThrow(
      "local host is required",
    );
  });

  it("rejects listings assigned to an unknown local host", () => {
    expect(() =>
      validateCuratedSpaceSeeds([
        buildSeed({ hostSlug: "missing-host" } as Partial<CuratedSpaceSeed>),
      ]),
    ).toThrow("Unknown local host slug");
  });
});
