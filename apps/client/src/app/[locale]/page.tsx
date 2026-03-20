import SpaceList from "@/components/SpaceList";
import HeroMapFade from "@/components/hero/HeroMapFade";
import SpaceTypeShowcase from "@/components/landing/SpaceTypeShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import ValueProps from "@/components/landing/ValueProps";
import StatsStrip from "@/components/landing/StatsStrip";
import Testimonials from "@/components/landing/Testimonials";
import HostCTA from "@/components/landing/HostCTA";
import { getTranslations } from "next-intl/server";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>;
}) => {
  const { type, city } = await searchParams;
  const t = await getTranslations("home");

  return (
    <div>
      {/* 1. Hero */}
      <HeroMapFade />

      {/* 2. Space Type Showcase */}
      <SpaceTypeShowcase />

      {/* 3. How It Works */}
      <HowItWorks />

      {/* 4. Featured Spaces */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("featuredSpaces")}</h2>
            <p className="text-muted mt-1">{t("featuredSpacesDesc")}</p>
          </div>
          <SpaceList type={type} city={city} variant="homepage" showCategories={true} />
        </div>
      </section>

      {/* 5. Value Propositions */}
      <ValueProps />

      {/* 6. Stats Strip */}
      <StatsStrip />

      {/* 7. Testimonials */}
      <Testimonials />

      {/* 8. Host CTA */}
      <HostCTA />
    </div>
  );
};

export default Homepage;
