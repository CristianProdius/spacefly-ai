import HeroMapFade from "@/components/hero/HeroMapFade";
import SpaceList from "@/components/SpaceList";
import HowItWorks from "@/components/landing/HowItWorks";
import HostCTA from "@/components/landing/HostCTA";
import FAQ from "@/components/landing/FAQ";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) => {
  const { type } = await searchParams;

  return (
    <div>
      {/* 1. Hero */}
      <HeroMapFade />

      {/* 2. Browse Spaces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SpaceList type={type} variant="homepage" showCategories />
      </section>

      {/* 3. How It Works */}
      <HowItWorks />

      {/* 4. Host CTA */}
      <HostCTA />

      {/* 5. FAQ */}
      <FAQ />
    </div>
  );
};

export default Homepage;
