import { getTranslations } from "next-intl/server";

const companies = [
  { name: "Acme Corp", style: "font-bold" },
  { name: "TechFlow", style: "font-semibold tracking-wide" },
  { name: "Streamline", style: "font-light tracking-wider" },
  { name: "Brightwork", style: "font-bold italic" },
  { name: "Nexus", style: "font-semibold tracking-widest uppercase text-[13px]" },
  { name: "Pulsify", style: "font-medium" },
];

const LogoBar = async () => {
  const t = await getTranslations("home");

  return (
    <section className="py-8 md:py-10 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium tracking-widest uppercase text-muted/70 text-center mb-6">
          {t("logoBarTitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-3">
          {companies.map((company) => (
            <span
              key={company.name}
              className={`text-base md:text-lg text-gray-300 select-none ${company.style}`}
            >
              {company.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoBar;
