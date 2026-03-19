"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import {
  Building2,
  DollarSign,
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

const BecomeHostPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useTranslations("becomeHost");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!authLoading && user?.role === "HOST") {
      router.push("/host");
    }
  }, [authLoading, user, router]);

  const handleBecomeHost = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/become-host");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/auth/become-host`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to become a host");
      }

      const data = await res.json();

      // Update the user in the store with new role
      if (data.user) {
        setUser(data.user);
      }

      setSuccess(true);

      // Redirect to host dashboard after a short delay
      setTimeout(() => {
        router.push("/host");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          {t("successTitle")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("successDescription")}
        </p>
        <p className="text-gray-500">{t("redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Hero Section */}
      <section className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          {t("heroTitle")}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {t("heroDescription")}
        </p>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleBecomeHost}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("processingText")}
            </>
          ) : (
            <>
              {t("startHosting")}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {!isAuthenticated && (() => {
          const parts = t("signInToContinue", { link: "__LINK__" }).split("__LINK__");
          return (
            <p className="text-sm text-gray-500 mt-4">
              {parts[0]}
              <Link href="/login?redirect=/become-host" className="text-indigo-600 hover:underline">
                {t("signInLink")}
              </Link>
              {parts[1]}
            </p>
          );
        })()}
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("earnExtraIncome")}</h3>
          <p className="text-gray-600 text-sm">
            {t("earnExtraIncomeDesc")}
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("flexibleSchedule")}</h3>
          <p className="text-gray-600 text-sm">
            {t("flexibleScheduleDesc")}
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("securePayments")}</h3>
          <p className="text-gray-600 text-sm">
            {t("securePaymentsDesc")}
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("easyManagement")}</h3>
          <p className="text-gray-600 text-sm">
            {t("easyManagementDesc")}
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 tracking-tight">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t("createListing")}</h3>
            <p className="text-gray-600 text-sm">
              {t("createListingDesc")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t("acceptBookings")}</h3>
            <p className="text-gray-600 text-sm">
              {t("acceptBookingsDesc")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t("getPaid")}</h3>
            <p className="text-gray-600 text-sm">
              {t("getPaidDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Space Types */}
      <section className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 tracking-tight">
          {t("whatCanYouHost")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { name: t("officeDesks"), emoji: "\u{1F5A5}\u{FE0F}" },
            { name: t("privateOffices"), emoji: "\u{1F3E2}" },
            { name: t("meetingRooms"), emoji: "\u{1F465}" },
            { name: t("eventVenues"), emoji: "\u{1F389}" },
            { name: t("weddingVenues"), emoji: "\u{1F492}" },
            { name: t("coworkingSpaces"), emoji: "\u{1F3E0}" },
          ].map((type) => (
            <div key={type.name} className="p-4 bg-white rounded-lg border border-gray-100 shadow-[var(--shadow-sm)]">
              <div className="text-3xl mb-2">{type.emoji}</div>
              <p className="text-sm font-medium text-gray-900">{type.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
          {t("readyToStart")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t("readyToStartDesc")}
        </p>
        <button
          onClick={handleBecomeHost}
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("processingText")}
            </>
          ) : (
            <>
              {tCommon("becomeAHost")}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </section>
    </div>
  );
};

export default BecomeHostPage;
