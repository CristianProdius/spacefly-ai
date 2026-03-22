import { Fragment } from "react";
import { ArrowRight, Check, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const trustKeys = ["ctaTrust1", "ctaTrust2", "ctaTrust3"] as const;

const HostCTA = async () => {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <TrendingUp className="size-4" />
            {t("ctaEarnings")}
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
            {t("ctaTitle")}
          </h2>

          <p className="text-muted text-pretty">{t("ctaDescription")}</p>

          <Link
            href="/become-host"
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {tc("becomeAHost")}
            <ArrowRight className="size-4" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
            {trustKeys.map((key, i) => (
              <Fragment key={key}>
                {i > 0 && <span className="text-muted/50" aria-hidden="true">·</span>}
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" />
                  {t(key)}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HostCTA;
