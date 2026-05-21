"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HostSummary } from "@repo/types";

const HostCard = ({ host }: { host: HostSummary }) => {
  const t = useTranslations("hosts.card");
  const displayName = host.name ?? host.username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const hostingYear = host.hostingSince ? new Date(host.hostingSince).getFullYear() : null;

  return (
    <Link
      href={`/hosts/${host.id}`}
      className="group border border-border rounded-2xl p-5 hover:border-foreground/40 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        {host.image ? (
          <Image
            src={host.image}
            alt={displayName}
            width={56}
            height={56}
            className="rounded-full object-cover size-14"
          />
        ) : (
          <div className="size-14 rounded-full bg-subtle flex items-center justify-center text-foreground font-semibold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground line-clamp-1">{displayName}</p>
          {hostingYear && (
            <p className="text-xs text-muted">{t("hostingSince", { year: hostingYear })}</p>
          )}
          {host.hostVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-success mt-0.5">
              <Check className="size-3.5" /> Verified
            </span>
          )}
        </div>
      </div>
      {host.bio && <p className="text-sm text-muted line-clamp-3">{host.bio}</p>}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">
          {t("venues", { count: host.venueCount })} · {t("spaces", { count: host.spaceCount })}
        </span>
        {host.cities.length > 0 && (
          <span className="text-muted line-clamp-1 inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {host.cities.slice(0, 2).join(", ")}
          </span>
        )}
      </div>
    </Link>
  );
};

export default HostCard;
