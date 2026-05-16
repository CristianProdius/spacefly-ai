import { afterEach, describe, expect, it, vi } from "vitest";

import { login } from "./auth";

describe("admin auth api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a clear message when the auth service cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(login("admin@spacefly.ai", "admin123")).rejects.toThrow(
      "Unable to reach the authentication service"
    );
  });
});
