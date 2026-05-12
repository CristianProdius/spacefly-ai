export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

export const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const labelClassName = "mb-1 block text-sm font-medium text-foreground";

export interface VenueFormValues {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string>;
  shortDescTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl: string;
  currency: string;
}

export interface VenueFormPayload {
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations: Record<string, string> | null;
  shortDescTranslations: Record<string, string> | null;
  descriptionTranslations: Record<string, string> | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl: string | null;
  currency: string;
}

export const createEmptyVenueFormValues = (): VenueFormValues => ({
  name: "",
  shortDescription: "",
  description: "",
  nameTranslations: {},
  shortDescTranslations: {},
  descriptionTranslations: {},
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  images: [],
  videoUrl: "",
  currency: "USD",
});

const emptyToNull = (obj: Record<string, string>): Record<string, string> | null =>
  Object.keys(obj).length === 0 ? null : obj;

export const buildVenuePayload = (
  formData: VenueFormValues
): VenueFormPayload => ({
  ...formData,
  nameTranslations: emptyToNull(formData.nameTranslations),
  shortDescTranslations: emptyToNull(formData.shortDescTranslations),
  descriptionTranslations: emptyToNull(formData.descriptionTranslations),
  videoUrl: formData.videoUrl || null,
  state: formData.state || null,
  postalCode: formData.postalCode || null,
});

export interface VenueResponse {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations?: Record<string, string> | null;
  shortDescTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  videoUrl?: string | null;
  currency: string;
}

export const mapVenueToFormValues = (
  venue: VenueResponse
): VenueFormValues => ({
  name: venue.name,
  shortDescription: venue.shortDescription,
  description: venue.description,
  nameTranslations: venue.nameTranslations ?? {},
  shortDescTranslations: venue.shortDescTranslations ?? {},
  descriptionTranslations: venue.descriptionTranslations ?? {},
  address: venue.address,
  city: venue.city,
  state: venue.state ?? "",
  country: venue.country,
  postalCode: venue.postalCode ?? "",
  latitude: venue.latitude ?? null,
  longitude: venue.longitude ?? null,
  images: Array.isArray(venue.images) ? venue.images : [],
  videoUrl: venue.videoUrl ?? "",
  currency: venue.currency ?? "USD",
});
