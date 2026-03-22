import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

const testimonials = [
  { quoteKey: "testimonial1Quote", nameKey: "testimonial1Name", roleKey: "testimonial1Role", companyKey: "testimonial1Company", initials: "AM" },
  { quoteKey: "testimonial2Quote", nameKey: "testimonial2Name", roleKey: "testimonial2Role", companyKey: "testimonial2Company", initials: "SK" },
  { quoteKey: "testimonial3Quote", nameKey: "testimonial3Name", roleKey: "testimonial3Role", companyKey: "testimonial3Company", initials: "DR" },
] as const;

const Testimonials = async () => {
  const t = await getTranslations("home");

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
          {t("testimonialsTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.nameKey}
              className="p-6 rounded-xl border border-border bg-white"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold">
                  {item.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {t(item.nameKey)}
                  </p>
                  <p className="text-sm text-muted">
                    {t(item.roleKey)}, {t(item.companyKey)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
