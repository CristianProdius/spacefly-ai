"use client";

import useAuthStore from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const Page = () => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="space-y-8 text-center lg:text-left">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--auth-subtle)] text-[var(--auth-brand)] lg:mx-0">
        <ShieldAlert className="size-6" />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--auth-brand)]">
          Access restricted
        </p>
        <h1 className="text-3xl font-semibold text-balance">
          You do not have access to this dashboard
        </h1>
        <p className="text-sm leading-6 text-[var(--auth-muted)] text-pretty">
          Your account is signed in, but it does not have permission to open
          this workspace.
        </p>
      </div>

      <Button
        onClick={handleLogout}
        size="xl"
        className="h-12 w-full rounded-xl bg-[var(--auth-brand)] text-white hover:bg-[var(--auth-brand-hover)]"
      >
        Sign out and return to login
      </Button>
    </div>
  );
};

export default Page;
