export interface Venue {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  videoUrl: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
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
    isActive: boolean;
  }>;
  _count?: { spaces: number };
}
