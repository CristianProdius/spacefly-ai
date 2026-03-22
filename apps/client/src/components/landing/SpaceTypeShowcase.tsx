import {
  Building2,
  DoorOpen,
  Heart,
  LayoutGrid,
  PartyPopper,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const spaceTypes = [
  { slug: "OFFICE_DESK", icon: LayoutGrid, price: "$15" },
  { slug: "PRIVATE_OFFICE", icon: DoorOpen, price: "$25" },
  { slug: "MEETING_ROOM", icon: Users, price: "$30" },
  { slug: "EVENT_VENUE", icon: PartyPopper, price: "$75" },
  { slug: "WEDDING_VENUE", icon: Heart, price: "$150" },
  { slug: "COWORKING_SPACE", icon: Building2, price: "$10" },
] as const;

const SpaceTypeShowcase = async () => {
  const t = await getTranslations("home");
  const ts = await getTranslations("spaces");

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-8">
          {t("spaceTypeTitle")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          {spaceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.slug}
                href={`/spaces?type=${type.slug}`}
                className="group flex flex-col items-center gap-2.5 shrink-0 w-28 sm:w-auto sm:flex-1 py-4 px-3 rounded-xl hover:bg-subtle transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground whitespace-nowrap">
                    {ts(`spaceTypes.${type.slug}`)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {t("spaceTypeFrom", { price: type.price })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpaceTypeShowcase;
