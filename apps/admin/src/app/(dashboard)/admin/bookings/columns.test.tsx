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

describe("admin booking columns", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
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

  it("shows the related space, guest, and host so admins can separate bookings", async () => {
    const booking = {
      currency: "MDL",
      guest: { email: "guest@example.com", id: "guest-1", name: "Guest User" },
      guestId: "guest-1",
      host: { email: "host@example.com", id: "host-1", name: "Host User" },
      hostId: "host-1",
      id: "booking-1",
      space: { id: 14, name: "Conference room" },
      spaceId: 14,
      totalAmount: 4950,
    };

    const cells = ["space", "guest", "host"].map((columnId) => {
      const column = columns.find((item) => item.id === columnId);
      expect(column?.cell).toBeTypeOf("function");

      const cell = column?.cell as (context: unknown) => React.ReactNode;
      return <React.Fragment key={columnId}>{cell({ row: { original: booking } })}</React.Fragment>;
    });

    await act(async () => {
      root.render(<>{cells}</>);
    });

    expect(container.textContent).toContain("Conference room");
    expect(container.textContent).toContain("Guest User");
    expect(container.textContent).toContain("Host User");
  });
});
