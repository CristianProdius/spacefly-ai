import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockStore = vi.fn();
const mockPush = vi.fn();

vi.mock("@/stores/authStore", () => ({
  default: () => mockStore(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("host layout", () => {
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
    mockStore.mockReset();
    mockPush.mockReset();
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

  it("renders a theme-aware loading spinner while auth state is loading", async () => {
    mockStore.mockReturnValue({
      isAuthenticated: false,
      isHostOrAdmin: false,
      isLoading: true,
    });

    const layoutModule = await import("./layout");

    await act(async () => {
      root.render(
        React.createElement(
          layoutModule.default,
          null,
          React.createElement("div", null, "content")
        )
      );
    });

    expect(container.textContent).not.toContain("content");
    expect(container.innerHTML).toContain("border-t-primary");
    expect(container.innerHTML).toContain("border-border/60");
    expect(container.innerHTML).not.toContain("border-gray-900");
  });
});
