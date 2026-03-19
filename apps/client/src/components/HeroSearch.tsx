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
      onSubmit={handleSubmit}
      className="flex items-center w-full max-w-xl mx-auto bg-white rounded-full border border-gray-200 shadow-[var(--shadow-md)] overflow-hidden pl-5 pr-1.5 py-1.5"
    >
      <Search className="w-5 h-5 text-gray-400 shrink-0" />
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
      />
      <button
        type="submit"
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors shrink-0"
      >
        {t("exploreSpaces")}
      </button>
    </form>
  );
};

export default HeroSearch;
