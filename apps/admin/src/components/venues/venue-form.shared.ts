export const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

export const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const labelClassName = "mb-1 block text-sm font-medium text-foreground";

export interface VenueFormValues {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  currency: string;
}

export interface VenueFormPayload {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  currency: string;
}

export const createEmptyVenueFormValues = (): VenueFormValues => ({
  name: "",
  shortDescription: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  latitude: null,
  longitude: null,
  images: [],
  currency: "USD",
});

export const buildVenuePayload = (
  formData: VenueFormValues
): VenueFormPayload => ({
  ...formData,
  state: formData.state || null,
  postalCode: formData.postalCode || null,
});

export interface VenueResponse {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  currency: string;
}

export const mapVenueToFormValues = (
  venue: VenueResponse
): VenueFormValues => ({
  name: venue.name,
  shortDescription: venue.shortDescription,
  description: venue.description,
  address: venue.address,
  city: venue.city,
  state: venue.state ?? "",
  country: venue.country,
  postalCode: venue.postalCode ?? "",
  latitude: venue.latitude ?? null,
  longitude: venue.longitude ?? null,
  images: Array.isArray(venue.images) ? venue.images : [],
  currency: venue.currency ?? "USD",
});
