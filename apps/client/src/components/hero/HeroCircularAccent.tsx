import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";
import { Check } from "lucide-react";

const HeroCircularAccent = async () => {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      {/* Circular map accent */}
      <div
        className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[800px] lg:h-[800px] rounded-full border-2 border-indigo-100 -right-[100px] md:-right-[50px] lg:right-[5%] top-1/2 -translate-y-1/2"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
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

export default HeroCircularAccent;
