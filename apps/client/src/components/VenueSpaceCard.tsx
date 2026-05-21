"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseImages } from "@/lib/utils";

interface VenueCardData {
  id: number;
  name: string;
  shortDescription?: string;
  city: string;
  country: string;
  images: string[] | string;
  spaceCount: number;
}

const VenueSpaceCard = ({ venue }: { venue: VenueCardData }) => {
  const images = parseImages(venue.images);
  const t = useTranslations("hosts.card");
  const tProfile = useTranslations("hosts.profile");
  return (
    <Link href={`/venues/${venue.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        <Image
          src={images[0] || "/placeholder-space.jpg"}
          alt={venue.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="pt-3 flex flex-col gap-0.5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:underline">
          {venue.name}
        </h3>
        <p className="text-sm text-muted line-clamp-1 inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {venue.city}, {venue.country}
        </p>
        <p className="text-sm text-foreground mt-1">
          {t("spaces", { count: venue.spaceCount })}
        </p>
        <span className="text-xs text-muted mt-1 group-hover:underline">
          {tProfile("viewVenue")} →
        </span>
      </div>
    </Link>
  );
};

export default VenueSpaceCard;
