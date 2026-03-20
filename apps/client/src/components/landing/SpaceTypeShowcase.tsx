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
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
          {t("spaceTypeTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaceTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.slug}
                href={`/spaces?type=${type.slug}`}
                className="group flex items-start gap-4 p-5 rounded-xl border border-border bg-white hover:border-primary/30 hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {ts(`spaceTypes.${type.slug}` as any)}
                  </h3>
                  <p className="text-sm text-muted mt-0.5">
                    {t(`spaceTypeTagline${type.slug}` as any)}
                  </p>
                  <p className="text-sm font-medium text-primary mt-1">
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
