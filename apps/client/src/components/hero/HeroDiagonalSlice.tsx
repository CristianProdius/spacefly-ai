import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";
import { Check } from "lucide-react";

const HeroDiagonalSlice = async () => {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      {/* Map background — mobile: bottom portion */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          clipPath: "polygon(0% 65%, 100% 50%, 100% 100%, 0% 100%)",
        }}
      />

      {/* Map background — desktop: diagonal right */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          clipPath: "polygon(100% 0%, 100% 100%, 0% 100%, 40% 0%)",
        }}
      />

      {/* Content — left-aligned */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-4">
            {t("label")}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            {t("heroDescription")}
          </p>

          <HeroSearch />

          {/* Trust pills */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-gray-500">
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

export default HeroDiagonalSlice;
