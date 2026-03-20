import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";
import { Check } from "lucide-react";

const HeroFloatingCards = async () => {
  const t = await getTranslations("home");

  return (
    <section className="overflow-hidden">
      {/* Map strip at top */}
      <div className="relative h-[200px] md:h-[280px]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/hero.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Floating cards overlapping the map */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10 space-y-4 pb-16 md:pb-24">
        {/* Card 1 — headline */}
        <div className="glass rounded-2xl p-8 md:p-10 shadow-[var(--shadow-lg)] text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-4">
            {t("label")}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
        </div>

        {/* Card 2 — search */}
        <div className="glass rounded-2xl p-6 shadow-[var(--shadow-md)]">
          <HeroSearch />
        </div>

        {/* Card 3 — trust pills */}
        <div className="glass rounded-2xl p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              {t("trustSpaces")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              {t("trustHosts")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              {t("trustFree")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroFloatingCards;
