"use client";

import { useRouter } from "next/navigation";

import SpaceForm from "@/components/spaces/space-form";
import {
  PRODUCT_SERVICE_URL,
  type SpaceFormPayload,
} from "@/components/spaces/space-form.shared";
import useAuthStore from "@/stores/authStore";

const NewSpacePage = () => {
  const router = useRouter();
  const { token } = useAuthStore();

  const handleCreate = async (payload: SpaceFormPayload) => {
    const response = await fetch(`${PRODUCT_SERVICE_URL}/spaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to create space");
    }

    router.push("/host/spaces");
  };

  return (
    <SpaceForm
      title="Create New Space"
      description="Fill in the details to list your space"
      backHref="/host/spaces"
      token={token}
      submitLabel="Create Space"
      submittingLabel="Creating..."
      onSubmit={handleCreate}
    />
  );
};

export default NewSpacePage;
