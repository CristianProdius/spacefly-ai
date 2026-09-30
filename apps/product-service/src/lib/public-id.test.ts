import { describe, expect, it } from "vitest";
import { publicLookupWhere } from "./public-id.js";

describe("publicLookupWhere", () => {
  it("treats digit-only params as numeric ids", () => {
    expect(publicLookupWhere("23")).toEqual({ id: 23 });
  });

  it("treats non-numeric params as slugs", () => {
    expect(publicLookupWhere("regus-iride-business-centre")).toEqual({
      slug: "regus-iride-business-centre",
    });
  });

  it("rejects empty params", () => {
    expect(publicLookupWhere("")).toBeNull();
    expect(publicLookupWhere(undefined)).toBeNull();
  });
});
