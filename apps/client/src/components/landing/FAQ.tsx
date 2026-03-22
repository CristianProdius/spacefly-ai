import { getTranslations } from "next-intl/server";

const faqs = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
  { qKey: "faq4Q", aKey: "faq4A" },
  { qKey: "faq5Q", aKey: "faq5A" },
  { qKey: "faq6Q", aKey: "faq6A" },
] as const;

const FAQ = async () => {
  const t = await getTranslations("home");

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: t(faq.qKey),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(faq.aKey),
      },
    })),
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
          {t("faqTitle")}
        </h2>
        <div className="divide-y divide-border">
          {faqs.map((faq) => (
            <details key={faq.qKey} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none text-foreground font-medium hover:text-primary transition-colors">
                <span>{t(faq.qKey)}</span>
                <span className="ml-4 shrink-0 text-muted text-xl leading-none group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {t(faq.aKey)}
              </p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </section>
  );
};

export default FAQ;
