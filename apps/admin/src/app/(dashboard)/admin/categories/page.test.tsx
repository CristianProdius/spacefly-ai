import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
  SheetContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  SheetHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  SheetTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  SheetDescription: ({
    children,
    asChild,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) => {
    void asChild;
    return <div {...props}>{children}</div>;
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("admin categories page", () => {
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
    vi.resetModules();
    mockStore.mockReset();
    mockStore.mockReturnValue({ token: "test-token" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "Meeting Rooms",
            slug: "meeting-rooms",
            description: "Focus and collaboration spaces",
            icon: "M",
          },
        ],
      })
    );

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

  it("renders theme-aware table surfaces and actions after categories load", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Categories");
    expect(container.textContent).toContain("Manage space categories");
    expect(container.textContent).toContain("Meeting Rooms");
    expect(container.textContent).toContain("meeting-rooms");
    expect(container.textContent).toContain("Focus and collaboration spaces");
    expect(container.textContent).toContain("Add Category");
    expect(container.textContent).toContain("Name");
    expect(container.textContent).toContain("Slug");
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector('button[aria-label="Delete category Meeting Rooms"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(classNames.some((className) => className.includes("border-border/60"))).toBe(
      true
    );
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("text-card-foreground"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("hover:bg-accent/30"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("hover:bg-destructive/10"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(false);
    expect(classNames.some((className) => className.includes("bg-gray-50"))).toBe(false);
    expect(classNames.some((className) => className.includes("bg-gray-900"))).toBe(false);
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-red-600"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("hover:bg-red-50"))).toBe(
      false
    );
  });

  it("renders a tokenized empty state when no categories are returned", async () => {
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

    expect(container.textContent).toContain("No categories found");

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(classNames.some((className) => className.includes("border-border/60"))).toBe(
      true
    );
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(false);
    expect(classNames.some((className) => className.includes("bg-gray-50"))).toBe(false);
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
  });
});
