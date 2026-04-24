import { cache } from "react";
import {
  EMPTY_BROWSE_TAXONOMY,
  type BrowseTaxonomy,
  normalizeBrowseTaxonomy,
} from "./taxonomy";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

const fetchTaxonomyPayload = async (url: string) => {
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

export const getBrowseTaxonomy = cache(async (): Promise<BrowseTaxonomy> => {
  const groupedPayload = await fetchTaxonomyPayload(
    `${PRODUCT_SERVICE_URL}/categories?grouped=true`
  );

  if (groupedPayload) {
    const taxonomy = normalizeBrowseTaxonomy(groupedPayload);
    if (taxonomy.categories.length > 0) {
      return taxonomy;
    }
  }

  const flatPayload = await fetchTaxonomyPayload(`${PRODUCT_SERVICE_URL}/categories`);

  if (!flatPayload) {
    return EMPTY_BROWSE_TAXONOMY;
  }

  return normalizeBrowseTaxonomy(flatPayload);
});
