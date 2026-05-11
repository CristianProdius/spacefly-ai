"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { DashboardPageHeader, DashboardSection } from "@/components/dashboard";
import VenueForm from "@/components/venues/venue-form";
import {
  PRODUCT_SERVICE_URL,
  mapVenueToFormValues,
  type VenueFormPayload,
  type VenueFormValues,
  type VenueResponse,
} from "@/components/venues/venue-form.shared";
import { Skeleton } from "@/components/ui/skeleton";
import useAuthStore from "@/stores/authStore";

const HostEditVenuePage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const id = params.id as string;
  const [initialValues, setInitialValues] = useState<VenueFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchVenue = useCallback(async () => {
    setLoadError(null);

    if (!token) {
      setLoadError("Please sign in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/venues/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "Failed to load venue");
      }

      const data = (await response.json()) as VenueResponse;
      setInitialValues(mapVenueToFormValues(data));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load venue");
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchVenue();
  }, [fetchVenue]);

  const handleUpdate = async (payload: VenueFormPayload) => {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/venues/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "" }));
      throw new Error(data.message || "Failed to update venue");
    }

    router.push("/host/venues");
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Edit Venue"
          description="Update the details for your venue"
        />
        <DashboardSection title="Loading venue details">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Edit Venue"
          description="Update the details for your venue"
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError || "Venue not found"}
        </div>
      </div>
    );
  }

  return (
    <VenueForm
      title="Edit Venue"
      description="Update the details for your venue"
      backHref="/host/venues"
      token={token}
      initialValues={initialValues}
      submitLabel="Update Venue"
      submittingLabel="Saving..."
      onSubmit={handleUpdate}
    />
  );
};

export default HostEditVenuePage;
