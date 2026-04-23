"use client";

import { Space } from "@repo/types";
import { Star, MapPin } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { parseImages, getPriceDisplay } from "@/lib/utils";

export default function FeaturedEditorialSpotlight({
  spaces,
  title = "Curated for You",
  showViewAll = false,
}: {
  spaces: Space[];
  title?: string;
  showViewAll?: boolean;
}) {
  const items = spaces.slice(0, 5);
  const hero = items[0];
  const rest = items.slice(1);

  if (!hero) return null;

  const heroImages = parseImages(hero.images);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {title}
          </h2>
          <span className="text-xs font-medium tracking-wider uppercase text-primary bg-primary-light px-2.5 py-1 rounded-full">
            Curated by Spacefly.ai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
          {/* Hero card — spans 2x2 */}
          <Link
            href={`/spaces/${hero.id}`}
            className="md:col-span-2 md:row-span-2 group relative rounded-xl overflow-hidden aspect-square md:aspect-auto"
          >
            <Image
              src={heroImages[0] || "/placeholder-space.jpg"}
              alt={hero.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="inline-block text-xs font-medium tracking-wider uppercase text-primary bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full mb-3">
                Curated by Spacefly.ai
              </span>
              <h3 className="text-2xl font-bold text-white mb-1">
                {hero.name}
              </h3>
              <div className="flex items-center gap-3 text-white/80 text-sm mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hero.city}, {hero.country}
                </span>
                {hero.averageRating !== undefined && hero.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                    {hero.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-white font-semibold text-lg">
                {getPriceDisplay(hero)}
              </p>
            </div>
          </Link>

          {/* Smaller cards */}
          {rest.map((space) => {
            const images = parseImages(space.images);
            return (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3]"
              >
                <Image
                  src={images[0] || "/placeholder-space.jpg"}
                  alt={space.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-semibold text-white line-clamp-1">
                    {space.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/70 text-xs">
                      {space.city}
                    </span>
                    <span className="text-white font-medium text-sm">
                      {getPriceDisplay(space)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {showViewAll && (
          <div className="mt-8 text-center">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all spaces &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
