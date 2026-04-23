"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Upload, X } from "lucide-react";

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import type { Amenity, SpaceCategory } from "@repo/types";

import {
  PRODUCT_SERVICE_URL,
  buildSpacePayload,
  cancellationPolicies,
  createEmptySpaceFormValues,
  fieldClassName,
  labelClassName,
  pricingTypes,
  spaceTypes,
  type SpaceFormPayload,
  type SpaceFormValues,
} from "./space-form.shared";

interface SpaceFormProps {
  title: string;
  description: string;
  backHref: string;
  token: string | null;
  initialValues?: SpaceFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: SpaceFormPayload) => Promise<void>;
}

const SpaceForm = ({
  title,
  description,
  backHref,
  token,
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
}: SpaceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpaceCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpaceFormValues>(
    initialValues ?? createEmptySpaceFormValues()
  );

  useEffect(() => {
    setFormData(initialValues ?? createEmptySpaceFormValues());
  }, [initialValues]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, amenRes] = await Promise.all([
          fetch(`${PRODUCT_SERVICE_URL}/categories`),
          fetch(`${PRODUCT_SERVICE_URL}/amenities`),
        ]);

        if (catRes.ok) {
          const catData = (await catRes.json()) as SpaceCategory[];
          setCategories(catData);
        }

        if (amenRes.ok) {
          const amenData = (await amenRes.json()) as Amenity[];
          setAmenities(amenData);
        }
      } catch (fetchError) {
        console.error("Error fetching data:", fetchError);
      }
    };

    fetchData();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      if (!token) {
        throw new Error("Please sign in again to upload images");
      }

      for (const file of Array.from(files)) {
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);

        const response = await fetch(`${PRODUCT_SERVICE_URL}/uploads/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToUpload,
        });

        if (!response.ok) {
          let message = "Failed to upload image";

          try {
            const data = await response.json();
            message = data.message || message;
          } catch {
            // Keep the default message when the response is not JSON.
          }

          throw new Error(message);
        }

        const data = (await response.json()) as { url: string };
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      }
    } catch (uploadingError) {
      console.error("Error uploading image:", uploadingError);
      setUploadError(
        uploadingError instanceof Error
          ? uploadingError.message
          : "Failed to upload image"
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(buildSpacePayload(formData));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={title}
        description={description}
        action={
          <Link
            href={backHref}
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
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: event.target.value,
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      spaceType: event.target.value as SpaceFormValues["spaceType"],
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      categorySlug: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity: event.target.value,
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
            {formData.images.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-accent/20"
              >
                <Image
                  src={imageUrl}
                  alt={`Space ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                >
                  <X className="h-4 w-4" />
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: event.target.value,
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: event.target.value,
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      state: event.target.value,
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: event.target.value,
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: event.target.value,
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricingType: event.target.value as SpaceFormValues["pricingType"],
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
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerHour: event.target.value,
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
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricePerDay: event.target.value,
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
                {formData.amenityIds.includes(amenity.id) ? (
                  <Check className="h-4 w-4" />
                ) : null}
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    cancellationPolicy:
                      event.target.value as SpaceFormValues["cancellationPolicy"],
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    houseRules: event.target.value,
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    instantBook: event.target.checked,
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
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading || formData.images.length === 0}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpaceForm;
