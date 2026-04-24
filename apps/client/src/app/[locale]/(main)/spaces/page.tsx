import SpaceList from "@/components/SpaceList";
import { getTranslations } from "next-intl/server";

interface SpacesPageProps {
  searchParams: Promise<{
    category?: string;
    categorySlug?: string;
    type?: string;
    group?: string;
    groupSlug?: string;
    city?: string;
    capacity?: string;
    minPrice?: string;
    maxPrice?: string;
    instantBook?: string;
    sort?: string;
  }>;
}

const SpacesPage = async ({ searchParams }: SpacesPageProps) => {
  const params = await searchParams;
  const t = await getTranslations("spaces");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground text-balance">{t("title")}</h1>
        <p className="text-muted mt-2 text-pretty">
          {t("description")}
        </p>
      </div>

      <SpaceList
        category={params.category}
        categorySlug={params.categorySlug}
        type={params.type}
        group={params.group}
        groupSlug={params.groupSlug}
        city={params.city}
        capacity={params.capacity}
        minPrice={params.minPrice}
        maxPrice={params.maxPrice}
        instantBook={params.instantBook}
        sort={params.sort}
        variant="browse"
      />
    </div>
  );
};

export default SpacesPage;
