"use client";

import { Space, SpaceType } from "@repo/types";
import { Star } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay } from "@/lib/utils";
import { useState, useRef } from "react";

const categories: { label: string; value: string }[] = [
  { label: "All Spaces", value: "all" },
  { label: "Office Desks", value: "OFFICE_DESK" },
  { label: "Private Offices", value: "PRIVATE_OFFICE" },
  { label: "Meeting Rooms", value: "MEETING_ROOM" },
  { label: "Event Venues", value: "EVENT_VENUE" },
  { label: "Wedding Venues", value: "WEDDING_VENUE" },
  { label: "Coworking", value: "COWORKING_SPACE" },
];

export default function FeaturedTabbedCarousel({
  spaces,
}: {
  spaces: Space[];
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeCategory === "all"
      ? spaces
      : spaces.filter((s) => s.spaceType === activeCategory);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Browse by Category
        </h2>

        {/* Tabs with animated underline */}
        <div className="flex gap-6 overflow-x-auto scrollbar-none border-b border-border mb-8 pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
                scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
              }}
              className={cn(
                "pb-3 text-sm font-medium whitespace-nowrap transition-colors relative shrink-0",
                activeCategory === cat.value
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              )}
            >
              {cat.label}
              {activeCategory === cat.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Horizontal scroll carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        >
          {filtered.length === 0 && (
            <p className="text-muted py-12 text-center w-full">
              No spaces in this category yet.
            </p>
          )}
          {filtered.map((space) => {
            const images = parseImages(space.images);
            return (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className="shrink-0 w-[280px] sm:w-[280px] snap-start group"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <Image
                    src={images[0] || "/placeholder-space.jpg"}
                    alt={space.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-semibold text-base line-clamp-1 mb-1">
                      {space.name}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">
                      {space.city}, {space.country}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">
                        {getPriceDisplay(space)}
                      </span>
                      {space.averageRating !== undefined &&
                        space.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-white/80 text-sm">
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            {space.averageRating.toFixed(1)}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
