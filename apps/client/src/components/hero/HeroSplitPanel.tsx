import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";
import { Check } from "lucide-react";

const HeroSplitPanel = async () => {
  const t = await getTranslations("home");

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] md:min-h-[700px]">
      {/* Left — content */}
      <div className="flex flex-col justify-center px-4 lg:px-12 xl:px-16 py-16 md:py-24">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-4">
          {t("label")}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5">
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

      {/* Right — map with overlay + floating stat badges */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/hero.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/20" />

        {/* Floating glass stat badges */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="glass rounded-xl p-4 shadow-[var(--shadow-md)] text-center">
              <p className="text-2xl font-bold text-gray-900">{t("statsSpaces")}</p>
              <p className="text-xs text-gray-500 mt-1">{t("statsSpacesLabel")}</p>
            </div>
            <div className="glass rounded-xl p-4 shadow-[var(--shadow-md)] text-center">
              <p className="text-2xl font-bold text-gray-900">{t("statsCities")}</p>
              <p className="text-xs text-gray-500 mt-1">{t("statsCitiesLabel")}</p>
            </div>
            <div className="glass rounded-xl p-4 shadow-[var(--shadow-md)] text-center">
              <p className="text-2xl font-bold text-gray-900">{t("statsRating")}</p>
              <p className="text-xs text-gray-500 mt-1">{t("statsRatingLabel")}</p>
            </div>
            <div className="glass rounded-xl p-4 shadow-[var(--shadow-md)] text-center">
              <p className="text-2xl font-bold text-gray-900">{t("statsHosts")}</p>
              <p className="text-xs text-gray-500 mt-1">{t("statsHostsLabel")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSplitPanel;
