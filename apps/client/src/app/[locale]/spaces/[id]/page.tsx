import { SpaceWithHost } from "@repo/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Users,
  Star,
  Clock,
  Calendar,
  Check,
} from "lucide-react";
import BookingForm from "./BookingForm";
import ReviewSection from "./ReviewSection";
import { getTranslations } from "next-intl/server";

// Parse images field - handles both array and stringified array
const parseImages = (images: unknown): string[] => {
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

async function getSpace(id: string): Promise<SpaceWithHost | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

const SpaceDetailPage = async ({ params }: SpaceDetailPageProps) => {
  const { id } = await params;
  const space = await getSpace(id);

  if (!space) {
    notFound();
  }

  const t = await getTranslations("spaces");
  const tCancellation = await getTranslations("cancellation");
  const tCommon = await getTranslations("common");

  const images = parseImages(space.images);

  const cancellationPolicy = space.cancellationPolicy;
  const cancellationLabel = ["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"].includes(cancellationPolicy)
    ? tCancellation(cancellationPolicy as "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE")
    : cancellationPolicy;
  const cancellationDesc = ["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"].includes(cancellationPolicy)
    ? tCancellation(`${cancellationPolicy}_DESC` as "FLEXIBLE_DESC" | "MODERATE_DESC" | "STRICT_DESC" | "NON_REFUNDABLE_DESC")
    : t("contactHostForDetails");

  return (
    <div className="max-w-7xl mx-auto">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="relative aspect-[4/3] md:aspect-auto md:row-span-2">
          <Image
            src={images[0] || "/placeholder-space.jpg"}
            alt={space.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(1, 5).map((img, idx) => (
            <div key={idx} className="relative aspect-[4/3]">
              <Image
                src={img}
                alt={`${space.name} - ${idx + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                {t(`spaceTypes.${space.spaceType}`)}
              </span>
              {space.instantBook && (
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                  {tCommon("instantBook")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              {space.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {space.address}, {space.city}, {space.country}
                </span>
              </div>
              {space.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{space.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">
                    ({t("reviewsLabel", { count: space.totalReviews ?? 0 })})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="relative w-14 h-14 rounded-full overflow-hidden">
              <Image
                src={space.host?.image || "/default-avatar.png"}
                alt={space.host?.name || "Host"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {t("hostedBy", { name: space.host?.name || "Unknown" })}
              </p>
              {space.host?.hostingSince && (
                <p className="text-sm text-gray-500">
                  {t("hostingSince", {
                    year: new Date(space.host.hostingSince).getFullYear(),
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
              <Users className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{space.capacity}</p>
                <p className="text-sm text-gray-500">{t("capacity")}</p>
              </div>
            </div>
            {space.pricingType === "HOURLY" || space.pricingType === "BOTH" ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <Clock className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    ${space.pricePerHour}{tCommon("perHrShort")}
                  </p>
                  <p className="text-sm text-gray-500">{t("hourlyRate")}</p>
                </div>
              </div>
            ) : null}
            {space.pricingType === "DAILY" || space.pricingType === "BOTH" ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <Calendar className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    ${space.pricePerDay}{tCommon("perDayShort")}
                  </p>
                  <p className="text-sm text-gray-500">{t("dailyRate")}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("aboutThisSpace")}
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {space.description}
            </p>
          </div>

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                {t("amenities")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {space.amenities.map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center gap-2 text-gray-600"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{sa.amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {space.houseRules && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                {t("houseRules")}
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {space.houseRules}
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
              {t("cancellationPolicy")}
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-medium text-gray-900">{cancellationLabel}</p>
              <p className="text-gray-600 text-sm mt-1">
                {cancellationDesc}
              </p>
            </div>
          </div>

          {/* Reviews */}
          <ReviewSection spaceId={space.id} />
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <BookingForm space={space} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailPage;
