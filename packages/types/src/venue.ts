export interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  nameTranslations?: Record<string, string> | null;
  shortDescTranslations?: Record<string, string> | null;
  descriptionTranslations?: Record<string, string> | null;
  images: string[];
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  currency?: string;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueWithHost extends Venue {
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface VenueWithSpaces extends Venue {
  spaces: Array<{
    id: number;
    name: string;
    spaceType: string;
    capacity: number;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricingType: string;
    images: string[];
    isActive: boolean;
  }>;
  _count?: { spaces: number };
}
