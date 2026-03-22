import { SpaceWithHost } from "@repo/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Users, Star, Check, RotateCcw } from "lucide-react";
import BookingForm from "./BookingForm";
import ReviewSection from "./ReviewSection";
import LocationMapLoader from "./LocationMapLoader";
import { getTranslations } from "next-intl/server";
import { parseImages } from "@/lib/utils";

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

  const hostName = space.host?.name || tCommon("unknown");
  const hostInitials = hostName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const cancellationPolicy = space.cancellationPolicy;
  const cancellationLabel = ["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"].includes(cancellationPolicy)
    ? tCancellation(cancellationPolicy as "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE")
    : cancellationPolicy;
  const cancellationDesc = ["FLEXIBLE", "MODERATE", "STRICT", "NON_REFUNDABLE"].includes(cancellationPolicy)
    ? tCancellation(`${cancellationPolicy}_DESC` as "FLEXIBLE_DESC" | "MODERATE_DESC" | "STRICT_DESC" | "NON_REFUNDABLE_DESC")
    : t("contactHostForDetails");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Image Gallery */}
      {images.length <= 1 ? (
        <div className="mb-8 rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
          <div className="relative aspect-[21/9]">
            <Image
              src={images[0] || "/placeholder-space.jpg"}
              alt={space.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
          <div className="relative aspect-[4/3] md:aspect-auto md:row-span-2 md:min-h-[400px]">
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted mb-2">
              <span className="bg-subtle px-2 py-1 rounded border border-border">
                {t(`spaceTypes.${space.spaceType}`)}
              </span>
              {space.instantBook && (
                <span className="bg-success/10 text-success px-2 py-1 rounded border border-success/20">
                  {tCommon("instantBook")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
              {space.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <span>
                  {space.address}, {space.city}, {space.country}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span>{t("upToGuests", { count: space.capacity })}</span>
              </div>
              {space.averageRating != null && space.averageRating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-medium">{space.averageRating.toFixed(1)}</span>
                  <span className="text-muted">
                    ({t("reviewsLabel", { count: space.totalReviews ?? 0 })})
                  </span>
                </div>
              ) : (
                <span className="text-muted text-sm">{t("noReviewsYet")}</span>
              )}
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-4">
            {space.host?.image ? (
              <div className="relative size-14 rounded-full overflow-hidden ring-2 ring-primary/20">
                <Image
                  src={space.host.image}
                  alt={hostName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="size-14 rounded-full bg-primary-light text-primary ring-2 ring-primary/20 flex items-center justify-center font-semibold text-lg">
                {hostInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {t("hostedBy", { name: hostName })}
              </p>
              {space.host?.hostingSince && (
                <p className="text-sm text-muted">
                  {t("hostingSince", {
                    year: new Date(space.host.hostingSince).getFullYear(),
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
              {t("aboutThisSpace")}
            </h2>
            <p className="text-muted leading-relaxed whitespace-pre-line text-pretty">
              {space.description}
            </p>
          </div>

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
                {t("amenities")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {space.amenities.map((sa) => (
                  <span
                    key={sa.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle rounded-full text-sm text-foreground border border-border"
                  >
                    <Check className="size-3.5 text-success" />
                    {sa.amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {space.houseRules && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
                {t("houseRules")}
              </h2>
              <p className="text-muted whitespace-pre-line">
                {space.houseRules}
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
              {t("cancellationPolicy")}
            </h2>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <RotateCcw className="size-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">{cancellationLabel}</p>
                <p className="text-muted text-sm mt-1">
                  {cancellationDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {space.latitude != null && space.longitude != null && (
            <LocationMapLoader
              latitude={space.latitude}
              longitude={space.longitude}
              address={`${space.address}, ${space.city}, ${space.country}`}
            />
          )}

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
