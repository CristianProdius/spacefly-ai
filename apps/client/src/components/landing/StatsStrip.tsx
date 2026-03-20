import { getTranslations } from "next-intl/server";

const stats = [
  { valueKey: "statsSpaces", labelKey: "statsSpacesLabel" },
  { valueKey: "statsCities", labelKey: "statsCitiesLabel" },
  { valueKey: "statsRating", labelKey: "statsRatingLabel" },
  { valueKey: "statsHosts", labelKey: "statsHostsLabel" },
] as const;

const StatsStrip = async () => {
  const t = await getTranslations("home");

  return (
    <section className="bg-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.valueKey}>
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {t(stat.valueKey)}
              </p>
              <p className="text-sm text-muted mt-1">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
