import { Clock, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

const props = [
  { icon: Zap, titleKey: "valueProp1Title", descKey: "valueProp1Desc" },
  { icon: ShieldCheck, titleKey: "valueProp2Title", descKey: "valueProp2Desc" },
  { icon: Clock, titleKey: "valueProp3Title", descKey: "valueProp3Desc" },
  { icon: RotateCcw, titleKey: "valueProp4Title", descKey: "valueProp4Desc" },
] as const;

const ValueProps = async () => {
  const t = await getTranslations("home");

  return (
    <section className="bg-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
          {t("whyBookTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {props.map((prop) => {
            const Icon = prop.icon;
            return (
              <div key={prop.titleKey} className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t(prop.titleKey)}
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    {t(prop.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
