import type {
  CancellationPolicy,
  PricingType,
  Space,
  SpaceType,
} from "@repo/types";

import {
  resolveLegacySpaceType,
  type NormalizedTaxonomyCategory,
} from "@/lib/taxonomy";

export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

export const pricingTypes: Array<{ value: PricingType; label: string }> = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
  { value: "BOTH", label: "Both" },
];

export const cancellationPolicies: Array<{
  value: CancellationPolicy;
  label: string;
}> = [
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "MODERATE", label: "Moderate" },
  { value: "STRICT", label: "Strict" },
  { value: "NON_REFUNDABLE", label: "Non-Refundable" },
];

export const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const labelClassName = "mb-1 block text-sm font-medium text-foreground";

export interface SpaceFormValues {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string>;
  shortDescTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  spaceType: SpaceType;
  pricingType: PricingType;
  pricePerHour: string;
  pricePerDay: string;
  capacity: string;
  venueId: number | null;
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  houseRules: string;
  categorySlug: string;
  amenityIds: number[];
  images: string[];
  videoUrl: string;
  currency: string;
  pricingTiers: Array<{ minutes: number; label: string; price: string }>;
}

export interface SpaceFormPayload {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string> | null;
  shortDescTranslations: Record<string, string> | null;
  descriptionTranslations: Record<string, string> | null;
  spaceType: SpaceType;
  pricingType: PricingType;
  pricePerHour: number | null;
  pricePerDay: number | null;
  capacity: number;
  venueId: number | null;
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  houseRules: string;
  categorySlug: string;
  amenityIds: number[];
  images: string[];
  videoUrl: string | null;
  currency: string;
  pricingTiers: Array<{ minutes: number; label: string; price: number }>;
}

export const createEmptySpaceFormValues = (): SpaceFormValues => ({
  name: "",
  shortDescription: "",
  description: "",
  nameTranslations: {},
  shortDescTranslations: {},
  descriptionTranslations: {},
  spaceType: "MEETING_ROOM",
  pricingType: "BOTH",
  pricePerHour: "",
  pricePerDay: "",
  capacity: "",
  venueId: null,
  instantBook: false,
  cancellationPolicy: "MODERATE",
  houseRules: "",
  categorySlug: "",
  amenityIds: [],
  images: [],
  videoUrl: "",
  currency: "USD",
  pricingTiers: [],
});

const emptyToNull = (obj: Record<string, string>): Record<string, string> | null =>
  Object.keys(obj).length === 0 ? null : obj;

export const buildSpacePayload = (
  formData: SpaceFormValues,
  category?: Pick<NormalizedTaxonomyCategory, "legacySpaceType" | "slug" | "spaceType">
): SpaceFormPayload => ({
  ...formData,
  nameTranslations: emptyToNull(formData.nameTranslations),
  shortDescTranslations: emptyToNull(formData.shortDescTranslations),
  descriptionTranslations: emptyToNull(formData.descriptionTranslations),
  videoUrl: formData.videoUrl || null,
  spaceType: category
    ? resolveLegacySpaceType(category, formData.spaceType)
    : formData.spaceType,
  pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
  pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : null,
  capacity: parseInt(formData.capacity, 10),
  venueId: formData.venueId,
  currency: formData.currency,
  pricingTiers: formData.pricingTiers
    .filter((t) => t.price !== "")
    .map((t) => ({ minutes: t.minutes, label: t.label, price: parseFloat(t.price) || 0 })),
});

export const mapSpaceToFormValues = (
  space: Pick<
    Space,
    | "name"
    | "shortDescription"
    | "description"
    | "spaceType"
    | "pricingType"
    | "pricePerHour"
    | "pricePerDay"
    | "capacity"
    | "instantBook"
    | "cancellationPolicy"
    | "houseRules"
    | "categorySlug"
    | "images"
    | "amenities"
    | "currency"
    | "pricingTiers"
  > & {
    venueId?: number | null;
    videoUrl?: string | null;
    nameTranslations?: Record<string, string> | null;
    shortDescTranslations?: Record<string, string> | null;
    descriptionTranslations?: Record<string, string> | null;
  }
): SpaceFormValues => ({
  name: space.name,
  shortDescription: space.shortDescription,
  description: space.description,
  nameTranslations: space.nameTranslations ?? {},
  shortDescTranslations: space.shortDescTranslations ?? {},
  descriptionTranslations: space.descriptionTranslations ?? {},
  spaceType: space.spaceType,
  pricingType: space.pricingType,
  pricePerHour: space.pricePerHour?.toString() ?? "",
  pricePerDay: space.pricePerDay?.toString() ?? "",
  capacity: space.capacity.toString(),
  venueId: space.venueId ?? null,
  instantBook: space.instantBook,
  cancellationPolicy: space.cancellationPolicy,
  houseRules: space.houseRules ?? "",
  categorySlug: space.categorySlug,
  amenityIds: space.amenities?.map((spaceAmenity) => spaceAmenity.amenityId) ?? [],
  images: Array.isArray(space.images) ? space.images : [],
  videoUrl: space.videoUrl ?? "",
  currency: space.currency ?? "USD",
  pricingTiers: (space.pricingTiers ?? []).map((t) => ({
    minutes: t.minutes,
    label: t.label,
    price: t.price.toString(),
  })),
});
