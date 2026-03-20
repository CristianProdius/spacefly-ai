import { getTranslations } from "next-intl/server";

const steps = [
  { number: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { number: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { number: "03", titleKey: "step3Title", descKey: "step3Desc" },
] as const;

const HowItWorks = async () => {
  const t = await getTranslations("home");

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-10">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="text-3xl font-bold text-primary/20">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-foreground mt-2 mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border" />
      </div>
    </section>
  );
};

export default HowItWorks;
