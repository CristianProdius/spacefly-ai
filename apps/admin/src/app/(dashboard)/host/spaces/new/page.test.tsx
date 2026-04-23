/* eslint-disable @next/next/no-img-element */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();
const push = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

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

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    fill?: boolean;
  }) => {
    void fill;
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe("host new space page", () => {
  let container: HTMLDivElement;
  let root: Root;

  const setInputValue = (
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string
  ) => {
    const prototype = Object.getPrototypeOf(input) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

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
    mockStore.mockReturnValue({ token: "test-token" });
    push.mockReset();

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: "Meeting Spaces", slug: "meeting-spaces" }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
            { id: 2, name: "Projector", icon: null, category: "Equipment" },
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

  it("uses semantic dashboard surfaces for the host space form", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Create New Space");
    expect(container.textContent).toContain("Fill in the details to list your space");
    expect(container.textContent).toContain("Basic Information");
    expect(container.textContent).toContain("Images");
    expect(container.textContent).toContain("Location");
    expect(container.textContent).toContain("Pricing");
    expect(container.textContent).toContain("Amenities");
    expect(container.textContent).toContain("Settings");
    expect(container.textContent).toContain("Enable instant booking");
    expect(container.querySelector('a[href="/host/spaces"]')?.textContent).toContain(
      "Back to Spaces"
    );
    expect(container.querySelector('button[type="submit"]')?.textContent).toContain(
      "Create Space"
    );
    expect(container.querySelector('label input[type="file"]')).not.toBeNull();

    const classNames = getClassNames();
    expect(classNames.some((className) => className.includes("bg-card"))).toBe(true);
    expect(
      classNames.some((className) => className.includes("border-border/60"))
    ).toBe(true);
    expect(
      classNames.some((className) => className.includes("text-muted-foreground"))
    ).toBe(true);
    expect(classNames.some((className) => className.includes("border-input"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("focus:ring-ring/50"))).toBe(
      true
    );
    expect(classNames.some((className) => className.includes("bg-white"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-600"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-700"))).toBe(
      false
    );
    expect(classNames.some((className) => className.includes("text-gray-900"))).toBe(
      false
    );
    expect(
      classNames.some((className) => className.includes("border-gray-200"))
    ).toBe(false);
    expect(
      classNames.some((className) => className.includes("hover:bg-gray-50"))
    ).toBe(false);
  });

  it("shows upload errors and tokenized selected amenity/toggle surfaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: "Meeting Spaces", slug: "meeting-spaces" }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
          ],
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Upload failed" }),
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

    const amenityButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Wi-Fi")
    ) as HTMLButtonElement | undefined;
    const instantBook = container.querySelector("#instantBook") as
      | HTMLInputElement
      | null;
    const fileInput = container.querySelector('input[type="file"]') as
      | HTMLInputElement
      | null;

    expect(amenityButton).toBeDefined();
    expect(instantBook).not.toBeNull();
    expect(fileInput).not.toBeNull();

    await act(async () => {
      amenityButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      instantBook?.click();
    });

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [new File(["x"], "space.png", { type: "image/png" })],
      });

      await act(async () => {
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(amenityButton?.className).toContain("bg-primary/10");
    expect(amenityButton?.className).toContain("text-primary");
    expect(instantBook?.checked).toBe(true);
    expect(container.textContent).toContain("Upload failed");

    const uploadError = Array.from(container.querySelectorAll("p")).find((node) =>
      node.textContent?.includes("Upload failed")
    );
    const instantBookRow = instantBook?.closest("div.rounded-lg");
    expect(uploadError?.className).toContain("bg-destructive/10");
    expect(uploadError?.className).toContain("text-destructive");
    expect(instantBookRow?.className).toContain("border-border/60");
    expect(instantBookRow?.className).toContain("bg-accent/20");
  });

  it("renders uploaded image controls and a tokenized top-level submit error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: "Meeting Spaces", slug: "meeting-spaces" }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: "Wi-Fi", icon: null, category: "Connectivity" },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "/uploaded-space.png" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Creation failed" }),
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

    const fileInput = container.querySelector('input[type="file"]') as
      | HTMLInputElement
      | null;

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [new File(["x"], "space.png", { type: "image/png" })],
      });

      await act(async () => {
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    const nameInput = container.querySelector(
      'input[placeholder="e.g. Modern Downtown Meeting Room"]'
    ) as HTMLInputElement | null;
    const shortDescriptionInput = container.querySelector(
      'input[placeholder="Brief description for search results"]'
    ) as HTMLInputElement | null;
    const descriptionInput = container.querySelector(
      'textarea[placeholder="Detailed description of your space"]'
    ) as HTMLTextAreaElement | null;
    const capacityInput = container.querySelector(
      'input[placeholder="Maximum number of people"]'
    ) as HTMLInputElement | null;
    const addressInput = container.querySelector(
      'input[placeholder="Street address"]'
    ) as HTMLInputElement | null;
    const countryInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "Country"
    ) as HTMLInputElement | undefined;
    const hourlyInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "Price Per Hour"
    ) as HTMLInputElement | undefined;
    const dailyInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "Price Per Day"
    ) as HTMLInputElement | undefined;
    const categorySelect = Array.from(container.querySelectorAll("select")).find(
      (select) => select.textContent?.includes("Select a category")
    ) as HTMLSelectElement | undefined;
    const cityInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.previousElementSibling?.textContent === "City"
    ) as HTMLInputElement | undefined;
    const form = container.querySelector("form");

    expect(container.querySelector('button[aria-label="Remove image 1"]')).not.toBeNull();

    if (
      nameInput &&
      shortDescriptionInput &&
      descriptionInput &&
      capacityInput &&
      addressInput &&
      cityInput &&
      countryInput &&
      hourlyInput &&
      dailyInput &&
      categorySelect &&
      form
    ) {
      await act(async () => {
        setInputValue(nameInput, "Sunset Studio");
        setInputValue(shortDescriptionInput, "A bright studio for workshops");
        setInputValue(
          descriptionInput,
          "A bright studio for workshops and events with plenty of natural light."
        );
        setInputValue(categorySelect, "meeting-spaces");
        setInputValue(capacityInput, "8");
        setInputValue(addressInput, "Main Street 1");
        setInputValue(cityInput, "Chisinau");
        setInputValue(countryInput, "Moldova");
        setInputValue(hourlyInput, "25");
        setInputValue(dailyInput, "120");
      });

      await act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(container.textContent).toContain("Creation failed");

    const topLevelError = Array.from(container.querySelectorAll("div")).find(
      (node) =>
        node.textContent?.trim() === "Creation failed" &&
        node.className.includes("bg-destructive/10")
    );
    expect(topLevelError?.className).toContain("bg-destructive/10");
    expect(topLevelError?.className).toContain("text-destructive");
    expect(container.querySelector('button[type="submit"]')?.className).toContain(
      "bg-primary"
    );
    expect(container.querySelector('a[href="/host/spaces"]')?.className).toContain(
      "hover:bg-accent"
    );
  });
});
