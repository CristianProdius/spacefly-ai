import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

describe("admin dashboard page", () => {
  it("uses semantic dashboard surfaces and preserves admin landing semantics", async () => {
    const pageModule = await import("./page");
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain("Platform Dashboard");
    expect(html).toContain("text-muted-foreground");
    expect(html).toContain("<h2");
    expect(html).toContain(">Quick Actions</h2>");
    expect(html).toContain('href="/admin/users"');
    expect(html).toContain('href="/admin/bookings"');
    expect(html).toContain('href="/admin/spaces"');
    expect(html).toContain("lg:grid-cols-4");
    expect(html).toContain("md:grid-cols-3");
    expect(html).toContain("bg-card");

    expect(html).not.toContain("bg-white");
    expect(html).not.toContain("text-gray-500");
    expect(html).not.toContain("hover:bg-gray-50");
  });
});
