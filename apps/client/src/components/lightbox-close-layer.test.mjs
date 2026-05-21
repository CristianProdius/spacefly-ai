import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./Lightbox.tsx", import.meta.url), "utf8");

test("lightbox close control stays above the image interaction layer", () => {
  const closeMatch = source.match(
    /<Dialog\.Close[^>]*className="([^"]+)"[^>]*>/
  );

  assert.ok(closeMatch, "Lightbox should render a Dialog.Close control");
  assert.match(closeMatch[1], /\bz-\d+\b/);
});
