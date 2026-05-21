import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Space } from "@repo/types"
import { formatCurrencyPrice, formatCurrencyPriceFull } from "./currency";

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

/** Convert price (stored in dollars) to a display string (e.g. "$5,000") */
export const formatPrice = (price: number | null | undefined, currency?: string): string | null => {
  if (price == null) return null;
  return formatCurrencyPrice(price, currency);
};

/** Convert price (stored in dollars) to a full display string with cents (e.g. "$5,000.00") */
export const formatPriceFull = (price: number | null | undefined, currency?: string): string => {
  if (price == null) return formatCurrencyPriceFull(0, currency);
  return formatCurrencyPriceFull(price, currency);
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
  space: {
    pricingType: Space["pricingType"] | string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    currency?: string;
  },
  labels: PriceLabels = defaultPriceLabels,
): string => {
  const c = (space as any).currency;
  if (space.pricingType === "HOURLY" && space.pricePerHour)
    return `${formatPrice(space.pricePerHour, c)}${labels.perHr}`;
  if (space.pricingType === "DAILY" && space.pricePerDay)
    return `${formatPrice(space.pricePerDay, c)}${labels.perDay}`;
  if (space.pricingType === "BOTH") {
    if (space.pricePerHour)
      return `${labels.from}${labels.from ? " " : ""}${formatPrice(space.pricePerHour, c)}${labels.perHr}`;
    return `${formatPrice(space.pricePerDay, c)}${labels.perDay}`;
  }
  return labels.contactForPricing;
};
