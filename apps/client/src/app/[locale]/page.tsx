import SpaceList from "@/components/SpaceList";
import HeroMapFade from "@/components/hero/HeroMapFade";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>;
}) => {
  const { type, city } = await searchParams;
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div>
      <HeroMapFade />

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-10">
            {t("howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            <div>
              <span className="text-3xl font-bold text-indigo-600/20">01</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">{t("step1Title")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t("step1Desc")}</p>
            </div>
            <div>
              <span className="text-3xl font-bold text-indigo-600/20">02</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">{t("step2Title")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t("step2Desc")}</p>
            </div>
            <div>
              <span className="text-3xl font-bold text-indigo-600/20">03</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">{t("step3Title")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t("step3Desc")}</p>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-100" />
        </div>
      </section>

      {/* Featured Spaces */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("featuredSpaces")}</h2>
            <p className="text-gray-500 mt-1">{t("featuredSpacesDesc")}</p>
          </div>
          <SpaceList type={type} city={city} variant="homepage" showCategories={false} />
        </div>
      </section>

      {/* Stats Strip — full bleed */}
      <section className="bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">{t("statsSpaces")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("statsSpacesLabel")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">{t("statsCities")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("statsCitiesLabel")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">{t("statsRating")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("statsRatingLabel")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">{t("statsHosts")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("statsHostsLabel")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — full bleed dark */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight max-w-md">
              {t("ctaTitle")}
            </h2>
            <div className="flex flex-col items-start md:items-end gap-3">
              <Link
                href="/become-host"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {tc("becomeAHost")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-gray-400">{t("ctaDescription")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
