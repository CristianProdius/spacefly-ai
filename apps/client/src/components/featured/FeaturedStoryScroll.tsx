"use client";

import { Space } from "@repo/types";
import { Star, ArrowRight, TrendingUp, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay } from "@/lib/utils";
import { useState } from "react";

const tabs = [
  { label: "Staff Picks", icon: Sparkles, value: "picks" },
  { label: "Trending", icon: TrendingUp, value: "trending" },
  { label: "New", icon: Users, value: "new" },
] as const;

const contextLabels = [
  "Most booked this month",
  "Staff favorite",
  "Trending in your city",
  "Recently added",
  "Popular for events",
  "Great for teams",
  "Top rated",
  "Hot this week",
];

export default function FeaturedStoryScroll({
  spaces,
}: {
  spaces: Space[];
}) {
  const [activeTab, setActiveTab] = useState("picks");

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <h2 className="text-2xl font-bold text-foreground">
            Spaces Worth Exploring
          </h2>

          {/* Tab controls */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    activeTab === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-subtle text-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternating rows */}
        <div className="flex flex-col gap-16">
          {spaces.slice(0, 6).map((space, i) => {
            const images = parseImages(space.images);
            const isReversed = i % 2 !== 0;

            return (
              <div
                key={space.id}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-8 items-center",
                  isReversed && "md:[&>*:first-child]:order-2"
                )}
              >
                {/* Image */}
                <Link
                  href={`/spaces/${space.id}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
                >
                  <Image
                    src={images[0] || "/placeholder-space.jpg"}
                    alt={space.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {space.instantBook && (
                    <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                      Instant Book
                    </span>
                  )}
                </Link>

                {/* Text content */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium tracking-wider uppercase text-primary">
                    {contextLabels[i % contextLabels.length]}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {space.name}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed line-clamp-2">
                    {space.shortDescription || space.description}
                  </p>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-lg font-bold text-foreground">
                      {getPriceDisplay(space)}
                    </span>
                    {space.averageRating !== undefined &&
                      space.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-sm text-muted">
                          <Star className="w-4 h-4 fill-foreground text-foreground" />
                          {space.averageRating.toFixed(1)}
                          {space.totalReviews && (
                            <span className="text-muted">
                              ({space.totalReviews})
                            </span>
                          )}
                        </span>
                      )}
                  </div>

                  <Link
                    href={`/spaces/${space.id}`}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium text-sm mt-2 group/link"
                  >
                    View details
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
