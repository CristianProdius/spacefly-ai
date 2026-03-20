import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";

const HeroBoldTypography = async () => {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Map texture at ultra-low opacity */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 tracking-tighter leading-[0.9] mb-6">
          {t("heroTitle")}
        </h1>
        <p className="font-light text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
          {t("heroDescription")}
        </p>
        <HeroSearch />
      </div>
    </section>
  );
};

export default HeroBoldTypography;
