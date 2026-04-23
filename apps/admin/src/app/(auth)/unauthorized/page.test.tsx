import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("@/stores/authStore", () => ({
  default: () => ({
    logout,
  }),
}));

describe("admin unauthorized page", () => {
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
    push.mockReset();
    logout.mockReset();
    logout.mockResolvedValue(undefined);
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

  it("signs out and returns to login", async () => {
    const pageModule = await import("./page");

    await act(async () => {
      root.render(React.createElement(pageModule.default));
    });

    const button = container.querySelector("button");

    expect(button).not.toBeNull();

    if (!button) {
      return;
    }

    await act(async () => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(logout).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("renders the branded no-access recovery surface", async () => {
    const pageModule = await import("./page");
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain("You do not have access to this dashboard");
    expect(html).toContain("Your account is signed in, but it does not have permission to open this workspace.");
    expect(html).toContain("Sign out and return to login");
  });
});
