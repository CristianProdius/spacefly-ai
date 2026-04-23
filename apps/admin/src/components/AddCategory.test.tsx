import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
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

vi.mock("@/components/ui/sheet", () => ({
  SheetContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div data-slot="sheet-content" className={className}>{children}</div>,
  SheetHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div data-slot="sheet-header" className={className}>{children}</div>,
  SheetTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
  SheetDescription: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div>{children}</div>,
}));

describe("add category sheet", () => {
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
    mockStore.mockReturnValue({ getToken: vi.fn() });
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

  it("renders a tokenized category form panel", async () => {
    const componentModule = await import("./AddCategory");

    await act(async () => {
      root.render(React.createElement(componentModule.default));
    });

    expect(container.textContent).toContain("Add Category");
    expect(container.textContent).toContain("Name");
    expect(container.textContent).toContain("Slug");
    expect(container.querySelector('[data-slot="sheet-content"]')).not.toBeNull();
    expect(container.querySelector("input")).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain(
      "Submit"
    );

    const sheetContent = container.querySelector('[data-slot="sheet-content"]');
    expect(sheetContent?.className).toContain("bg-background");
    expect(sheetContent?.className).toContain("border-border/60");

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("border-input"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("text-muted-foreground"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-600"))).toBe(
      false
    );
  });
});
