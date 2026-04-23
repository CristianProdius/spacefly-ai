/* eslint-disable @next/next/no-img-element */
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();
const mockSearchParams = {
  get: vi.fn(),
};

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    fill?: boolean;
  }) => {
    void fill;
    return <img alt={alt} src={src} {...props} />;
  },
}));

describe("host bookings page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const getClassNames = () =>
    Array.from(container.querySelectorAll<HTMLElement>("*"))
      .map((element) => element.className)
      .filter((className): className is string => typeof className === "string");

  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    mockStore.mockReset();
    mockStore.mockReturnValue({
      token: "test-token",
    });
    mockSearchParams.get.mockReset();
    mockSearchParams.get.mockReturnValue(null);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.unstubAllGlobals();
    container.remove();
  });

  it("renders a theme-aware empty state when there are no bookings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Bookings");
    expect(container.textContent).toContain("No bookings found");
    expect(container.querySelectorAll("a").length).toBe(0);

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("border-dashed"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-accent/20"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-gray-50"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
  });

  it("renders readable status filters and action buttons without light-only classes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "pending-1",
            spaceId: 1,
            status: "PENDING",
            startDate: "2099-02-01T10:00:00.000Z",
            endDate: "2099-02-01T10:00:00.000Z",
            startTime: "10:00",
            endTime: "12:00",
            guests: 4,
            isHourly: true,
            totalAmount: 120,
            createdAt: "2099-01-01T12:00:00.000Z",
            space: {
              id: 1,
              name: "Studio One",
              images: ["/studio-one.jpg"],
            },
            guest: {
              id: "guest-1",
              name: "Alex",
              email: "alex@example.com",
              image: null,
            },
          },
          {
            id: "confirmed-1",
            spaceId: 2,
            status: "CONFIRMED",
            startDate: "2099-02-02T10:00:00.000Z",
            endDate: "2099-02-03T10:00:00.000Z",
            startTime: null,
            endTime: null,
            guests: 8,
            isHourly: false,
            totalAmount: 240,
            createdAt: "2099-01-01T12:00:00.000Z",
            space: {
              id: 2,
              name: "Gallery Hall",
              images: ["/gallery-hall.jpg"],
            },
            guest: {
              id: "guest-2",
              name: "Jamie",
              email: "jamie@example.com",
              image: null,
            },
          },
        ],
      })
    );

    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("pending your review");
    expect(container.textContent).toContain("Approve");
    expect(container.textContent).toContain("Reject");
    expect(container.textContent).toContain("Mark as Completed");

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-accent"))).toBe(
      true
    );
    expect(
      classNames.some((className) => className.includes("text-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("bg-gradient-to-r"))
    ).toBe(false);
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("border-gray-200"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
  });
});
