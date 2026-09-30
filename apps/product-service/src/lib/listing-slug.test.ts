import { describe, expect, it } from "vitest";
import { allocateUniqueSlug } from "./listing-slug.js";

describe("allocateUniqueSlug", () => {
  it("returns the base slug when it is free", async () => {
    const slug = await allocateUniqueSlug("Regus Iride", async () => false, "venue");
    expect(slug).toBe("regus-iride");
  });

  it("suffixes -2 when the base slug is taken", async () => {
    const slug = await allocateUniqueSlug(
      "Regus Iride",
      async (candidate) => candidate === "regus-iride",
      "venue",
    );
    expect(slug).toBe("regus-iride-2");
  });
});
