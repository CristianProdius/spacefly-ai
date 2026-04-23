"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import {
  Upload,
  X,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import { Button } from "@/components/ui/button";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

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

const spaceTypes = [
  { value: "OFFICE_DESK", label: "Office Desk" },
  { value: "PRIVATE_OFFICE", label: "Private Office" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EVENT_VENUE", label: "Event Venue" },
  { value: "WEDDING_VENUE", label: "Wedding Venue" },
  { value: "COWORKING_SPACE", label: "Coworking Space" },
];

const pricingTypes = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
  { value: "BOTH", label: "Both" },
];

const cancellationPolicies = [
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "MODERATE", label: "Moderate" },
  { value: "STRICT", label: "Strict" },
  { value: "NON_REFUNDABLE", label: "Non-Refundable" },
];

const fieldClassName =
  "w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const labelClassName = "mb-1 block text-sm font-medium text-foreground";

const NewSpacePage = () => {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpaceCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
          fetch(`${PRODUCT_SERVICE_URL}/categories`),
          fetch(`${PRODUCT_SERVICE_URL}/amenities`),
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
    setUploadError(null);

    try {
      if (!token) {
        throw new Error("Please sign in again to upload images");
      }

      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(`${PRODUCT_SERVICE_URL}/uploads/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fd,
        });

        if (!res.ok) {
          let message = "Failed to upload image";

          try {
            const data = await res.json();
            message = data.message || message;
          } catch {
            // Keep the default message when the response is not JSON.
          }

          throw new Error(message);
        }

        const data = (await res.json()) as { url: string };
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
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
        `${PRODUCT_SERVICE_URL}/spaces`,
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

      router.push("/host/spaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Create New Space"
        description="Fill in the details to list your space"
        action={
          <Link
            href="/host/spaces"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" />
            Back to Spaces
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <DashboardSection title="Basic Information" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Space Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={fieldClassName}
                placeholder="e.g. Modern Downtown Meeting Room"
              />
            </div>

            <div>
              <label className={labelClassName}>Short Description</label>
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
                className={fieldClassName}
                placeholder="Brief description for search results"
              />
            </div>

            <div>
              <label className={labelClassName}>Full Description</label>
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
                className={`${fieldClassName} min-h-28 resize-y`}
                placeholder="Detailed description of your space"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClassName}>Space Type</label>
                <select
                  required
                  value={formData.spaceType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      spaceType: e.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  {spaceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>Category</label>
                <select
                  required
                  value={formData.categorySlug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySlug: e.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClassName}>Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity: e.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Maximum number of people"
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Images" contentClassName="space-y-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-accent/20"
              >
                <Image
                  src={img}
                  alt={`Space ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label={`Remove image ${idx + 1}`}
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-accent/20 px-4 text-center transition-colors hover:border-primary/40 hover:bg-accent/30">
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Upload
                  </span>
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
          {uploadError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {uploadError}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Upload high-quality photos of your space. First image will be the
            cover.
          </p>
        </DashboardSection>

        <DashboardSection title="Location" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className={labelClassName}>City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Country</label>
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
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Pricing" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Pricing Type</label>
              <select
                required
                value={formData.pricingType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingType: e.target.value,
                  }))
                }
                className={fieldClassName}
              >
                {pricingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(formData.pricingType === "HOURLY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className={labelClassName}>Price Per Hour</label>
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
                    className={fieldClassName}
                    placeholder="$"
                  />
                </div>
              )}

              {(formData.pricingType === "DAILY" ||
                formData.pricingType === "BOTH") && (
                <div>
                  <label className={labelClassName}>Price Per Day</label>
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
                    className={fieldClassName}
                    placeholder="$"
                  />
                </div>
              )}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Amenities">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {amenities.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  formData.amenityIds.includes(amenity.id)
                    ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                    : "border-border/60 bg-card text-card-foreground hover:bg-accent/30"
                }`}
              >
                {formData.amenityIds.includes(amenity.id) && (
                  <Check className="w-4 h-4" />
                )}
                {amenity.name}
              </button>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Settings" contentClassName="space-y-4">
          <div className="space-y-4">
            <div>
              <label className={labelClassName}>Cancellation Policy</label>
              <select
                required
                value={formData.cancellationPolicy}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cancellationPolicy: e.target.value,
                  }))
                }
                className={fieldClassName}
              >
                {cancellationPolicies.map((policy) => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClassName}>House Rules</label>
              <textarea
                rows={3}
                value={formData.houseRules}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    houseRules: e.target.value,
                  }))
                }
                className={`${fieldClassName} min-h-24 resize-y`}
                placeholder="Any rules guests should know about"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/20 px-4 py-3">
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
                className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-ring/50 dark:bg-input/30"
              />
              <label
                htmlFor="instantBook"
                className="text-sm text-muted-foreground"
              >
                Enable instant booking (guests can book without approval)
              </label>
            </div>
          </div>
        </DashboardSection>

        <div className="flex items-center justify-end gap-4">
          <Button asChild variant="ghost">
            <Link href="/host/spaces">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading || formData.images.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Space"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewSpacePage;
