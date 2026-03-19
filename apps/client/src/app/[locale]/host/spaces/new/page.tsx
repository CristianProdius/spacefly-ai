"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import useAuthStore from "@/stores/authStore";
import { useTranslations } from "next-intl";
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface SpaceCategory {
  id: number;
  name: string;
  slug: string;
}

interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
}

const NewSpacePage = () => {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpaceCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const t = useTranslations("newSpace");
  const tSpaces = useTranslations("spaces");
  const tCommon = useTranslations("common");

  const spaceTypes = [
    { value: "OFFICE_DESK", label: tSpaces("spaceTypes.OFFICE_DESK") },
    { value: "PRIVATE_OFFICE", label: tSpaces("spaceTypes.PRIVATE_OFFICE") },
    { value: "MEETING_ROOM", label: tSpaces("spaceTypes.MEETING_ROOM") },
    { value: "EVENT_VENUE", label: tSpaces("spaceTypes.EVENT_VENUE") },
    { value: "WEDDING_VENUE", label: tSpaces("spaceTypes.WEDDING_VENUE") },
    { value: "COWORKING_SPACE", label: tSpaces("spaceTypes.COWORKING_SPACE") },
  ];

  const pricingTypes = [
    { value: "HOURLY", label: t("pricingTypes.HOURLY") },
    { value: "DAILY", label: t("pricingTypes.DAILY") },
    { value: "BOTH", label: t("pricingTypes.BOTH") },
  ];

  const cancellationPolicies = [
    { value: "FLEXIBLE", label: t("cancellationPolicies.FLEXIBLE") },
    { value: "MODERATE", label: t("cancellationPolicies.MODERATE") },
    { value: "STRICT", label: t("cancellationPolicies.STRICT") },
    { value: "NON_REFUNDABLE", label: t("cancellationPolicies.NON_REFUNDABLE") },
  ];

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    spaceType: "MEETING_ROOM",
    pricingType: "BOTH",
    pricePerHour: "",
    pricePerDay: "",
    capacity: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    instantBook: false,
    cancellationPolicy: "MODERATE",
    houseRules: "",
    categorySlug: "",
    amenityIds: [] as number[],
    images: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, amenRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/categories`),
          fetch(`${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/amenities`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
        if (amenRes.ok) {
          const amenData = await amenRes.json();
          setAmenities(amenData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "flexispace");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.secure_url],
          }));
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenityId: number) => {
    setFormData((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        pricePerHour: formData.pricePerHour
          ? parseFloat(formData.pricePerHour)
          : null,
        pricePerDay: formData.pricePerDay
          ? parseFloat(formData.pricePerDay)
          : null,
        capacity: parseInt(formData.capacity),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create space");
      }

      const space = await res.json();
      router.push(`/host/spaces`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/host/spaces"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        {tCommon("backToSpaces")}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("basicInfo")}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("spaceName")}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("spaceNamePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("shortDescription")}
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("shortDescPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fullDescription")}
              </label>
              <textarea
                required
                minLength={50}
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("fullDescPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("spaceType")}
                </label>
                <select
                  required
                  value={formData.spaceType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      spaceType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  {spaceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <select
                  required
                  value={formData.categorySlug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySlug: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                >
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("capacity")}
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("capacityPlaceholder")}
              />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("images")}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <Image src={img} alt={`Space ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">{t("upload")}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            {t("imagesHint")}
          </p>
        </section>

        {/* Location */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("location")}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("address")}
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("addressPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("city")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("state")}
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("country")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("postalCode")}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("pricing")}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("pricingType")}
              </label>
              <select
                required
                value={formData.pricingType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingType: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {pricingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(formData.pricingType === "HOURLY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("pricePerHour")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerHour: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="$"
                  />
                </div>
              )}

              {(formData.pricingType === "DAILY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("pricePerDay")}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerDay: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    placeholder="$"
                  />
                </div>
              )}

            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("amenitiesTitle")}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {amenities.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                  formData.amenityIds.includes(amenity.id)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {formData.amenityIds.includes(amenity.id) && (
                  <Check className="w-4 h-4" />
                )}
                {amenity.name}
              </button>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("settings")}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("cancellationPolicy")}
              </label>
              <select
                required
                value={formData.cancellationPolicy}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cancellationPolicy: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {cancellationPolicies.map((policy) => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("houseRules")}
              </label>
              <textarea
                rows={3}
                value={formData.houseRules}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    houseRules: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                placeholder={t("houseRulesPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="instantBook"
                checked={formData.instantBook}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    instantBook: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="instantBook" className="text-sm text-gray-700">
                {t("instantBook")}
              </label>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/host/spaces"
            className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900"
          >
            {tCommon("cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading || formData.images.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("createSpace")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSpacePage;
