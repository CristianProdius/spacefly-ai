import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./[locale]/(main)/spaces/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("space detail host section links to the host profile", () => {
  assert.match(
    source,
    // Slug URL (/hosts/<username>) via the shared helper, not the raw CUID.
    /href=\{hostProfileHref\(space\.host\)\}/,
    "Hosted-by section should navigate to the host profile page",
  );
});
