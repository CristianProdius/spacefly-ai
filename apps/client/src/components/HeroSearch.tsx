"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

const HeroSearch = () => {
  const [city, setCity] = useState("");
  const router = useRouter();
  const t = useTranslations("home");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = city.trim();
    if (query) {
      router.push(`/spaces?city=${encodeURIComponent(query)}`);
    } else {
      router.push("/spaces");
    }
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center w-full max-w-xl mx-auto bg-white rounded-full border border-border shadow-layered-lg pl-5 pr-1.5 py-2 md:py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40"
    >
      <Search className="size-5 text-muted shrink-0" />
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="flex-1 px-3 py-2 text-base text-foreground placeholder:text-muted focus:outline-none bg-transparent"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-primary text-white text-base font-medium rounded-full hover:bg-primary-hover transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t("exploreSpaces")}
      </button>
    </form>
  );
};

export default HeroSearch;
