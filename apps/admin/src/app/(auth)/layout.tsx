import Link from "next/link";
import type { ReactNode } from "react";
import BackgroundVideo from "./BackgroundVideo";

const SUPPORTING_LINE = "Manage spaces, bookings, and hosts from one place.";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell flex min-h-dvh flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-black lg:flex lg:w-[460px] xl:w-[520px]">
        <BackgroundVideo />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white">
          <Link
            href="/"
            aria-label="Spacefly.ai home"
            className="text-xl font-semibold"
          >
            Spacefly.ai
          </Link>
          <div className="max-w-sm space-y-4">
            <p className="text-sm font-medium text-white/80">Host and admin access</p>
            <h2 className="text-4xl font-semibold text-balance">
              Spacefly.ai Dashboard
            </h2>
            <p className="text-sm leading-6 text-white/72 text-pretty">
              {SUPPORTING_LINE}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-1 flex-col bg-[var(--auth-subtle)]">
        <div className="flex items-center justify-center px-6 py-5 lg:hidden">
          <Link
            href="/"
            aria-label="Spacefly.ai home"
            className="text-lg font-semibold text-foreground"
          >
            Spacefly.ai
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <div className="auth-card w-full max-w-md rounded-[28px] bg-white p-8 sm:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
