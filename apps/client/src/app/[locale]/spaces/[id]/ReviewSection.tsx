"use client";

import { useState, useEffect } from "react";
import { Star, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  hostResponse: string | null;
  hostRespondedAt: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ReviewSectionProps {
  spaceId: number;
}

const ReviewSection = ({ spaceId }: ReviewSectionProps) => {
  const t = useTranslations("spaces");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}/reviews?page=${page}&limit=5`
      );
      if (res.ok) {
        const reviewData = await res.json();
        setData(reviewData);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [spaceId, page]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-border rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-subtle rounded-lg">
              <div className="h-4 w-24 bg-border rounded mb-2" />
              <div className="h-16 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">{t("reviews")}</h2>
        <div className="flex items-center gap-3 p-4 bg-subtle rounded-lg border border-border">
          <p className="text-muted flex-1">{tCommon("error")}</p>
          <button
            onClick={fetchReviews}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {tCommon("loading").replace("...", "")}
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.stats.totalReviews === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">{t("reviews")}</h2>
        <p className="text-muted">{t("noReviews")}</p>
      </div>
    );
  }

  const { reviews, stats, pagination } = data;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t("reviewsCount", { count: stats.totalReviews })}
      </h2>

      {/* Rating Summary */}
      <div className="flex items-start gap-8 mb-6 p-4 bg-subtle rounded-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-primary text-primary"
                    : "text-border"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted mt-1">
            {t("reviewsLabel", { count: stats.totalReviews })}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage =
              stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <Star className="w-3 h-3 fill-primary text-primary" />
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-border pb-6">
            <div className="flex items-start gap-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image
                  src={review.user.image || "/default-avatar.png"}
                  alt={review.user.name || tCommon("user")}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {review.user.name || tCommon("anonymous")}
                  </span>
                  <span className="text-muted text-sm">·</span>
                  <span className="text-muted text-sm">
                    {new Date(review.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-primary text-primary"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-muted">{review.comment}</p>
                )}

                {/* Host Response */}
                {review.hostResponse && (
                  <div className="mt-4 ml-4 p-3 bg-subtle rounded-lg border-l-2 border-border">
                    <p className="text-sm font-medium text-muted mb-1">
                      {t("responseFromHost")}
                    </p>
                    <p className="text-sm text-muted">{review.hostResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {tCommon("previous")}
          </button>
          <span className="text-muted">
            {tCommon("page", { current: page, total: pagination.totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {tCommon("next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
