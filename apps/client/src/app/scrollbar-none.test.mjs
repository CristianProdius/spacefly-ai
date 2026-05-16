import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

test("scrollbar-none utility hides native scrollbars across browsers", () => {
  assert.match(css, /\.scrollbar-none\s*\{/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /\.scrollbar-none::?-webkit-scrollbar\s*\{/);
  assert.match(css, /display:\s*none/);
});
