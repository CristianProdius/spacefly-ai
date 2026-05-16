import assert from "node:assert/strict";
import test from "node:test";

import { getFooterLinkKey } from "./footer-link-key.ts";

test("footer link keys stay unique when links share the same href", () => {
  const links = [
    { href: "/", label: "About" },
    { href: "/", label: "Contact" },
    { href: "/", label: "Terms of Service" },
    { href: "/", label: "Privacy Policy" },
  ];

  const keys = links.map((link, index) =>
    getFooterLinkKey("Company", link, index)
  );

  assert.equal(new Set(keys).size, links.length);
  assert.deepEqual(
    keys.map((key) => key.startsWith("Company-/")),
    [false, false, false, false]
  );
});
