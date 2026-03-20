import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";
import { Check } from "lucide-react";

const HeroDarkImmersive = async () => {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Map at low opacity */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-transparent to-gray-900/80" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">
          {t("label")}
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5">
          {t("heroTitle")}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          {t("heroDescription")}
        </p>

        {/* Glowing search bar */}
        <div className="relative max-w-xl mx-auto">
          <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur-lg" />
          <div className="relative">
            <HeroSearch />
          </div>
        </div>

        {/* Frosted trust pills */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            <Check className="w-4 h-4 text-indigo-400" />
            {t("trustSpaces")}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            <Check className="w-4 h-4 text-indigo-400" />
            {t("trustHosts")}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            <Check className="w-4 h-4 text-indigo-400" />
            {t("trustFree")}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroDarkImmersive;
