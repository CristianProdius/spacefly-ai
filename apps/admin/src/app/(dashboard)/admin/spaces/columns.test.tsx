import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { columns } from "./columns";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("admin spaces columns", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
        PointerEvent?: typeof MouseEvent;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    if (!globalThis.PointerEvent) {
      globalThis.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
    }
  });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("exposes the admin edit entrypoint from the row actions menu", async () => {
    const actionsColumn = columns.find((column) => column.id === "actions");

    expect(actionsColumn?.cell).toBeTypeOf("function");

    const cell = actionsColumn?.cell as (context: unknown) => React.ReactNode;

    await act(async () => {
      root.render(
        <>{cell({
          row: {
            original: {
              id: 42,
              name: "Riverside Loft",
            },
          },
        })}</>
      );
    });

    const menuButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Open menu")
    );

    expect(menuButton).toBeDefined();

    await act(async () => {
      menuButton?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0 })
      );
      menuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const editLink = document.querySelector(
      'a[href="/admin/spaces/42/edit"]'
    ) as HTMLAnchorElement | null;

    expect(editLink).not.toBeNull();
    expect(editLink?.textContent).toContain("Edit space");
  });
});
