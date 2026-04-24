import { Space } from "@repo/types";
import SpaceCategories from "./SpaceCategories";
import SpaceCard from "./SpaceCard";
import SpaceFilter from "./SpaceFilter";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getBrowseTaxonomy } from "@/lib/taxonomy.server";
import {
  buildBrowseHref,
  resolveBrowseSelection,
  type BrowseTaxonomy,
} from "@/lib/taxonomy";

type SpaceWithCategory = Space & {
  category?: {
    group?: {
      name?: string | null;
      slug?: string | null;
      sortOrder?: number | null;
    } | null;
    groupSlug?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

interface FetchParams {
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
  limit?: string;
}

const fetchSpaces = async (
  params: FetchParams,
  taxonomy: BrowseTaxonomy
): Promise<SpaceWithCategory[]> => {
  const searchParams = new URLSearchParams();
  const hasExplicitTaxonomyParams = Boolean(
    params.category ||
      params.categorySlug ||
      params.group ||
      params.groupSlug
  );
  const browseSelection = resolveBrowseSelection(
    {
      category: params.category,
      categorySlug: params.categorySlug,
      group: params.group,
      groupSlug: params.groupSlug,
      type: params.type,
    },
    taxonomy
  );

  if (params.type && !hasExplicitTaxonomyParams) {
    searchParams.set("spaceType", params.type);
  } else if (browseSelection.categorySlug) {
    searchParams.set("categorySlug", browseSelection.categorySlug);
  } else if (browseSelection.groupSlug) {
    searchParams.set("groupSlug", browseSelection.groupSlug);
  } else if (browseSelection.legacySpaceType) {
    searchParams.set("spaceType", browseSelection.legacySpaceType);
  }
  if (params.city) searchParams.set("city", params.city);
  if (params.capacity) searchParams.set("capacity", params.capacity);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice);
  if (params.instantBook) searchParams.set("instantBook", params.instantBook);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit);

  const url = `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces?${searchParams.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error("Failed to fetch spaces:", res.status);
      return [];
    }
    const data = await res.json();
    return data.spaces || data || [];
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
};

interface SpaceListProps {
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
  variant: "homepage" | "browse";
  showCategories?: boolean;
}

const SpaceList = async ({
  type,
  category,
  categorySlug,
  group,
  groupSlug,
  city,
  capacity,
  minPrice,
  maxPrice,
  instantBook,
  sort,
  variant,
  showCategories = true,
}: SpaceListProps) => {
  const taxonomy = await getBrowseTaxonomy();
  const browseSelection = resolveBrowseSelection(
    { category, categorySlug, group, groupSlug, type },
    taxonomy
  );
  const spaces = await fetchSpaces({
    category,
    categorySlug,
    group,
    groupSlug,
    city,
    capacity,
    minPrice,
    maxPrice,
    instantBook,
    type,
    sort: sort || "newest",
    limit: variant === "homepage" ? "8" : undefined,
  }, taxonomy);

  const t = await getTranslations("spaces");
  const tc = await getTranslations("common");

  return (
    <div className="w-full">
      {showCategories && (
        <SpaceCategories selection={browseSelection} taxonomy={taxonomy} />
      )}
      {variant === "browse" && <SpaceFilter />}

      {spaces.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-subtle flex items-center justify-center">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-lg">{t("noSpacesFound")}</p>
          <p className="text-muted mt-2">{t("tryAdjusting")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}

      {variant === "homepage" && spaces.length > 0 && (
        <div className="flex justify-center mt-8">
          <Link
            href={buildBrowseHref(browseSelection)}
            className="px-6 py-3 border border-foreground text-foreground rounded-lg font-medium hover:bg-foreground hover:text-white transition-colors"
          >
            {tc("viewAllSpaces")}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SpaceList;
