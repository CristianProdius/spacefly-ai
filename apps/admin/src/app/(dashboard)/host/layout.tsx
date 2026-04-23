"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isHostOrAdmin, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isHostOrAdmin)) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, isHostOrAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border/60 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isHostOrAdmin) {
    return null;
  }

  return <>{children}</>;
}
