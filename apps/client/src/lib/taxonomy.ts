import type { Space } from "@repo/types";

export const LEGACY_SPACE_TYPES = [
  "OFFICE_DESK",
  "PRIVATE_OFFICE",
  "MEETING_ROOM",
  "EVENT_VENUE",
  "WEDDING_VENUE",
  "COWORKING_SPACE",
] as const;

export type LegacySpaceType = (typeof LEGACY_SPACE_TYPES)[number];

export interface TaxonomyGroupSummary {
  name: string;
  slug: string;
  sortOrder?: number | null;
}

export interface TaxonomyCategory {
  id?: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number | null;
  groupSlug: string;
  group: TaxonomyGroupSummary;
  spaceCount?: number | null;
  legacySpaceType?: LegacySpaceType;
}

export interface TaxonomyGroup {
  name: string;
  slug: string;
  sortOrder?: number | null;
  categories: TaxonomyCategory[];
}

export interface BrowseTaxonomy {
  groups: TaxonomyGroup[];
  categories: TaxonomyCategory[];
}

export interface BrowseSelection {
  category?: TaxonomyCategory;
  categorySlug?: string;
  group?: TaxonomyGroup;
  groupSlug?: string;
  legacySpaceType?: LegacySpaceType;
}

interface LooseGroupSummary {
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
}

type TaxonomyCount = {
  spaces?: number | null;
};

type ApiCategory = {
  _count?: TaxonomyCount;
  description?: string | null;
  group?: LooseGroupSummary | null;
  groupSlug?: string | null;
  icon?: string | null;
  id?: number;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
};

type ApiGroup = {
  categories?: ApiCategory[] | null;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
};

