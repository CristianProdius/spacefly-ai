import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

const cities = [
  { key: "NewYork", slug: "New York" },
  { key: "London", slug: "London" },
  { key: "SanFrancisco", slug: "San Francisco" },
  { key: "Toronto", slug: "Toronto" },
  { key: "Berlin", slug: "Berlin" },
  { key: "Sydney", slug: "Sydney" },
] as const;

const CityBrowse = async () => {
  const t = await getTranslations("home");

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
          {t("cityBrowseTitle")}
        </h2>
        <p className="text-muted mb-10">{t("cityBrowseDesc")}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cities.map((city) => (
            <Link
              key={city.key}
              href={`/spaces?city=${encodeURIComponent(city.slug)}`}
              className="group relative overflow-hidden rounded-xl bg-gray-900 p-6 md:p-8 flex flex-col justify-end min-h-[140px] md:min-h-[180px] hover:ring-2 hover:ring-primary/40 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 group-hover:from-black/70 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
                  <MapPin className="w-3 h-3" />
                  <span>{t(`city${city.key}Country`)}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  {t(`city${city.key}Name`)}
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  {t(`city${city.key}Spaces`)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CityBrowse;
