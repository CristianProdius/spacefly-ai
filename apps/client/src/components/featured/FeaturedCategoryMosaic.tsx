"use client";

import { Space } from "@repo/types";
import {
  Building2,
  DoorOpen,
  Heart,
  LayoutGrid,
  PartyPopper,
  Store,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay, compactPriceLabels } from "@/lib/utils";
import { useState } from "react";
import { deriveTaxonomyFromSpaces, getTaxonomyIconKey } from "@/lib/taxonomy";

type FeaturedSpace = Space & {
  category?: {
    group?: {
      name?: string | null;
      slug?: string | null;
    } | null;
    groupSlug?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  categorySlug?: string | null;
};

const gradients = [
  "from-amber-500/80 to-orange-600/80",
  "from-blue-500/80 to-indigo-600/80",
  "from-emerald-500/80 to-teal-600/80",
  "from-rose-500/80 to-pink-600/80",
  "from-cyan-500/80 to-sky-600/80",
  "from-fuchsia-500/80 to-violet-600/80",
];

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

export default function FeaturedCategoryMosaic({
  spaces,
}: {
  spaces: FeaturedSpace[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const taxonomy = deriveTaxonomyFromSpaces(spaces);

  const getSpacesForCategory = (categorySlug: string) =>
    spaces.filter(
      (space) =>
        (space.category?.slug || space.categorySlug || "").toLowerCase() === categorySlug
    );

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Browse by Category
        </h2>
        <p className="text-muted text-sm mb-8">
          Click a category to preview available spaces
        </p>

        {/* Category tiles grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {taxonomy.categories.map((category, index) => {
            const isExpanded = expanded === category.slug;
            const categorySpaces = getSpacesForCategory(category.slug);
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
            const gradient = gradients[index % gradients.length];

            return (
              <div key={category.slug}>
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : category.slug)
                  }
                  className={cn(
                    "w-full group relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300",
                    isExpanded && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {/* Atmospheric background */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      gradient
                    )}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                  {/* Icon + label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                    <Icon className="w-8 h-8" />
                    <span className="font-semibold text-sm text-center px-3">
                      {category.name}
                    </span>
                    <span className="text-white/70 text-xs">
                      {categorySpaces.length} space
                      {categorySpaces.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Expand indicator */}
                  <div className="absolute bottom-2 right-2 text-white/60">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Inline expandable preview panel */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-60 mt-3 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {categorySpaces.length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">
                      No spaces in this category yet.
                    </p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {categorySpaces.map((space) => {
                        const images = parseImages(space.images);
                        return (
                          <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            className="shrink-0 w-[200px] group/card"
                          >
                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                              <Image
                                src={images[0] || "/placeholder-space.jpg"}
                                alt={space.name}
                                fill
                                className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="mt-1.5">
                              <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                                {space.name}
                              </h4>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs text-muted">
                                  {space.city}
                                </span>
                                <span className="text-xs font-semibold text-foreground">
                                  {getPriceDisplay(space, compactPriceLabels)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
