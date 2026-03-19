import Link from "next/link";
import { Building2 } from "lucide-react";

const Footer = () => {
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
        <p className="text-sm text-gray-400">&copy; 2026 FlexiSpace.</p>
        <p className="text-sm text-gray-400">All rights reserved.</p>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Explore</p>
        <Link href="/spaces" className="hover:text-gray-300 transition-colors">Browse Spaces</Link>
        <Link href="/spaces?type=MEETING_ROOM" className="hover:text-gray-300 transition-colors">Meeting Rooms</Link>
        <Link href="/spaces?type=COWORKING_SPACE" className="hover:text-gray-300 transition-colors">Coworking</Link>
        <Link href="/spaces?type=EVENT_VENUE" className="hover:text-gray-300 transition-colors">Event Venues</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Hosting</p>
        <Link href="/become-host" className="hover:text-gray-300 transition-colors">Become a Host</Link>
        <Link href="/host" className="hover:text-gray-300 transition-colors">Host Dashboard</Link>
        <Link href="/host/spaces/new" className="hover:text-gray-300 transition-colors">List Your Space</Link>
      </div>
      <div className="flex flex-col gap-4 text-sm text-gray-400 items-center md:items-start">
        <p className="text-sm text-amber-50">Company</p>
        <Link href="/" className="hover:text-gray-300 transition-colors">About</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">Contact</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
        <Link href="/" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
};

export default Footer;
