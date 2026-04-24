"use client";

import {
  Building2,
  DoorOpen,
  Grid3X3,
  Heart,
  LayoutGrid,
  PartyPopper,
  Store,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  getFeaturedCategories,
  getTaxonomyIconKey,
  type BrowseSelection,
  type BrowseTaxonomy,
  withBrowseSelection,
} from "@/lib/taxonomy";

const taxonomyIcons = {
  all: Grid3X3,
  building: Building2,
  door: DoorOpen,
  grid: LayoutGrid,
  heart: Heart,
  party: PartyPopper,
  store: Store,
  users: Users,
} as const;

interface SpaceCategoriesProps {
  selection: BrowseSelection;
  taxonomy: BrowseTaxonomy;
}

const SpaceCategories = ({ selection, taxonomy }: SpaceCategoriesProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("spaces");

  const visibleCategories = selection.groupSlug
    ? taxonomy.groups.find((group) => group.slug === selection.groupSlug)?.categories ?? []
    : getFeaturedCategories(taxonomy, 8);

  const pushSelection = (nextSelection: BrowseSelection) => {
    const nextParams = withBrowseSelection(
      new URLSearchParams(searchParams.toString()),
      nextSelection
    );
    const query = nextParams.toString();
    const href = (query ? `${pathname}?${query}` : pathname) as Parameters<
      typeof router.push
    >[0];

    router.push(href, {
      scroll: false,
    });
  };

  if (taxonomy.groups.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-0.5 pb-1">
          <button
            onClick={() => pushSelection({})}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
              !selection.groupSlug && !selection.categorySlug
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "bg-white text-muted border border-border hover:border-primary/30"
            }`}
          >
            <Grid3X3 className="size-4" />
            {t("allSpaces")}
          </button>

          {taxonomy.groups.map((group) => {
            const Icon = taxonomyIcons[
              getTaxonomyIconKey({
                groupName: group.name,
                groupSlug: group.slug,
                name: group.name,
                slug: group.slug,
              })
            ];

            return (
              <button
                key={group.slug}
                onClick={() => pushSelection({ groupSlug: group.slug })}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                  selection.groupSlug === group.slug && !selection.categorySlug
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-white text-muted border border-border hover:border-primary/30"
                }`}
              >
                <Icon className="size-4" />
                {group.name}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>

      {visibleCategories.length > 0 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-0.5 pb-1">
            {visibleCategories.map((category) => {
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
                <button
                  key={category.slug}
                  onClick={() =>
                    pushSelection({
                      categorySlug: category.slug,
                      groupSlug: category.groupSlug,
                    })
                  }
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                    selection.categorySlug === category.slug
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-white text-muted border border-border hover:border-primary/30"
                  }`}
                >
                  <Icon className="size-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
        </div>
      )}
    </div>
  );
};

export default SpaceCategories;
