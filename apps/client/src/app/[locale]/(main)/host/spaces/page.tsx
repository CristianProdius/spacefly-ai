"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  MapPin,
  Users,
  Star,
} from "lucide-react";
import { getPriceDisplay, type PriceLabels } from "@/lib/utils";

interface Space {
  id: number;
  name: string;
  images: string[];
  city: string;
  country: string;
  capacity: number;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricingType: "HOURLY" | "DAILY" | "BOTH";
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  _count?: {
    bookings: number;
  };
}

const HostSpacesPage = () => {
  const { token } = useAuthStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const t = useTranslations("hostSpaces");
  const tCommon = useTranslations("common");

  useEffect(() => {
    fetchSpaces();
  }, [token]);

  const fetchSpaces = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/host/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpaceStatus = async (spaceId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (res.ok) {
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === spaceId ? { ...s, isActive: !currentStatus } : s
          )
        );
      }
    } catch (error) {
      console.error("Error toggling space status:", error);
    }
    setMenuOpen(null);
  };

  const deleteSpace = async (spaceId: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      }
    } catch (error) {
      console.error("Error deleting space:", error);
    }
    setMenuOpen(null);
  };

  const priceLabels: PriceLabels = {
    perHr: tCommon("perHrShort"),
    perDay: tCommon("perDayShort"),
    from: "",
    contactForPricing: "—",
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/host/spaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          {tCommon("addSpace")}
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg mb-4">
            {t("noSpaces")}
          </p>
          <Link
            href="/host/spaces/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            {t("addFirstSpace")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={space.images?.[0] || "/placeholder-space.jpg"}
                    alt={space.name}
                    fill
                    className="object-cover"
                  />
                  {!space.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {tCommon("inactive")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {space.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {space.city}, {space.country}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === space.id ? null : space.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {menuOpen === space.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <Link
                            href={`/spaces/${space.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            {t("viewListing")}
                          </Link>
                          <Link
                            href={`/host/spaces/${space.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            {t("editSpace")}
                          </Link>
                          <button
                            onClick={() =>
                              toggleSpaceStatus(space.id, space.isActive)
                            }
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {space.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                {t("deactivate")}
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                {t("activate")}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteSpace(space.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{space.capacity}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {getPriceDisplay(space, priceLabels)}
                    </span>
                    {space.averageRating != null && space.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900">
                          {space.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({space.totalReviews})
                        </span>
                      </div>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        space.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {space.isActive ? tCommon("active") : tCommon("inactive")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostSpacesPage;
