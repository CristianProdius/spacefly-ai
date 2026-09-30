import { describe, expect, it } from "vitest";
import { reorderImages } from "./image-gallery-field.shared";

describe("reorderImages", () => {
  it("moves a later photo to the cover slot", () => {
    expect(reorderImages(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("moves a photo one slot to the left or right", () => {
    expect(reorderImages(["a", "b", "c"], 1, 0)).toEqual(["b", "a", "c"]);
    expect(reorderImages(["a", "b", "c"], 1, 2)).toEqual(["a", "c", "b"]);
  });

  it("leaves the list unchanged for invalid indexes", () => {
    expect(reorderImages(["a", "b"], 0, 0)).toEqual(["a", "b"]);
    expect(reorderImages(["a", "b"], -1, 1)).toEqual(["a", "b"]);
  });
});
