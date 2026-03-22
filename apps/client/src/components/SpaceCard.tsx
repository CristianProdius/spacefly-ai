"use client";

import { Space } from "@repo/types";
import { Star } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { parseImages, getPriceDisplay, type PriceLabels } from "@/lib/utils";

const SpaceCard = ({ space }: { space: Space }) => {
  const images = parseImages(space.images);
  const t = useTranslations("spaces");
  const tc = useTranslations("common");

  const priceLabels: PriceLabels = {
    perHr: tc("perHrShort"),
    perDay: tc("perDayShort"),
    from: tc("from"),
    contactForPricing: tc("contactForPricing"),
  };

  return (
    <Link href={`/spaces/${space.id}`} className="group">
        {/* IMAGE */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
          <Image
            src={images[0] || "/placeholder-space.jpg"}
            alt={space.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {space.instantBook && (
            <span className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              {tc("instantBook")}
            </span>
          )}
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full border border-gray-200/50">
            {t(`spaceTypes.${space.spaceType}`) || space.spaceType}
          </span>
        </div>

        {/* SPACE DETAILS */}
        <div className="pt-3 flex flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {space.name}
            </h3>
            {space.averageRating !== undefined && space.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                <span className="font-medium">{space.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-1">
            {space.city}, {space.country}
          </p>

          <p className="text-sm font-semibold text-foreground mt-1">
            {getPriceDisplay(space, priceLabels)}
          </p>
        </div>
    </Link>
  );
};

export default SpaceCard;
