"use client";

import { Space } from "@repo/types";
import { MapPin, Users, Star, Clock, Calendar } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// Parse images field - handles both array and stringified array
const parseImages = (images: unknown): string[] => {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const SpaceCard = ({ space }: { space: Space }) => {
  const images = parseImages(space.images);
  const t = useTranslations("spaces");
  const tc = useTranslations("common");

  // Prices are stored in cents, convert to dollars
  const formatPrice = (priceInCents: number | null) => {
    if (!priceInCents) return null;
    return `$${(priceInCents / 100).toFixed(0)}`;
  };

  const getPriceDisplay = () => {
    if (space.pricingType === "HOURLY" && space.pricePerHour) {
      return `${formatPrice(space.pricePerHour)}${tc("perHrShort")}`;
    }
    if (space.pricingType === "DAILY" && space.pricePerDay) {
      return `${formatPrice(space.pricePerDay)}${tc("perDayShort")}`;
    }
    if (space.pricingType === "BOTH") {
      if (space.pricePerHour) {
        return `${tc("from")} ${formatPrice(space.pricePerHour)}${tc("perHrShort")}`;
      }
      return `${formatPrice(space.pricePerDay)}${tc("perDayShort")}`;
    }
    return tc("contactForPricing");
  };

  return (
    <Link href={`/spaces/${space.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300 group">
        {/* IMAGE */}
        <div className="relative aspect-[4/3]">
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
            {t(`spaceTypes.${space.spaceType}` as any) || space.spaceType}
          </span>
        </div>

        {/* SPACE DETAILS */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {space.name}
            </h3>
            {space.averageRating !== undefined && space.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{space.averageRating.toFixed(1)}</span>
                {space.totalReviews !== undefined && space.totalReviews > 0 && (
                  <span className="text-gray-400">({space.totalReviews})</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{space.city}, {space.country}</span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {space.shortDescription}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{t("upTo", { capacity: space.capacity })}</span>
            </div>
            {space.pricingType === "HOURLY" || space.pricingType === "BOTH" ? (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{tc("hourly")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{tc("daily")}</span>
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <p className="text-lg font-bold text-gray-900">
              {getPriceDisplay()}
            </p>
            <span className="text-sm text-primary font-medium group-hover:underline">
              {tc("viewDetails")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SpaceCard;
