import { getTranslations } from "next-intl/server";
import FooterClient from "./FooterClient";
import { getBrowseTaxonomy } from "@/lib/taxonomy.server";
import {
  buildBrowseHref,
  getFeaturedCategories,
  getFeaturedGroups,
} from "@/lib/taxonomy";

const Footer = async () => {
  const t = await getTranslations("footer");
  const taxonomy = await getBrowseTaxonomy();
  const featuredGroups = getFeaturedGroups(taxonomy, 3);
  const featuredCategories = getFeaturedCategories(taxonomy, 3);

  const columns = [
    {
      title: t("explore"),
      links: [
        { href: "/spaces", label: t("browseSpaces") },
        ...featuredGroups.map((group) => ({
          href: buildBrowseHref({ groupSlug: group.slug }),
          label: group.name,
        })),
      ],
    },
    {
      title: t("popularCategories"),
      links: featuredCategories.map((category) => ({
        href: buildBrowseHref({
          categorySlug: category.slug,
          groupSlug: category.groupSlug,
        }),
        label: category.name,
      })),
    },
    {
      title: t("forHosts"),
      links: [
        { href: "/become-host", label: t("becomeAHost") },
        {
          external: true,
          href: (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") + "/host",
          label: t("hostDashboard"),
        },
        {
          external: true,
          href:
            (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") +
            "/host/spaces/new",
          label: t("listYourSpace"),
        },
        {
          external: true,
          href:
            (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") +
            "/host/bookings",
          label: t("hostBookings"),
        },
        {
          external: true,
          href:
            (process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003") +
            "/host/earnings",
          label: t("hostEarnings"),
        },
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

  return (
    <FooterClient
      columns={columns}
      copyright={t("copyright")}
      privacyPolicy={t("privacyPolicy")}
      tagline={t("tagline")}
      termsOfService={t("termsOfService")}
      trustLine={t("trustLine")}
    />
  );
};

export default Footer;
