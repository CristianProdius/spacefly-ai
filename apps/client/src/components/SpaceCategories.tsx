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
  { icon: <Grid3X3 className="size-4" />, slug: "all", key: "allSpaces" as const },
  { icon: <LayoutGrid className="size-4" />, slug: "OFFICE_DESK", key: "spaceTypes.OFFICE_DESK" as const },
  { icon: <DoorOpen className="size-4" />, slug: "PRIVATE_OFFICE", key: "spaceTypes.PRIVATE_OFFICE" as const },
  { icon: <Users className="size-4" />, slug: "MEETING_ROOM", key: "spaceTypes.MEETING_ROOM" as const },
  { icon: <PartyPopper className="size-4" />, slug: "EVENT_VENUE", key: "spaceTypes.EVENT_VENUE" as const },
  { icon: <Heart className="size-4" />, slug: "WEDDING_VENUE", key: "spaceTypes.WEDDING_VENUE" as const },
  { icon: <Building2 className="size-4" />, slug: "COWORKING_SPACE", key: "spaceTypes.COWORKING_SPACE" as const },
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
    <div className="relative mb-6">
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-0.5 pb-1">
        {spaceTypeIcons.map((type) => (
          <button
            key={type.slug}
            onClick={() => handleChange(type.slug)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 md:shrink md:flex-1 ${
              type.slug === selectedType || (type.slug === "all" && !searchParams.get("type"))
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "bg-white text-muted border border-border hover:border-primary/30"
            }`}
          >
            {type.icon}
            {t(type.key)}
          </button>
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
    </div>
  );
};

export default SpaceCategories;
