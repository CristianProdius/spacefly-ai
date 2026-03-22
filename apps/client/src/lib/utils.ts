import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Space } from "@repo/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse images field — handles both array and stringified array */
export const parseImages = (images: unknown): string[] => {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** Convert price stored in cents to a display string (e.g. "$25") */
export const formatPrice = (priceInCents: number | null): string | null => {
  if (!priceInCents) return null;
  return `$${(priceInCents / 100).toFixed(0)}`;
};

export interface PriceLabels {
  perHr: string;
  perDay: string;
  from: string;
  contactForPricing: string;
}

export const defaultPriceLabels: PriceLabels = {
  perHr: "/hr",
  perDay: "/day",
  from: "From",
  contactForPricing: "Contact for pricing",
};

export const compactPriceLabels: PriceLabels = {
  perHr: "/hr",
  perDay: "/day",
  from: "",
  contactForPricing: "Contact",
};

export const getPriceDisplay = (
  space: Pick<Space, "pricingType" | "pricePerHour" | "pricePerDay">,
  labels: PriceLabels = defaultPriceLabels,
): string => {
  if (space.pricingType === "HOURLY" && space.pricePerHour)
    return `${formatPrice(space.pricePerHour)}${labels.perHr}`;
  if (space.pricingType === "DAILY" && space.pricePerDay)
    return `${formatPrice(space.pricePerDay)}${labels.perDay}`;
  if (space.pricingType === "BOTH") {
    if (space.pricePerHour)
      return `${labels.from}${labels.from ? " " : ""}${formatPrice(space.pricePerHour)}${labels.perHr}`;
    return `${formatPrice(space.pricePerDay)}${labels.perDay}`;
  }
  return labels.contactForPricing;
};
