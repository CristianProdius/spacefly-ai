"use client";

import { Space } from "@repo/types";
import { Star, Zap } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay, compactPriceLabels } from "@/lib/utils";
import { useState } from "react";

const timeFilters = ["Today", "This Week", "This Weekend"] as const;

export default function FeaturedQuickBook({
  spaces,
}: {
  spaces: Space[];
}) {
  const [activeTime, setActiveTime] = useState<string>("Today");

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Book a Space Now
          </h2>

          {/* Segmented time toggle */}
          <div className="flex bg-subtle rounded-full p-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTime(filter)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                  activeTime === filter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
          {spaces.map((space) => {
            const images = parseImages(space.images);
            const isAvailable = Math.random() > 0.3; // Simulated availability

            return (
              <div
                key={space.id}
                className="shrink-0 w-[200px] sm:w-[200px] snap-start"
              >
                <Link href={`/spaces/${space.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                    <Image
                      src={images[0] || "/placeholder-space.jpg"}
                      alt={space.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Availability dot */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          isAvailable
                            ? "bg-green-400 animate-pulse"
                            : "bg-yellow-400 animate-pulse"
                        )}
                      />
                      <span className="text-white text-[10px] font-medium">
                        {isAvailable ? "Available" : "Limited"}
                      </span>
                    </div>

                    {/* Price overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-1 mb-0.5">
                        {space.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-sm">
                          {getPriceDisplay(space, compactPriceLabels)}
                        </span>
                        {space.averageRating !== undefined &&
                          space.averageRating > 0 && (
                            <span className="flex items-center gap-0.5 text-white/80 text-xs">
                              <Star className="w-3 h-3 fill-white text-white" />
                              {space.averageRating.toFixed(1)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Book button */}
                <Link
                  href={`/spaces/${space.id}`}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Book
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
