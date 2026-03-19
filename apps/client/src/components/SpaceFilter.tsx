"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

const SpaceFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);
  const t = useTranslations("filters");

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
  };

  const handleCitySearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get("city") as string;
    updateParams("city", city || null);
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6">
      {/* Search Bar and Filters Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <form onSubmit={handleCitySearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="city"
              placeholder={t("searchByCity")}
              defaultValue={searchParams.get("city") || ""}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${
            showFilters ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent" : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {t("filters")}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
            {t("clear")}
          </button>
        )}
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-[var(--shadow-md)]">
          {/* Capacity */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("minCapacity")}</label>
            <select
              value={searchParams.get("capacity") || ""}
              onChange={(e) => updateParams("capacity", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="">{t("any")}</option>
              <option value="1">{t("onePlus")}</option>
              <option value="5">{t("fivePlus")}</option>
              <option value="10">{t("tenPlus")}</option>
              <option value="20">{t("twentyPlus")}</option>
              <option value="50">{t("fiftyPlus")}</option>
              <option value="100">{t("hundredPlus")}</option>
            </select>
          </div>

          {/* Min Price */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("minPrice")}</label>
            <input
              type="number"
              placeholder="$0"
              value={searchParams.get("minPrice") || ""}
              onChange={(e) => updateParams("minPrice", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Max Price */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("maxPrice")}</label>
            <input
              type="number"
              placeholder={t("any")}
              value={searchParams.get("maxPrice") || ""}
              onChange={(e) => updateParams("maxPrice", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Instant Book */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("bookingType")}</label>
            <select
              value={searchParams.get("instantBook") || ""}
              onChange={(e) => updateParams("instantBook", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="">{t("any")}</option>
              <option value="true">{t("instantBookOnly")}</option>
              <option value="false">{t("requestToBook")}</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t("sortBy")}</label>
            <select
              value={searchParams.get("sort") || "newest"}
              onChange={(e) => updateParams("sort", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="newest">{t("newestFirst")}</option>
              <option value="price_asc">{t("priceLowToHigh")}</option>
              <option value="price_desc">{t("priceHighToLow")}</option>
              <option value="rating">{t("highestRated")}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceFilter;
