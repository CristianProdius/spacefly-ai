"use client";

import { Link } from "@/i18n/navigation";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("footer");

  return (
    <div className="mt-16 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between md:gap-0 bg-gradient-to-b from-gray-900 to-gray-950 p-8 rounded-lg">
      <div className="flex flex-col gap-4 items-center md:items-start">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <p className="hidden md:block text-md font-medium tracking-wider text-white">
            FLEXISPACE
          </p>
        </Link>
        <p className="text-sm text-gray-400">{t("copyright")}</p>
        <p className="text-sm text-gray-400">{t("allRightsReserved")}</p>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">{t("explore")}</p>
        <Link href="/spaces" className="hover:text-gray-300 transition-colors">{t("browseSpaces")}</Link>
        <Link href="/spaces?type=MEETING_ROOM" className="hover:text-gray-300 transition-colors">{t("meetingRooms")}</Link>
        <Link href="/spaces?type=COWORKING_SPACE" className="hover:text-gray-300 transition-colors">{t("coworking")}</Link>
        <Link href="/spaces?type=EVENT_VENUE" className="hover:text-gray-300 transition-colors">{t("eventVenues")}</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">{t("hosting")}</p>
        <Link href="/become-host" className="hover:text-gray-300 transition-colors">{t("becomeAHost")}</Link>
        <Link href="/host" className="hover:text-gray-300 transition-colors">{t("hostDashboard")}</Link>
        <Link href="/host/spaces/new" className="hover:text-gray-300 transition-colors">{t("listYourSpace")}</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">{t("company")}</p>
        <Link href="/" className="hover:text-gray-300 transition-colors">{t("about")}</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">{t("contact")}</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">{t("termsOfService")}</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">{t("privacyPolicy")}</Link>
      </div>
    </div>
  );
};

export default Footer;
