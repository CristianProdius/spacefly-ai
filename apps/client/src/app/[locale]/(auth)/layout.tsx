import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import BackgroundVideo from "./BackgroundVideo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("footer");

  return (
    <div className="min-h-dvh flex flex-row">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-[480px] shrink-0 bg-foreground relative overflow-hidden">
        {/* Background video */}
        <BackgroundVideo />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center w-full p-12">
          <Link href="/" aria-label="Spacefly.ai home">
            <Image
              src="/brand/wordmark_dark_transparent.png"
              alt="Spacefly.ai"
              width={220}
              height={70}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 text-sm text-white/60 text-center text-pretty max-w-xs">
            {t("tagline")}
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col bg-subtle lg:bg-white">
        {/* Mobile header — Spacefly.ai logo */}
        <div className="px-4 pt-8 pb-4 flex justify-center lg:hidden">
          <Link href="/" aria-label="Spacefly.ai home">
            <Image
              src="/brand/wordmark_transparent.png"
              alt="Spacefly.ai"
              width={160}
              height={52}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start justify-center px-4 py-8 md:py-16 lg:items-center">
          {/* Card on mobile, no card on desktop */}
          <div className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-[var(--shadow-lg)] p-8 lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
