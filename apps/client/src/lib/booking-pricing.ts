import type { PricingTier, SpaceWithHost } from "@repo/types";

export type BookingType = "hourly" | "daily";

export interface BookingPricingInput {
  bookingType: BookingType;
  endDate: string;
  endTime: string;
  space: Pick<
    SpaceWithHost,
    "cleaningFee" | "pricePerDay" | "pricePerHour" | "pricingTiers" | "pricingType"
  >;
  startDate: string;
  startTime: string;
}

export interface AppliedPricingTier {
  label: string;
  minutes: number;
  price: number;
  units: number;
}

export interface BookingPricing {
  appliedTier: AppliedPricingTier | null;
  cleaningFee: number;
  days: number;
  hours: number;
  serviceFee: number;
  subtotal: number;
  totalAmount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const minutesFromTime = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const inclusiveDayCount = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return days > 0 ? days : 1;
};

const bestPricingTier = (
  pricingTiers: PricingTier[] | undefined,
  totalMinutes: number
) => {
  const eligibleTiers = [...(pricingTiers ?? [])]
    .filter((tier) => tier.minutes <= totalMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  return eligibleTiers.at(-1) ?? null;
};

export const calculateBookingPricing = ({
  bookingType,
  endDate,
  endTime,
  space,
  startDate,
  startTime,
}: BookingPricingInput): BookingPricing | null => {
  if (!startDate) return null;
  if (bookingType === "daily" && !endDate) return null;

  const days =
    bookingType === "daily" ? inclusiveDayCount(startDate, endDate) : 1;
  let totalMinutes = days * 24 * 60;
  let hours = 0;

  if (bookingType === "hourly") {
    const minutes = minutesFromTime(endTime) - minutesFromTime(startTime);
    totalMinutes = minutes > 0 ? minutes : 60;
    hours = totalMinutes / 60;
  }

  let subtotal = 0;
  let appliedTier: AppliedPricingTier | null = null;
  const tier = bestPricingTier(space.pricingTiers, totalMinutes);

  if (tier) {
    const units = Math.ceil(totalMinutes / tier.minutes);
    subtotal = roundCurrency(units * tier.price);
    appliedTier = {
      label: tier.label,
      minutes: tier.minutes,
      price: tier.price,
      units,
    };
  } else if (bookingType === "hourly" && space.pricePerHour) {
    subtotal = roundCurrency(hours * space.pricePerHour);
  } else if (bookingType === "daily" && space.pricePerDay) {
    subtotal = roundCurrency(days * space.pricePerDay);
  }

  const cleaningFee = roundCurrency(space.cleaningFee ?? 0);
  const serviceFee = roundCurrency(subtotal * 0.1);
  const totalAmount = roundCurrency(subtotal + cleaningFee + serviceFee);

  return {
    appliedTier,
    cleaningFee,
    days,
    hours,
    serviceFee,
    subtotal,
    totalAmount,
  };
};
