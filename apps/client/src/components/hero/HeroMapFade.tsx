import { getTranslations } from "next-intl/server";
import HeroSearch from "@/components/HeroSearch";

const HeroMapFade = async () => {
  const t = await getTranslations("home");

  return (
    <section className="relative min-h-[560px] md:min-h-[640px] flex items-center justify-center overflow-hidden">
      {/* Full-bleed map background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Radial gradient mask — tighter center, stronger fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 48%, transparent 0%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.97) 75%, #ffffff 100%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance mb-5">
          {t("heroTitle")}
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8 leading-relaxed text-pretty">
          {t("heroDescription")}
        </p>

        <HeroSearch />

        <p className="text-sm text-muted mt-6">
          {t("trustSpaces")} &middot; {t("trustCities")} &middot; {t("trustRating")} &middot; {t("trustFree")}
        </p>
      </div>
    </section>
  );
};

export default HeroMapFade;
