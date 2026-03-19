import SpaceList from "@/components/SpaceList";
import Link from "next/link";
import { Search, Building2, Users, Calendar, Shield } from "lucide-react";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>;
}) => {
  const { type, city } = await searchParams;

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 text-white py-20 px-6 rounded-2xl mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Find Your Perfect Workspace
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Discover and book unique spaces for work, meetings, events, and more.
            From cozy coworking spots to grand wedding venues.
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg shadow-black/20"
          >
            <Search className="w-5 h-5" />
            Explore Spaces
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Diverse Spaces</h3>
            <p className="text-sm text-gray-600 mt-1">
              From desks to venues, find exactly what you need
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Flexible Booking</h3>
            <p className="text-sm text-gray-600 mt-1">
              Book by the hour or day, whatever suits you
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verified Hosts</h3>
            <p className="text-sm text-gray-600 mt-1">
              All spaces reviewed by our team for quality
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Secure Payments</h3>
            <p className="text-sm text-gray-600 mt-1">
              Pay securely with deposit protection
            </p>
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Featured Spaces</h2>
            <p className="text-gray-600 mt-1">
              Discover our most popular workspaces and venues
            </p>
          </div>
        </div>
        <SpaceList type={type} city={city} variant="homepage" />
      </section>

      {/* Become a Host CTA */}
      <section className="relative bg-gradient-to-r from-gray-900 to-indigo-950 text-white py-12 px-8 rounded-2xl text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
            Have a Space to Share?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of hosts earning income from their unused spaces.
            List your office, meeting room, or venue and start earning today.
          </p>
          <Link
            href="/become-host"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Become a Host
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