type SpaceCategoryLike = Pick<Space, "categorySlug" | "spaceType"> & {
  category?: {
    group?: LooseGroupSummary | null;
    groupSlug?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

export const PUBLIC_GROUP_PARAM = "group";
export const PUBLIC_CATEGORY_PARAM = "category";

export const EMPTY_BROWSE_TAXONOMY: BrowseTaxonomy = {
  groups: [],
  categories: [],
};

const LEGACY_CATEGORY_HINTS: Record<
  LegacySpaceType,
  {
    categorySlugs: string[];
    groupSlug: string;
  }
> = {
  OFFICE_DESK: {
    categorySlugs: ["office-desk"],
    groupSlug: "business-office",
  },
  PRIVATE_OFFICE: {
    categorySlugs: ["private-office", "retail-store-shop-front"],
    groupSlug: "business-office",
  },
  MEETING_ROOM: {
    categorySlugs: ["meeting-training-room", "meeting-room"],
    groupSlug: "business-office",
  },
  EVENT_VENUE: {
    categorySlugs: ["event-venue"],
    groupSlug: "events-celebrations",
  },
  WEDDING_VENUE: {
    categorySlugs: ["wedding-venue"],
    groupSlug: "events-celebrations",
  },
  COWORKING_SPACE: {
    categorySlugs: ["coworking-space"],
    groupSlug: "business-office",
  },
};

const CATEGORY_SLUG_TO_LEGACY = Object.entries(LEGACY_CATEGORY_HINTS).reduce(
  (acc, [legacySpaceType, config]) => {
    for (const categorySlug of config.categorySlugs) {
      acc.set(categorySlug, legacySpaceType as LegacySpaceType);
    }
    return acc;
  },
  new Map<string, LegacySpaceType>()
);

const sortByOrder = <T extends { name: string; sortOrder?: number | null }>(a: T, b: T) => {
  const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return a.name.localeCompare(b.name);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSlug = (value?: string | null) => value?.trim().toLowerCase() || "";

const humanizeSlug = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeLegacySpaceType = (value?: string | null): LegacySpaceType | undefined => {
  if (!value) return undefined;
  return LEGACY_SPACE_TYPES.find((legacySpaceType) => legacySpaceType === value);
};

const getFallbackGroup = (groupSlug?: string | null): TaxonomyGroupSummary => {
  const slug = normalizeSlug(groupSlug) || "other";

  return {
    name: humanizeSlug(slug),
    slug,
    sortOrder: null,
  };
};

const coerceGroup = (
  group: LooseGroupSummary | null | undefined,
  groupSlug?: string | null
): TaxonomyGroupSummary => {
  const slug = normalizeSlug(group?.slug) || normalizeSlug(groupSlug);

  if (!slug) {
    return getFallbackGroup(undefined);
  }

  return {
    name: group?.name?.trim() || humanizeSlug(slug),
    slug,
    sortOrder: group?.sortOrder ?? null,
  };
};

const normalizeCategory = (
  category: ApiCategory,
  groupOverride?: LooseGroupSummary | null
): TaxonomyCategory | null => {
  const slug = normalizeSlug(category.slug);
  if (!slug) return null;

  const group = coerceGroup(groupOverride ?? category.group, category.groupSlug);

  return {
    description: category.description ?? null,
    group,
    groupSlug: group.slug,
    icon: category.icon ?? null,
    id: category.id,
    legacySpaceType: CATEGORY_SLUG_TO_LEGACY.get(slug),
    name: category.name?.trim() || humanizeSlug(slug),
    slug,
    sortOrder: category.sortOrder ?? null,
    spaceCount: category._count?.spaces ?? null,
  };
};

const collectFlatCategories = (payload: unknown): ApiCategory[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiCategory[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const categories = payload.categories;
  if (Array.isArray(categories)) {
    return categories.filter(isRecord) as ApiCategory[];
  }

  return [];
};

const collectGroupedCategories = (payload: unknown): ApiGroup[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as ApiGroup[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const groups = payload.groups;
  if (Array.isArray(groups)) {
    return groups.filter(isRecord) as ApiGroup[];
  }

  return [];
};

export const normalizeBrowseTaxonomy = (payload: unknown): BrowseTaxonomy => {
  const groupedPayload = collectGroupedCategories(payload);
  const looksGrouped = groupedPayload.some((group) => Array.isArray(group.categories));

  const categoriesBySlug = new Map<string, TaxonomyCategory>();
  const groupsBySlug = new Map<string, TaxonomyGroup>();

  const upsertCategory = (category: TaxonomyCategory) => {
    const existing = categoriesBySlug.get(category.slug);
    if (!existing || existing.spaceCount == null) {
      categoriesBySlug.set(category.slug, category);
    }

    const group = groupsBySlug.get(category.group.slug) ?? {
      categories: [],
      name: category.group.name,
      slug: category.group.slug,
      sortOrder: category.group.sortOrder ?? null,
    };

    group.name = category.group.name || group.name;
    group.sortOrder = category.group.sortOrder ?? group.sortOrder ?? null;

    if (!group.categories.some((existingCategory) => existingCategory.slug === category.slug)) {
      group.categories.push(category);
    }

    groupsBySlug.set(group.slug, group);
  };

  if (looksGrouped) {
    for (const rawGroup of groupedPayload) {
      const group = coerceGroup(rawGroup, rawGroup.slug);
      const categories = Array.isArray(rawGroup.categories) ? rawGroup.categories : [];

      for (const rawCategory of categories) {
        const category = normalizeCategory(rawCategory, group);
        if (category) {
          upsertCategory(category);
        }
      }
    }
  } else {
    for (const rawCategory of collectFlatCategories(payload)) {
      const category = normalizeCategory(rawCategory);
      if (category) {
        upsertCategory(category);
      }
    }
  }

  const groups = Array.from(groupsBySlug.values())
    .map((group) => ({
      ...group,
      categories: [...group.categories].sort(sortByOrder),
    }))
    .sort(sortByOrder);

  const categories = groups.flatMap((group) => group.categories);

  return { groups, categories };
};

const getParamValue = (
  params: Partial<Record<string, string | undefined>>,
  ...keys: string[]
) => {
  for (const key of keys) {
    const value = params[key];
    if (value?.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

export const resolveBrowseSelection = (
  params: Partial<Record<string, string | undefined>>,
  taxonomy: BrowseTaxonomy = EMPTY_BROWSE_TAXONOMY
): BrowseSelection => {
  const categoryQuery = normalizeSlug(
    getParamValue(params, PUBLIC_CATEGORY_PARAM, "categorySlug")
  );
  const groupQuery = normalizeSlug(getParamValue(params, PUBLIC_GROUP_PARAM, "groupSlug"));
  const legacySpaceType = normalizeLegacySpaceType(getParamValue(params, "type"));

  if (categoryQuery) {
    const category =
      taxonomy.categories.find((item) => item.slug === categoryQuery) ||
      taxonomy.categories.find((item) =>
        item.legacySpaceType
          ? LEGACY_CATEGORY_HINTS[item.legacySpaceType].categorySlugs.includes(categoryQuery)
          : false
      );

    if (category) {
      const group = taxonomy.groups.find((item) => item.slug === category.groupSlug);

      return {
        category,
        categorySlug: category.slug,
        group,
        groupSlug: category.groupSlug,
      };
    }

    return {
      categorySlug: categoryQuery,
      groupSlug: groupQuery || undefined,
    };
  }

  if (groupQuery) {
    const group = taxonomy.groups.find((item) => item.slug === groupQuery);

    return {
      group,
      groupSlug: group?.slug ?? groupQuery,
    };
  }

  if (!legacySpaceType) {
    return {};
  }

  const legacyConfig = LEGACY_CATEGORY_HINTS[legacySpaceType];
  const category = taxonomy.categories.find((item) =>
    legacyConfig.categorySlugs.includes(item.slug)
  );
  const group = taxonomy.groups.find((item) => item.slug === legacyConfig.groupSlug);

  return {
    category,
    categorySlug: category?.slug,
    group,
    groupSlug: category?.groupSlug ?? group?.slug ?? legacyConfig.groupSlug,
    legacySpaceType,
  };
};

export const withBrowseSelection = (
  searchParams: URLSearchParams,
  selection: BrowseSelection
) => {
  const nextParams = new URLSearchParams(searchParams);

  nextParams.delete("type");
  nextParams.delete("groupSlug");
  nextParams.delete("categorySlug");
  nextParams.delete(PUBLIC_GROUP_PARAM);
  nextParams.delete(PUBLIC_CATEGORY_PARAM);

  if (selection.groupSlug) {
    nextParams.set(PUBLIC_GROUP_PARAM, selection.groupSlug);
  }

  if (selection.categorySlug) {
    nextParams.set(PUBLIC_CATEGORY_PARAM, selection.categorySlug);
  }

  return nextParams;
};

export const buildBrowseHref = (
  selection: BrowseSelection,
  pathname = "/spaces"
) => {
  const searchParams = withBrowseSelection(new URLSearchParams(), selection);
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
};

export const getFeaturedCategories = (taxonomy: BrowseTaxonomy, limit = 6) =>
  taxonomy.categories.slice(0, limit);

export const getFeaturedGroups = (taxonomy: BrowseTaxonomy, limit = 4) =>
  taxonomy.groups.slice(0, limit);

export type TaxonomyIconKey =
  | "all"
  | "building"
  | "door"
  | "grid"
  | "heart"
  | "party"
  | "store"
  | "users";

export const getTaxonomyIconKey = (input: {
  groupName?: string | null;
  groupSlug?: string | null;
  icon?: string | null;
  name?: string | null;
  slug?: string | null;
}): TaxonomyIconKey => {
  const haystack = [
    input.icon,
    input.slug,
    input.name,
    input.groupSlug,
    input.groupName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("desk") ||
    haystack.includes("studio") ||
    haystack.includes("photo")
  ) {
    return "grid";
  }

  if (
    haystack.includes("meeting") ||
    haystack.includes("training") ||
    haystack.includes("conference")
  ) {
    return "users";
  }

  if (
    haystack.includes("event") ||
    haystack.includes("celebration") ||
    haystack.includes("party")
  ) {
    return "party";
  }

  if (haystack.includes("wedding")) {
    return "heart";
  }

  if (haystack.includes("cowork")) {
    return "building";
  }

  if (
    haystack.includes("office") ||
    haystack.includes("suite") ||
    haystack.includes("boardroom")
  ) {
    return "door";
  }

  if (
    haystack.includes("retail") ||
    haystack.includes("shop") ||
    haystack.includes("commercial")
  ) {
    return "store";
  }

  return "grid";
};

export const getSpaceCategoryLabel = (space: SpaceCategoryLike) => {
  const categoryName = space.category?.name?.trim();
  if (categoryName) return categoryName;

  const categorySlug = normalizeSlug(space.category?.slug) || normalizeSlug(space.categorySlug);
  if (categorySlug) return humanizeSlug(categorySlug);

  const legacySpaceType = normalizeLegacySpaceType(space.spaceType);
  if (legacySpaceType) {
    return humanizeSlug(
      LEGACY_CATEGORY_HINTS[legacySpaceType].categorySlugs[0] ?? legacySpaceType
    );
  }

  return "";
};

export const deriveTaxonomyFromSpaces = (spaces: SpaceCategoryLike[]): BrowseTaxonomy => {
  const categoriesBySlug = new Map<string, TaxonomyCategory>();

  for (const space of spaces) {
    const categorySlug = normalizeSlug(space.category?.slug) || normalizeSlug(space.categorySlug);
    if (!categorySlug || categoriesBySlug.has(categorySlug)) continue;

    const legacySpaceType = normalizeLegacySpaceType(space.spaceType);
    const fallbackGroupSlug = legacySpaceType
      ? LEGACY_CATEGORY_HINTS[legacySpaceType].groupSlug
      : space.category?.groupSlug;

    const group = coerceGroup(space.category?.group, fallbackGroupSlug);

    categoriesBySlug.set(categorySlug, {
      group,
      groupSlug: group.slug,
      legacySpaceType: CATEGORY_SLUG_TO_LEGACY.get(categorySlug) ?? legacySpaceType,
      name: getSpaceCategoryLabel(space) || humanizeSlug(categorySlug),
      slug: categorySlug,
      sortOrder: null,
    });
  }

  return normalizeBrowseTaxonomy(Array.from(categoriesBySlug.values()));
};
