import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const HostCTA = async () => {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <section className="bg-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight max-w-md">
            {t("ctaTitle")}
          </h2>
          <div className="flex flex-col items-start md:items-end gap-4">
            <Link
              href="/become-host"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-foreground font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {tc("becomeAHost")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-sm text-gray-400">{t("ctaDescription")}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
              <span>{t("ctaTrust1")}</span>
              <span>{t("ctaTrust2")}</span>
              <span>{t("ctaTrust3")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HostCTA;
