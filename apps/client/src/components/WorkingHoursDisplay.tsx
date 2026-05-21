"use client";

import type { WorkingHours } from "@repo/types";
import { useTranslations } from "next-intl";

const ORDER: Array<keyof WorkingHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const WorkingHoursDisplay = ({ hours }: { hours: WorkingHours | null | undefined }) => {
  const t = useTranslations("venue.workingHours");
  if (!hours) return null;
  const allClosed = ORDER.every((d) => hours[d] === null);
  if (allClosed) return null;

  return (
    <dl className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
      {ORDER.map((day) => {
        const value = hours[day];
        return (
          <div key={day} className="contents">
            <dt className="text-muted capitalize">{t(`day.${day}`)}</dt>
            <dd className="text-foreground">
              {value ? `${value.open} – ${value.close}` : t("closed")}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};

export default WorkingHoursDisplay;
