"use client";

import { Space, SpaceType } from "@repo/types";
import {
  Building2,
  DoorOpen,
  Users,
  PartyPopper,
  Heart,
  LayoutGrid,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay, compactPriceLabels } from "@/lib/utils";
import { useState } from "react";

const categoryTiles: {
  label: string;
  value: SpaceType;
  icon: React.ReactNode;
  gradient: string;
}[] = [
  {
    label: "Office Desks",
    value: "OFFICE_DESK",
    icon: <LayoutGrid className="w-8 h-8" />,
    gradient: "from-amber-500/80 to-orange-600/80",
  },
  {
    label: "Private Offices",
    value: "PRIVATE_OFFICE",
    icon: <DoorOpen className="w-8 h-8" />,
    gradient: "from-blue-500/80 to-indigo-600/80",
  },
  {
    label: "Meeting Rooms",
    value: "MEETING_ROOM",
    icon: <Users className="w-8 h-8" />,
    gradient: "from-emerald-500/80 to-teal-600/80",
  },
  {
    label: "Event Venues",
    value: "EVENT_VENUE",
    icon: <PartyPopper className="w-8 h-8" />,
    gradient: "from-purple-500/80 to-violet-600/80",
  },
  {
    label: "Wedding Venues",
    value: "WEDDING_VENUE",
    icon: <Heart className="w-8 h-8" />,
    gradient: "from-pink-500/80 to-rose-600/80",
  },
  {
    label: "Coworking",
    value: "COWORKING_SPACE",
    icon: <Building2 className="w-8 h-8" />,
    gradient: "from-cyan-500/80 to-sky-600/80",
  },
];

export default function FeaturedCategoryMosaic({
  spaces,
}: {
  spaces: Space[];
}) {
  const [expanded, setExpanded] = useState<SpaceType | null>(null);

  const getSpacesForCategory = (type: SpaceType) =>
    spaces.filter((s) => s.spaceType === type);

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
          {categoryTiles.map((cat) => {
            const isExpanded = expanded === cat.value;
            const categorySpaces = getSpacesForCategory(cat.value);

            return (
              <div key={cat.value}>
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : cat.value)
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
                      cat.gradient
                    )}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                  {/* Icon + label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                    {cat.icon}
                    <span className="font-semibold text-sm">{cat.label}</span>
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
