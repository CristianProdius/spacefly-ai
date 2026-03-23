"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";

const Homepage = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isHost, isHostOrAdmin, isLoading } =
    useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !isHostOrAdmin) {
      router.push("/login");
      return;
    }

    if (isHost) {
      router.replace("/host");
    } else if (isAdmin) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, isAdmin, isHost, isHostOrAdmin, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
};

export default Homepage;
