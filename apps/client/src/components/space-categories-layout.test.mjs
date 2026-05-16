import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SpaceCategories.tsx", import.meta.url), "utf8");

const getClassValue = (name) => {
  const match = source.match(
    new RegExp(`const ${name} =\\n  "([^"]+)";`)
  );

  assert.ok(match, `${name} should be declared as a class string`);
  return match[1];
};

test("space category group filters stay on one line", () => {
  const groupRowClassName = getClassValue("groupRowClassName");

  assert.match(groupRowClassName, /flex-nowrap/);
  assert.doesNotMatch(groupRowClassName, /sm:flex-wrap/);
});

test("space category refinements can wrap on larger screens", () => {
  const categoryRowClassName = getClassValue("categoryRowClassName");

  assert.match(categoryRowClassName, /sm:overflow-visible/);
  assert.match(categoryRowClassName, /sm:flex-wrap/);
  assert.doesNotMatch(source, /ScrollEdgeFade|bg-gradient-to-l/);
});

test("space category groups use a lighter segmented row than refinements", () => {
  assert.match(source, /groupRowClassName/);
  assert.match(source, /categoryRowClassName/);
  assert.match(source, /groupChipClassName/);
  assert.match(source, /categoryChipClassName/);
  assert.doesNotMatch(source, /shadow-layered/);
});

test("space category filters expose a clear action only when filtered", () => {
  assert.match(source, /hasActiveFilter/);
  assert.match(source, /pushSelection\(\{\}\)/);
  assert.match(source, /aria-label="Clear space filters"/);
});

test("space category filter buttons expose pressed state", () => {
  assert.match(source, /type="button"/);
  assert.match(source, /aria-pressed=/);
});
