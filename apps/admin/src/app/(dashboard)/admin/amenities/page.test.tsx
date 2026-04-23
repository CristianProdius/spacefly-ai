import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("admin amenities page", () => {
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

  it("renders semantic empty and add-form surfaces when no amenities are returned", async () => {
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

    expect(container.textContent).toContain("No amenities found");

    const addButton = container.querySelector('button[data-slot="button"]');
    expect(addButton).not.toBeNull();

    await act(async () => {
      addButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Name");
    expect(container.textContent).toContain("Category (optional)");
    expect(container.querySelector('input[placeholder="e.g. Wi-Fi"]')).not.toBeNull();
    expect(container.querySelector('input[placeholder="e.g. Technology"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(classNames.some((className) => className.includes("border-border/60"))).toBe(
      true
    );
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("border-input"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(false);
    expect(classNames.some((className) => className.includes("bg-gray-50"))).toBe(false);
    expect(classNames.some((className) => className.includes("bg-gray-900"))).toBe(false);
    expect(classNames.some((className) => className.includes("text-gray-500"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-600"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-700"))).toBe(
      false
    );
  });

  it("renders grouped amenity rows with tokenized surfaces and destructive affordances", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "Wi-Fi",
            icon: "W",
            category: "Technology",
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

    expect(container.textContent).toContain("Technology");
    expect(container.textContent).toContain("Wi-Fi");
    expect(container.querySelector('button[aria-label="Delete amenity Wi-Fi"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(classNames.some((className) => className.includes("border-border/60"))).toBe(
      true
    );
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
});
