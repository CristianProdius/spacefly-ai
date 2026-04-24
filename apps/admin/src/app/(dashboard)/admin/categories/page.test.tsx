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
            categories: [
              {
                _count: { spaces: 4 },
                groupSlug: "business-office",
                id: 1,
                name: "Meeting & Training Room",
                slug: "meeting-training-room",
                sortOrder: 3,
              },
            ],
            name: "Business & Office",
            slug: "business-office",
            sortOrder: 1,
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
    expect(container.textContent).toContain("Manage grouped space categories");
    expect(container.textContent).toContain("Business & Office");
    expect(container.textContent).toContain("business-office");
    expect(container.textContent).toContain("Meeting & Training Room");
    expect(container.textContent).toContain("meeting-training-room");
    expect(container.textContent).toContain("Add Category");
    expect(container.textContent).toContain("Category");
    expect(container.textContent).toContain("Slug");
    expect(container.textContent).toContain("Spaces");
    expect(container.querySelector("table")).not.toBeNull();
    expect(
      container.querySelector(
        'button[aria-label="Delete category Meeting & Training Room"]'
      )
    ).not.toBeNull();

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

    expect(container.textContent).toContain("No categories yet");
    expect(container.textContent).toContain("Business & Office");

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

  it("normalizes flat category payloads with embedded group metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            _count: { spaces: 2 },
            group: {
              name: "Retail & Commercial",
              slug: "retail-commercial",
              sortOrder: 4,
            },
            groupSlug: "retail-commercial",
            id: 17,
            name: "Retail Store / Shop Front",
            slug: "retail-store-shop-front",
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

    expect(container.textContent).toContain("Retail & Commercial");
    expect(container.textContent).toContain("retail-commercial");
    expect(container.textContent).toContain("Retail Store / Shop Front");
  });
});
