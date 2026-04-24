"use client";

import { Link } from "@/i18n/navigation";
import { Instagram, Facebook, Linkedin, Twitter, ChevronDown } from "lucide-react";
import { Accordion } from "@base-ui/react/accordion";
import { cn } from "@/lib/utils";

interface FooterColumnLink {
  external?: boolean;
  href: string;
  label: string;
}

interface FooterColumn {
  links: FooterColumnLink[];
  title: string;
}

interface FooterClientProps {
  columns: FooterColumn[];
  copyright: string;
  privacyPolicy: string;
  tagline: string;
  termsOfService: string;
  trustLine: string;
}

const FooterClient = ({
  columns,
  copyright,
  privacyPolicy,
  tagline,
  termsOfService,
  trustLine,
}: FooterClientProps) => {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="text-lg font-extrabold tracking-widest text-foreground"
            >
              Spacefly.ai
            </Link>
            <p className="text-sm text-muted mt-1 text-pretty">{tagline}</p>
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

        <div className="hidden md:grid md:grid-cols-4 rounded-xl border border-border overflow-hidden">
          {columns.map((column, index) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className={cn("p-6", index > 0 && "border-l border-border")}
            >
              <p className="text-sm font-semibold text-foreground mb-4">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    {link.external ? (
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
                        <li key={`${column.title}-${link.href}`}>
                          {link.external ? (
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted text-pretty">{trustLine}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>{copyright}</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              {termsOfService}
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              {privacyPolicy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterClient;
