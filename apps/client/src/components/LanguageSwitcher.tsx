"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  ro: "RO",
  ru: "RU",
  en: "EN",
};

const localeFlags: Record<string, string> = {
  ro: "\u{1F1F7}\u{1F1F4}",
  ru: "\u{1F1F7}\u{1F1FA}",
  en: "\u{1F1EC}\u{1F1E7}",
};

const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any });
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted hover:text-foreground hover:bg-subtle rounded-lg transition-colors cursor-pointer"
      >
        <Globe className="size-4" />
        <span>{localeFlags[locale]} {localeLabels[locale]}</span>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup className="w-32 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
            {routing.locales.map((l) => (
              <Menu.Item
                key={l}
                onClick={() => handleChange(l)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 cursor-pointer",
                  "data-[highlighted]:bg-subtle",
                  l === locale
                    ? "text-primary font-medium bg-primary-light"
                    : "text-foreground"
                )}
              >
                <span>{localeFlags[l]}</span>
                <span>{localeLabels[l]}</span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export default LanguageSwitcher;
