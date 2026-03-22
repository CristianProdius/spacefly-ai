"use client";

import { SpaceWithHost } from "@repo/types";
import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Clock, Users, ChevronDown } from "lucide-react";
import DatePicker from "@/components/DatePicker";
import useBookingStore from "@/stores/bookingStore";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import { formatPrice, formatPriceFull } from "@/lib/utils";

interface BookingFormProps {
  space: SpaceWithHost;
}

const BookingForm = ({ space }: BookingFormProps) => {
  const router = useRouter();
  const { setDraft } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");

  const [bookingType, setBookingType] = useState<"hourly" | "daily">(
    space.pricingType === "DAILY" ? "daily" : "hourly"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);

  const canBookHourly = space.pricingType === "HOURLY" || space.pricingType === "BOTH";
  const canBookDaily = space.pricingType === "DAILY" || space.pricingType === "BOTH";

  const startHour = parseInt(startTime.split(":")[0]!);

  const pricing = useMemo(() => {
    if (!startDate) return null;

    let subtotal = 0;
    let hours = 0;
    let days = 0;

    if (bookingType === "hourly" && space.pricePerHour) {
      const end = parseInt(endTime.split(":")[0]!);
      hours = end - startHour;
      if (hours <= 0) hours = 1;
      subtotal = hours * space.pricePerHour;
    } else if (bookingType === "daily" && space.pricePerDay && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days <= 0) days = 1;
      subtotal = days * space.pricePerDay;
    }

    const cleaningFee = subtotal * 0.05; // 5% cleaning fee
    const serviceFee = subtotal * 0.1; // 10% service fee
    const totalAmount = subtotal + cleaningFee + serviceFee;

    return {
      hours,
      days,
      subtotal,
      cleaningFee,
      serviceFee,
      totalAmount,
    };
  }, [bookingType, startDate, endDate, startTime, endTime, space, startHour]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/spaces/" + space.id);
      return;
    }

    if (!pricing || !startDate) return;

    setDraft({
      spaceId: space.id,
      spaceName: space.name,
      spaceImage: space.images?.[0] || "",
      hostId: space.hostId,
      hostName: space.host?.name || tCommon("unknown"),
      startDate,
      endDate: bookingType === "daily" ? endDate : startDate,
      startTime: bookingType === "hourly" ? startTime : undefined,
      endTime: bookingType === "hourly" ? endTime : undefined,
      guests,
      pricePerHour: space.pricePerHour || undefined,
      pricePerDay: space.pricePerDay || undefined,
      isHourly: bookingType === "hourly",
      subtotal: pricing.subtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      totalAmount: pricing.totalAmount,
    });

    router.push("/bookings/checkout");
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-[var(--shadow-lg)]">
      {/* Price Display */}
      <div className="flex items-baseline gap-1 mb-6">
        {bookingType === "hourly" && space.pricePerHour ? (
          <>
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(space.pricePerHour)}
            </span>
            <span className="text-muted">{tCommon("perHour")}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(space.pricePerDay)}
            </span>
            <span className="text-muted">{tCommon("perDay")}</span>
          </>
        )}
      </div>

      {/* Booking Type Toggle */}
      {canBookHourly && canBookDaily && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setBookingType("hourly")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              bookingType === "hourly"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("hourly")}
          </button>
          <button
            onClick={() => setBookingType("daily")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              bookingType === "daily"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-subtle text-muted hover:bg-border"
            }`}
          >
            {tCommon("daily")}
          </button>
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="booking-start-date" className="block text-sm font-medium text-muted mb-1">
            {bookingType === "hourly" ? t("date") : t("checkIn")}
          </label>
          <div className="relative">
            <DatePicker
              id="booking-start-date"
              value={startDate}
              minDate={minDate}
              placeholder={bookingType === "hourly" ? t("date") : t("checkIn")}
              onChange={(date) => {
                setStartDate(date);
                if (!endDate || date > endDate) setEndDate(date);
              }}
            />
          </div>
        </div>

        {bookingType === "daily" && (
          <div>
            <label htmlFor="booking-end-date" className="block text-sm font-medium text-muted mb-1">
              {t("checkOut")}
            </label>
            <div className="relative">
              <DatePicker
                id="booking-end-date"
                value={endDate}
                minDate={startDate || minDate}
                placeholder={t("checkOut")}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>
        )}

        {bookingType === "hourly" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-start-time" className="block text-sm font-medium text-muted mb-1">
                {t("startTime")}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <select
                  id="booking-start-time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    const newStart = parseInt(e.target.value.split(":")[0]!);
                    const currentEnd = parseInt(endTime.split(":")[0]!);
                    if (currentEnd <= newStart) {
                      setEndTime(`${(newStart + 1).toString().padStart(2, "0")}:00`);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  {Array.from({ length: 23 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="booking-end-time" className="block text-sm font-medium text-muted mb-1">
                {t("endTime")}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <select
                  id="booking-end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                >
                  {Array.from({ length: 24 - startHour - 1 }, (_, i) => {
                    const hour = startHour + 1 + i;
                    return (
                      <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                        {hour.toString().padStart(2, "0")}:00
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <label htmlFor="booking-guests" className="block text-sm font-medium text-muted mb-1">
            {t("numberOfGuests")}
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <select
              id="booking-guests"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
            >
              {Array.from({ length: space.capacity }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {tCommon("guest", { count: i + 1 })}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      {pricing && startDate && (
        <div className="border-t border-border pt-4 mb-6 space-y-2">
          <div className="flex justify-between text-muted">
            <span>
              {bookingType === "hourly"
                ? t("hoursCalc", { price: (space.pricePerHour ?? 0) / 100, count: pricing.hours })
                : t("daysCalc", { price: (space.pricePerDay ?? 0) / 100, count: pricing.days })}
            </span>
            <span>{formatPriceFull(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{tCommon("cleaningFee")}</span>
            <span>{formatPriceFull(pricing.cleaningFee)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{tCommon("serviceFee")}</span>
            <span>{formatPriceFull(pricing.serviceFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-foreground pt-2 border-t border-border">
            <span>{tCommon("total")}</span>
            <span>{formatPriceFull(pricing.totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBooking}
        disabled={!startDate || (bookingType === "daily" && !endDate)}
        className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
      >
        {space.instantBook ? t("bookNow") : t("requestToBook")}
      </button>

      {!space.instantBook && (
        <p className="text-center text-sm text-muted mt-2">
          {t("depositDisclaimer")}
        </p>
      )}
    </div>
  );
};

export default BookingForm;
