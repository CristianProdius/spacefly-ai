import { describe, expect, it } from "vitest";

import {
  normalizeCategoryGroups,
  resolveLegacySpaceType,
  type TaxonomyApiResponse,
} from "./taxonomy";

describe("taxonomy helpers", () => {
  it("normalizes flat categories with embedded group metadata into grouped sections", () => {
    const response = [
      {
        group: {
          name: "Retail & Commercial",
          slug: "retail-commercial",
          sortOrder: 4,
        },
        groupSlug: "retail-commercial",
        id: 17,
        name: "Retail Store / Shop Front",
        slug: "retail-store-shop-front",
        sortOrder: 1,
      },
      {
        group: {
          name: "Business & Office",
          slug: "business-office",
          sortOrder: 1,
        },
        groupSlug: "business-office",
        id: 3,
        name: "Meeting & Training Room",
        slug: "meeting-training-room",
        sortOrder: 3,
      },
    ] satisfies TaxonomyApiResponse;

    const groups = normalizeCategoryGroups(response);

    expect(groups.map((group) => group.slug)).toEqual([
      "business-office",
      "events-celebrations",
      "creative-media",
      "retail-commercial",
      "sports-wellness",
      "industrial-logistics",
    ]);
    expect(groups[0]).toMatchObject({
      name: "Business & Office",
      slug: "business-office",
    });
    expect(groups[0]?.categories).toEqual([
      expect.objectContaining({
        groupSlug: "business-office",
        name: "Meeting & Training Room",
        slug: "meeting-training-room",
      }),
    ]);
    expect(groups[3]).toMatchObject({
      name: "Retail & Commercial",
      slug: "retail-commercial",
    });
    expect(groups[3]?.categories).toEqual([
      expect.objectContaining({
        groupSlug: "retail-commercial",
        slug: "retail-store-shop-front",
      }),
    ]);
  });

  it("derives the legacy space type from taxonomy metadata when available and falls back to slug aliases", () => {
    expect(
      resolveLegacySpaceType(
        {
          legacySpaceType: "MEETING_ROOM",
          slug: "meeting-training-room",
        },
        "EVENT_VENUE"
      )
    ).toBe("MEETING_ROOM");

    expect(
      resolveLegacySpaceType(
        {
          slug: "retail-store-shop-front",
        },
        "MEETING_ROOM"
      )
    ).toBe("PRIVATE_OFFICE");
  });
});
