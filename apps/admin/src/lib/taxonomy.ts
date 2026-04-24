import {
  deriveLegacySpaceTypeFromCategorySlug,
  SPACE_CATEGORY_GROUPS as CANONICAL_SPACE_CATEGORY_GROUPS,
  type SpaceType,
} from "@repo/types";

export const SPACE_CATEGORY_GROUPS = CANONICAL_SPACE_CATEGORY_GROUPS;

export const SPACE_CATEGORY_GROUP_SLUGS = SPACE_CATEGORY_GROUPS.map(
  (group) => group.slug
) as [
  (typeof SPACE_CATEGORY_GROUPS)[number]["slug"],
  ...(typeof SPACE_CATEGORY_GROUPS)[number]["slug"][],
];

export type SpaceCategoryGroupSlug =
  (typeof SPACE_CATEGORY_GROUPS)[number]["slug"];

interface TaxonomyGroupLike {
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
}

interface TaxonomyCountLike {
  spaces?: number | null;
}

export interface TaxonomyCategoryLike {
  _count?: TaxonomyCountLike | null;
  description?: string | null;
  group?: TaxonomyGroupLike | null;
  groupSlug?: string | null;
  icon?: string | null;
  id: number;
  legacySpaceType?: SpaceType | null;
  name: string;
  slug: string;
  sortOrder?: number | null;
  spaceType?: SpaceType | null;
}

export interface TaxonomyGroupResponseLike {
  categories?: TaxonomyCategoryLike[] | null;
  name?: string | null;
  slug?: string | null;
  sortOrder?: number | null;
}

export type TaxonomyApiResponse = Array<
  TaxonomyCategoryLike | TaxonomyGroupResponseLike
>;

export interface NormalizedTaxonomyGroup {
  name: string;
  slug: string;
  sortOrder: number;
}

export interface NormalizedTaxonomyCategory extends TaxonomyCategoryLike {
  _count?: {
    spaces: number;
  };
  group: NormalizedTaxonomyGroup;
  groupSlug: string;
}

export interface NormalizedTaxonomyCategoryGroup extends NormalizedTaxonomyGroup {
  categories: NormalizedTaxonomyCategory[];
}

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "meeting-room": "meeting-training-room",
};

const groupCatalogBySlug = new Map(
  SPACE_CATEGORY_GROUPS.map((group) => [group.slug, group] as const)
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCategoryLike = (value: unknown): value is TaxonomyCategoryLike =>
  isRecord(value) &&
  typeof value.id === "number" &&
  typeof value.name === "string" &&
  typeof value.slug === "string";

const isSpaceType = (value: unknown): value is SpaceType =>
  value === "OFFICE_DESK" ||
  value === "PRIVATE_OFFICE" ||
  value === "MEETING_ROOM" ||
  value === "EVENT_VENUE" ||
  value === "WEDDING_VENUE" ||
  value === "COWORKING_SPACE";

const toTitleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeGroupMeta = (
  slug: string | null | undefined,
  name: string | null | undefined,
  sortOrder: number | null | undefined
): NormalizedTaxonomyGroup => {
  const fallback = slug ? groupCatalogBySlug.get(slug as SpaceCategoryGroupSlug) : null;

  return {
    name: name ?? fallback?.name ?? (slug ? toTitleCase(slug) : "Unassigned"),
    slug: slug ?? "unassigned",
    sortOrder: sortOrder ?? fallback?.sortOrder ?? Number.MAX_SAFE_INTEGER,
  };
};

const normalizeCategory = (
  category: TaxonomyCategoryLike,
  parentGroup?: TaxonomyGroupResponseLike
): NormalizedTaxonomyCategory => {
  const inheritedGroup = category.group;
  const group = normalizeGroupMeta(
    category.groupSlug ?? parentGroup?.slug,
    inheritedGroup?.name ?? parentGroup?.name,
    inheritedGroup?.sortOrder ?? parentGroup?.sortOrder
  );

  return {
    ...category,
    _count:
      category._count && typeof category._count.spaces === "number"
        ? { spaces: category._count.spaces }
        : undefined,
    group,
    groupSlug: group.slug,
    legacySpaceType: isSpaceType(category.legacySpaceType)
      ? category.legacySpaceType
      : undefined,
    sortOrder: category.sortOrder ?? undefined,
    spaceType: isSpaceType(category.spaceType) ? category.spaceType : undefined,
  };
};

const compareBySortOrderThenName = (
  left: { name: string; sortOrder?: number | null },
  right: { name: string; sortOrder?: number | null }
) => {
  const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.name.localeCompare(right.name);
};

export const normalizeCategoryGroups = (
  input: unknown
): NormalizedTaxonomyCategoryGroup[] => {
  const grouped = new Map<string, NormalizedTaxonomyCategoryGroup>(
    SPACE_CATEGORY_GROUPS.map((group) => [
      group.slug,
      {
        ...group,
        categories: [],
      },
    ])
  );

  if (!Array.isArray(input)) {
    return Array.from(grouped.values());
  }

  for (const entry of input) {
    if (!isRecord(entry)) {
      continue;
    }

    if (Array.isArray(entry.categories)) {
      const group = normalizeGroupMeta(
        typeof entry.slug === "string" ? entry.slug : null,
        typeof entry.name === "string" ? entry.name : null,
        typeof entry.sortOrder === "number" ? entry.sortOrder : null
      );
      const categories = entry.categories
        .filter(isCategoryLike)
        .map((category) => normalizeCategory(category, entry));
      const currentGroup = grouped.get(group.slug);

      grouped.set(group.slug, {
        ...group,
        categories: [...(currentGroup?.categories ?? []), ...categories].sort(
          compareBySortOrderThenName
        ),
      });

      continue;
    }

    if (!isCategoryLike(entry)) {
      continue;
    }

    const category = normalizeCategory(entry);
    const currentGroup = grouped.get(category.groupSlug) ?? {
      ...category.group,
      categories: [],
    };

    grouped.set(category.groupSlug, {
      ...currentGroup,
      categories: [...currentGroup.categories, category].sort(compareBySortOrderThenName),
    });
  }

  return Array.from(grouped.values()).sort(compareBySortOrderThenName);
};

export const flattenCategoryGroups = (
  groups: NormalizedTaxonomyCategoryGroup[]
): NormalizedTaxonomyCategory[] =>
  groups.flatMap((group) => group.categories);

export const findCategoryBySlug = (
  categories: NormalizedTaxonomyCategory[],
  slug: string
) => categories.find((category) => category.slug === slug);

export const normalizeCategorySlug = (
  slug: string,
  categories: NormalizedTaxonomyCategory[]
) => {
  if (findCategoryBySlug(categories, slug)) {
    return slug;
  }

  const alias = CATEGORY_SLUG_ALIASES[slug];
  return alias && findCategoryBySlug(categories, alias) ? alias : slug;
};

export const resolveLegacySpaceType = (
  category: Pick<NormalizedTaxonomyCategory, "legacySpaceType" | "slug" | "spaceType">,
  fallback: SpaceType
): SpaceType =>
  category.legacySpaceType ??
  category.spaceType ??
  deriveLegacySpaceTypeFromCategorySlug(category.slug) ??
  fallback;
