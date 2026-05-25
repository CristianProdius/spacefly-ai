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
    /href=\{`\/hosts\/\$\{space\.host\.id\}`\}/,
    "Hosted-by section should navigate to the host profile page",
  );
});
