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
import { cn } from "@/lib/utils";

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

const groupRowClassName =
  "scrollbar-none flex flex-nowrap gap-1 overflow-x-auto rounded-lg bg-subtle p-1";

const categoryRowClassName =
  "scrollbar-none flex gap-2 overflow-x-auto px-1 py-1 sm:flex-wrap sm:overflow-visible";

const groupChipClassName = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted hover:bg-white hover:text-foreground"
  );

const categoryChipClassName = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-white text-muted hover:border-primary/40 hover:text-foreground"
  );

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
  const hasActiveFilter = Boolean(selection.groupSlug || selection.categorySlug);

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
    <div className="mb-6 rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="overflow-hidden sm:overflow-visible">
        <div className={groupRowClassName}>
          <button
            type="button"
            aria-pressed={!selection.groupSlug && !selection.categorySlug}
            onClick={() => pushSelection({})}
            className={groupChipClassName(
              !selection.groupSlug && !selection.categorySlug
            )}
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
                type="button"
                aria-pressed={
                  selection.groupSlug === group.slug && !selection.categorySlug
                }
                onClick={() => pushSelection({ groupSlug: group.slug })}
                className={groupChipClassName(
                  selection.groupSlug === group.slug && !selection.categorySlug
                )}
              >
                <Icon className="size-4" />
                {group.name}
              </button>
            );
          })}
        </div>
      </div>

      {visibleCategories.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="overflow-hidden sm:overflow-visible">
            <div className={categoryRowClassName}>
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
                    type="button"
                    aria-pressed={selection.categorySlug === category.slug}
                    onClick={() =>
                      pushSelection({
                        categorySlug: category.slug,
                        groupSlug: category.groupSlug,
                      })
                    }
                    className={categoryChipClassName(
                      selection.categorySlug === category.slug
                    )}
                  >
                    <Icon className="size-4" />
                    {category.name}
                  </button>
                );
              })}
              {hasActiveFilter ? (
                <button
                  type="button"
                  aria-label="Clear space filters"
                  onClick={() => pushSelection({})}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceCategories;
