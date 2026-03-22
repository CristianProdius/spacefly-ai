"use client";

import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl overflow-hidden h-[300px] bg-subtle animate-pulse" />
  ),
});

interface LocationMapLoaderProps {
  latitude: number;
  longitude: number;
  address: string;
}

const LocationMapLoader = (props: LocationMapLoaderProps) => {
  return <LocationMap {...props} />;
};

export default LocationMapLoader;
