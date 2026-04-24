import {
  Building2,
  DoorOpen,
  Heart,
  LayoutGrid,
  PartyPopper,
  Store,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getBrowseTaxonomy } from "@/lib/taxonomy.server";
import {
  buildBrowseHref,
  getFeaturedCategories,
  getTaxonomyIconKey,
} from "@/lib/taxonomy";

const taxonomyIcons = {
  all: LayoutGrid,
  building: Building2,
  door: DoorOpen,
  grid: LayoutGrid,
  heart: Heart,
  party: PartyPopper,
  store: Store,
  users: Users,
} as const;

const SpaceTypeShowcase = async () => {
  const t = await getTranslations("home");
  const taxonomy = await getBrowseTaxonomy();
  const featuredCategories = getFeaturedCategories(taxonomy);

  if (featuredCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-8">
          {t("spaceTypeTitle")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          {featuredCategories.map((category) => {
            const Icon =
              taxonomyIcons[
                getTaxonomyIconKey({
                  groupName: category.group.name,
                  groupSlug: category.groupSlug,
                  icon: category.icon,
                  name: category.name,
                  slug: category.slug,
                })
              ];

            return (
              <Link
                key={category.slug}
                href={buildBrowseHref({
                  categorySlug: category.slug,
                  groupSlug: category.groupSlug,
                })}
                className="group flex flex-col items-center gap-2.5 shrink-0 w-28 sm:w-auto sm:flex-1 py-4 px-3 rounded-xl hover:bg-subtle transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground whitespace-nowrap">
                    {category.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {category.group.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpaceTypeShowcase;
