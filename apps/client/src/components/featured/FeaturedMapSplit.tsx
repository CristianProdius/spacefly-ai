"use client";

import { Space } from "@repo/types";
import {
  Star,
  MapPin,
  TrendingUp,
  Clock,
  Sparkles,
  Navigation,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";

/** Haversine distance in km between two lat/lng points */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}

type SortValue = "near" | "rated" | "new";

const sortOptions: { label: string; icon: typeof MapPin; value: SortValue }[] =
  [
    { label: "Near Me", icon: MapPin, value: "near" },
    { label: "Top Rated", icon: TrendingUp, value: "rated" },
    { label: "New", icon: Sparkles, value: "new" },
  ];

interface Props {
  spaces: Space[];
  title?: string;
  showViewAll?: boolean;
}

export default function FeaturedMapSplit({
  spaces,
  title = "Discover Nearby",
  showViewAll = false,
}: Props) {
  const [activeSort, setActiveSort] = useState<SortValue>("near");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "granted" | "denied"
  >("idle");

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  // Compute distances
  const spacesWithDistance = useMemo(() => {
    return spaces.map((space) => {
      let distance: number | null = null;
      if (userCoords && space.latitude != null && space.longitude != null) {
        distance = haversineKm(
          userCoords.lat,
          userCoords.lng,
          space.latitude,
          space.longitude
        );
      }
      return { space, distance };
    });
  }, [spaces, userCoords]);

  // Sort based on active pill
  const sorted = useMemo(() => {
    const items = [...spacesWithDistance];
    switch (activeSort) {
      case "near":
        items.sort((a, b) => {
          if (a.distance == null && b.distance == null) return 0;
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
        break;
      case "rated":
        items.sort(
          (a, b) => (b.space.averageRating ?? 0) - (a.space.averageRating ?? 0)
        );
        break;
      case "new":
        items.sort(
          (a, b) =>
            new Date(b.space.createdAt).getTime() -
            new Date(a.space.createdAt).getTime()
        );
        break;
    }
    return items;
  }, [spacesWithDistance, activeSort]);

  // Detect user city from nearest space
  const userCity = useMemo(() => {
    if (!userCoords || sorted.length === 0 || sorted[0]!.distance == null)
      return null;
    if (sorted[0]!.distance! < 100) return sorted[0]!.space.city;
    return null;
  }, [sorted, userCoords]);

  // Compute pin positions from real coordinates when geolocation available
  const pinPositions = useMemo(() => {
    const displayed = sorted.slice(0, 6);
    if (!userCoords || displayed.every((d) => d.distance == null)) {
      // Fallback: fixed decorative positions
      const fallback = [
        { top: "20%", left: "30%" },
        { top: "35%", left: "60%" },
        { top: "55%", left: "25%" },
        { top: "45%", left: "75%" },
        { top: "70%", left: "45%" },
        { top: "25%", left: "50%" },
      ];
      return displayed.map((d, i) => ({
        id: d.space.id,
        ...fallback[i % fallback.length]!,
      }));
    }

    // Project lat/lng relative to user for a local mini-map
    const lats = displayed
      .filter((d) => d.space.latitude != null)
      .map((d) => d.space.latitude!);
    const lngs = displayed
      .filter((d) => d.space.longitude != null)
      .map((d) => d.space.longitude!);

    const allLats = [...lats, userCoords.lat];
    const allLngs = [...lngs, userCoords.lng];
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    return displayed.map((d) => {
      if (d.space.latitude == null || d.space.longitude == null) {
        return { id: d.space.id, top: "50%", left: "50%" };
      }
      // Map to 10%-90% range to keep pins inside
      const top = `${90 - ((d.space.latitude - minLat) / latRange) * 80}%`;
      const left = `${10 + ((d.space.longitude - minLng) / lngRange) * 80}%`;
      return { id: d.space.id, top, left };
    });
  }, [sorted, userCoords]);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {geoStatus === "loading" && (
            <Loader2 className="w-4 h-4 text-muted animate-spin" />
          )}
          {userCity && (
            <span className="text-sm text-muted flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              {userCity}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Decorative map — left 2 cols (hidden on mobile) */}
          <div className="hidden md:block md:col-span-2 rounded-xl overflow-hidden bg-subtle relative min-h-[500px]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22grid%22%20width%3D%2240%22%20height%3D%2240%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2040%200%20L%200%200%200%2040%22%20fill%3D%22none%22%20stroke%3D%22%23e5e7eb%22%20stroke-width%3D%220.5%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22url(%23grid)%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />

            {/* User location pin */}
            {geoStatus === "granted" && (
              <div
                className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ top: "50%", left: "50%" }}
              >
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <span className="relative block w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md" />
              </div>
            )}

            {/* Space pins */}
            {pinPositions.map((pin) => (
              <div
                key={pin.id}
                className={cn(
                  "absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200",
                  hoveredId === pin.id
                    ? "bg-primary text-primary-foreground scale-125 shadow-lg z-10"
                    : "bg-white text-foreground shadow-md border border-border"
                )}
                style={{ top: pin.top, left: pin.left }}
              >
                <MapPin className="w-4 h-4" />
              </div>
            ))}

            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center">
              <p className="text-sm text-muted">
                {geoStatus === "granted"
                  ? "Showing spaces near your location"
                  : geoStatus === "loading"
                    ? "Detecting your location…"
                    : "Enable location for nearby spaces"}
              </p>
            </div>
          </div>

          {/* Scrollable list — right 3 cols */}
          <div className="md:col-span-3">
            {/* Sort pills */}
            <div className="flex gap-2 mb-5">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setActiveSort(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      activeSort === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-subtle text-muted hover:text-foreground hover:bg-border"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* List items */}
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {sorted.map(({ space, distance }) => {
                const images = parseImages(space.images);
                return (
                  <Link
                    key={space.id}
                    href={`/spaces/${space.id}`}
                    className={cn(
                      "group flex gap-4 p-3 rounded-xl transition-all duration-200",
                      hoveredId === space.id
                        ? "bg-primary-light shadow-sm"
                        : "hover:bg-subtle"
                    )}
                    onMouseEnter={() => setHoveredId(space.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={images[0] || "/placeholder-space.jpg"}
                        alt={space.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                        {space.name}
                      </h3>
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {space.city}, {space.country}
                        {activeSort === "near" && distance != null && (
                          <span className="text-primary ml-1">
                            · {formatDistance(distance)}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {getPriceDisplay(space)}
                        </span>
                        {space.averageRating !== undefined &&
                          space.averageRating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-muted">
                              <Star className="w-3 h-3 fill-foreground text-foreground" />
                              {space.averageRating.toFixed(1)}
                            </span>
                          )}
                        {space.instantBook && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600">
                            <Clock className="w-3 h-3" />
                            Instant
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {showViewAll && spaces.length > 0 && (
              <div className="flex justify-center mt-6">
                <Link
                  href="/spaces"
                  className="px-6 py-3 border border-foreground text-foreground rounded-lg font-medium hover:bg-foreground hover:text-white transition-colors"
                >
                  View all spaces
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
