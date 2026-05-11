"use client";

import { useRouter } from "next/navigation";

import VenueForm from "@/components/venues/venue-form";
import {
  PRODUCT_SERVICE_URL,
  type VenueFormPayload,
} from "@/components/venues/venue-form.shared";
import useAuthStore from "@/stores/authStore";

const NewVenuePage = () => {
  const router = useRouter();
  const { token } = useAuthStore();

  const handleCreate = async (payload: VenueFormPayload) => {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/venues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to create venue");
    }

    router.push("/host/venues");
  };

  return (
    <VenueForm
      title="Create New Venue"
      description="Fill in the details for your venue property"
      backHref="/host/venues"
      token={token}
      submitLabel="Create Venue"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewVenuePage;
