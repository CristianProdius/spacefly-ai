import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("admin auth layout", () => {
  it("provides a shared branded auth shell", async () => {
    const layoutPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "./layout.tsx"
    );

    expect(fs.existsSync(layoutPath)).toBe(true);

    if (!fs.existsSync(layoutPath)) {
      return;
    }

    const modulePath = "./layout.tsx";
    const layoutModule = (await import(
      /* @vite-ignore */ modulePath
    )) as {
      default: (props: {
        children: React.ReactNode;
      }) => Promise<React.ReactNode> | React.ReactNode;
    };

    const element = await layoutModule.default({
      children: <div>Auth child</div>,
    });
    const html = renderToStaticMarkup(<>{element}</>);

    expect(html).toContain("Spacefly.ai home");
    expect(html).toContain("Manage spaces, bookings, and hosts from one place.");
    expect(html).toContain("Auth child");
  });
});
