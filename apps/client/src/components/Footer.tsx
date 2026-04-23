"use client";

import { Link } from "@/i18n/navigation";
import { Instagram, Facebook, Linkedin, Twitter, ChevronDown } from "lucide-react";
import { Accordion } from "@base-ui/react/accordion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const Footer = () => {
  const t = useTranslations("footer");

  const columns = [
    {
      title: t("explore"),
      links: [
        { href: "/spaces", label: t("browseSpaces") },
        { href: "/spaces?type=MEETING_ROOM", label: t("meetingRooms") },
        { href: "/spaces?type=COWORKING_SPACE", label: t("coworking") },
        { href: "/spaces?type=EVENT_VENUE", label: t("eventVenues") },
      ],
    },
    {
      title: t("spaceTypes"),
      links: [
        { href: "/spaces?type=OFFICE_DESK", label: t("officeDesks") },
        { href: "/spaces?type=PRIVATE_OFFICE", label: t("privateOffices") },
        { href: "/spaces?type=WEDDING_VENUE", label: t("weddingVenues") },
      ],
    },
    {
      title: t("forHosts"),
      links: [
        { href: "/become-host", label: t("becomeAHost") },
        { href: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") + "/host", label: t("hostDashboard"), external: true },
        { href: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") + "/host/spaces/new", label: t("listYourSpace"), external: true },
        { href: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") + "/host/bookings", label: t("hostBookings"), external: true },
        { href: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") + "/host/earnings", label: t("hostEarnings"), external: true },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/", label: t("about") },
        { href: "/", label: t("contact") },
        { href: "/", label: t("termsOfService") },
        { href: "/", label: t("privacyPolicy") },
      ],
    },
  ];

  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Brand + socials row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="text-lg font-extrabold tracking-widest text-foreground"
            >
              Spacefly.ai
            </Link>
            <p className="text-sm text-muted mt-1 text-pretty">
              {t("tagline")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-muted hover:text-primary transition-colors"
              >
                <social.icon className="size-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Desktop: bordered grid cells */}
        <div className="hidden md:grid md:grid-cols-4 rounded-xl border border-border overflow-hidden">
          {columns.map((column, i) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className={cn("p-6", i > 0 && "border-l border-border")}
            >
              <p className="text-sm font-semibold text-foreground mb-4">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted hover:text-primary transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden">
          <Accordion.Root>
            {columns.map((column) => (
              <Accordion.Item key={column.title} className="border-t border-border">
                <Accordion.Header>
                  <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-sm font-semibold text-foreground cursor-pointer">
                    {column.title}
                    <ChevronDown className="size-4 text-muted transition-transform data-[panel-open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>
                  <nav aria-label={column.title}>
                    <ul className="pb-3 space-y-2">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          {"external" in link && link.external ? (
                            <a
                              href={link.href}
                              className="text-sm text-muted hover:text-primary transition-colors"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="text-sm text-muted hover:text-primary transition-colors"
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Trust + copyright bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted text-pretty">{t("trustLine")}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>{t("copyright")}</span>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
