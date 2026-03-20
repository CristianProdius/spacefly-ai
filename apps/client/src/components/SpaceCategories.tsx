"use client";

import {
  Building2,
  DoorOpen,
  Users,
  PartyPopper,
  Heart,
  LayoutGrid,
  Grid3X3,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const spaceTypeIcons = [
  { icon: <Grid3X3 className="w-5 h-5" />, slug: "all", key: "allSpaces" },
  { icon: <LayoutGrid className="w-5 h-5" />, slug: "OFFICE_DESK", key: "spaceTypes.OFFICE_DESK" },
  { icon: <DoorOpen className="w-5 h-5" />, slug: "PRIVATE_OFFICE", key: "spaceTypes.PRIVATE_OFFICE" },
  { icon: <Users className="w-5 h-5" />, slug: "MEETING_ROOM", key: "spaceTypes.MEETING_ROOM" },
  { icon: <PartyPopper className="w-5 h-5" />, slug: "EVENT_VENUE", key: "spaceTypes.EVENT_VENUE" },
  { icon: <Heart className="w-5 h-5" />, slug: "WEDDING_VENUE", key: "spaceTypes.WEDDING_VENUE" },
  { icon: <Building2 className="w-5 h-5" />, slug: "COWORKING_SPACE", key: "spaceTypes.COWORKING_SPACE" },
];

const SpaceCategories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("spaces");

  const selectedType = searchParams.get("type") || "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {spaceTypeIcons.map((type) => (
        <button
          key={type.slug}
          onClick={() => handleChange(type.slug)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            type.slug === selectedType || (type.slug === "all" && !searchParams.get("type"))
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-primary/30"
          }`}
        >
          {type.icon}
          {t(type.key as any)}
        </button>
      ))}
    </div>
  );
};

export default SpaceCategories;
