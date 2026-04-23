export type CuratedSpaceSeed = {
  name: string;
  shortDescription: string;
  description: string;
  categorySlug:
    | "office-desk"
    | "private-office"
    | "meeting-room"
    | "event-venue"
    | "wedding-venue"
    | "coworking-space";
  spaceType:
    | "OFFICE_DESK"
    | "PRIVATE_OFFICE"
    | "MEETING_ROOM"
    | "EVENT_VENUE"
    | "WEDDING_VENUE"
    | "COWORKING_SPACE";
  pricingType: "HOURLY" | "DAILY";
  capacity: number;
  minBookingHours: number | null;
  maxBookingHours: number | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  imageSourceUrls: string[];
  amenityNames: string[];
  sourceUrls: string[];
  houseRules: string;
  notes: string;
};

const DEFAULT_CITY = "Chisinau";
const DEFAULT_COUNTRY = "Moldova";

export const CHISINAU_SPACES: CuratedSpaceSeed[] = [
  {
    name: "iHUB Flex Desk",
    shortDescription:
      "Flexible open-desk access inside central Chisinau's best-known startup hub.",
    description:
      "Curated from iHUB Chisinau's published coworking offer. This listing models the Flex tariff as a bookable open desk inside the main coworking floor, with access to the lounge and sports areas, tea and coffee, and the broader startup community in the city center.",
    categorySlug: "office-desk",
    spaceType: "OFFICE_DESK",
    pricingType: "HOURLY",
    capacity: 1,
    minBookingHours: 1,
    maxBookingHours: 10,
    address: "78 Strada 31 August 1989",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://ihub.ua/wp-content/uploads/2022/09/services_coworking.jpg",
      "https://ihub.ua/wp-content/uploads/2022/09/hero-ihub-scaled.jpg",
    ],
    amenityNames: ["WiFi", "Coffee/Tea", "Lounge Area", "Printer", "24/7 Access"],
    sourceUrls: ["https://ihub.ua/en/chisinau/", "https://www.ihub.md/"],
    houseRules:
      "Shared desk access. Keep calls brief in the open area and use meeting rooms for longer conversations.",
    notes:
      "Source publishes tariffs in UAH/MDL while the current product UI is USD-only, so pricing is intentionally left blank for host-side follow-up.",
  },
  {
    name: "Totem Open Desk",
    shortDescription:
      "Flexible desk access near Valea Trandafirilor with meeting rooms and a cafeteria on site.",
    description:
      "Curated from Totem Coworking's public listing and company profile. This entry represents the hot-desk / shared-desk offer for independent professionals who need a permanent work base with access to call booths, a cafeteria, meeting rooms, and a seven-day workspace near Rose Valley Park.",
    categorySlug: "office-desk",
    spaceType: "OFFICE_DESK",
    pricingType: "HOURLY",
    capacity: 1,
    minBookingHours: 1,
    maxBookingHours: 10,
    address: "6 Bulevardul Decebal",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: "MD-2001",
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://coworker.imgix.net/photos/moldova/chisinau/totem/1.jpeg?auto=format%2Ccompress&fit=crop&h=0&mark=%2Ftemplate%2Fimg%2Fwm_icon.png&markalign=center%2Cmiddle&markscale=5&q=90&w=800",
    ],
    amenityNames: [
      "WiFi",
      "Air Conditioning",
      "Heating",
      "Kitchen",
      "Lounge Area",
      "Parking",
      "24/7 Access",
      "Lockers",
    ],
    sourceUrls: [
      "https://www.coworker.com/moldova/chisinau/totem",
      "https://md.linkedin.com/company/totem-md",
    ],
    houseRules:
      "Open-desk booking. Phone booths and meeting rooms should be used for private calls and client meetings.",
    notes:
      "Public copy confirms seven-day availability and hot-desk access but does not publish a public room rate.",
  },
  {
    name: "iHUB Business Office",
    shortDescription:
      "Private office membership for teams that need a dedicated room inside iHUB Chisinau.",
    description:
      "Curated from iHUB Chisinau's Business tariff. This listing models the private office offer for companies that need an individual office with unlimited visits, meeting-room hours, administrator assistance, office equipment access, and event-hall booking privileges inside the iHUB campus.",
    categorySlug: "private-office",
    spaceType: "PRIVATE_OFFICE",
    pricingType: "DAILY",
    capacity: 7,
    minBookingHours: null,
    maxBookingHours: null,
    address: "78 Strada 31 August 1989",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://ihub.ua/wp-content/uploads/2022/09/about.jpg",
      "https://ihub.ua/wp-content/uploads/2022/09/services_coworking.jpg",
    ],
    amenityNames: [
      "WiFi",
      "Coffee/Tea",
      "Lounge Area",
      "Printer",
      "Reception",
      "24/7 Access",
      "TV Screen",
      "Whiteboard",
    ],
    sourceUrls: ["https://ihub.ua/en/chisinau/", "https://www.ihub.md/about"],
    houseRules:
      "Private office booking is intended for company teams. Final furniture and branding setup are confirmed directly with the venue.",
    notes:
      "Capacity follows the published Business tariff guidance for companies of 7+ people. Public tariffs are not stored because the product currently renders all prices as USD.",
  },
  {
    name: "Totem Private Office",
    shortDescription:
      "Private office in a modern coworking venue near Rose Valley Park.",
    description:
      "Curated from Totem Coworking's public listing, which explicitly advertises private offices, shared desks, meeting rooms, call booths, and a cafeteria. This entry models the private-office offer for a small team that wants a dedicated room while still using the shared coworking amenities.",
    categorySlug: "private-office",
    spaceType: "PRIVATE_OFFICE",
    pricingType: "DAILY",
    capacity: 4,
    minBookingHours: null,
    maxBookingHours: null,
    address: "6 Bulevardul Decebal",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: "MD-2001",
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://coworker.imgix.net/photos/moldova/chisinau/totem/1.jpeg?auto=format%2Ccompress&fit=crop&h=0&mark=%2Ftemplate%2Fimg%2Fwm_icon.png&markalign=center%2Cmiddle&markscale=5&q=90&w=800",
    ],
    amenityNames: [
      "WiFi",
      "Air Conditioning",
      "Heating",
      "Kitchen",
      "Lounge Area",
      "Parking",
      "24/7 Access",
      "Lockers",
    ],
    sourceUrls: [
      "https://www.coworker.com/moldova/chisinau/totem",
      "https://md.linkedin.com/company/totem-md",
    ],
    houseRules:
      "Private office access is for the booked team only. Meeting rooms and conference spaces must be reserved separately.",
    notes:
      "Capacity is modeled as a small team office based on the public description rather than a published seat count.",
  },
  {
    name: "iHUB Meeting Room",
    shortDescription:
      "Central Chisinau meeting room for small business sessions and startup calls.",
    description:
      "Curated from iHUB Chisinau's published meeting-room offer. This room is modeled from the venue's hourly meeting-room tariff, which includes an individual room for 4 to 10 people plus a whiteboard and TV inside the iHUB campus.",
    categorySlug: "meeting-room",
    spaceType: "MEETING_ROOM",
    pricingType: "HOURLY",
    capacity: 10,
    minBookingHours: 1,
    maxBookingHours: 8,
    address: "78 Strada 31 August 1989",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://ihub.ua/wp-content/uploads/2022/09/services_meeting.jpg",
    ],
    amenityNames: ["WiFi", "TV Screen", "Whiteboard", "Coffee/Tea", "Reception"],
    sourceUrls: ["https://ihub.ua/en/chisinau/"],
    houseRules:
      "Hourly meeting-room booking. Keep the room in setup-ready condition for the next reservation.",
    notes:
      "Source explicitly publishes room size guidance for 4 to 10 attendees and an hourly meeting-room tariff.",
  },
  {
    name: "Courtyard Amber Meeting Room",
    shortDescription:
      "Hotel meeting room on Arborilor for boardroom sessions, training, and client meetings.",
    description:
      "Curated from Courtyard by Marriott Chisinau's official capacity chart. Amber is a 25.2 m² meeting room inside the hotel events floor, published for up to 25 theater, 20 reception, or 12 U-shape participants.",
    categorySlug: "meeting-room",
    spaceType: "MEETING_ROOM",
    pricingType: "HOURLY",
    capacity: 25,
    minBookingHours: 1,
    maxBookingHours: 8,
    address: "21/A Arborilor Street",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: "2025",
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://cache.marriott.com/content/dam/marriott-renditions/KIVCY/kivcy-amber-meeting-8319-hor-clsc.jpg?downsize=1336px%3A%2A&interpolation=progressive-bilinear&output-quality=70",
    ],
    amenityNames: ["WiFi", "Air Conditioning", "Reception", "Projector", "Parking"],
    sourceUrls: [
      "https://www.marriott.com/en-us/hotels/kivcy-courtyard-chisinau/events/",
      "https://www.marriott.com/en-us/hotels/kivcy-courtyard-chisinau/photos/",
    ],
    houseRules:
      "Meeting-room setup and catering are confirmed with hotel staff before the event day.",
    notes:
      "The official hotel page publishes capacities and room dimensions, but not a public room-only rate.",
  },
  {
    name: "Radisson Leogrand Convention Center",
    shortDescription:
      "Large-scale convention and gala venue in the center of Chisinau.",
    description:
      "Curated from Radisson Blu Leogrand Hotel Chisinau's official meeting page. The Convention Center is published as a 715 m² ballroom / convention hall with flexible setups and up to 1,000 theater capacity, suitable for conferences, cocktail receptions, and large corporate gatherings.",
    categorySlug: "event-venue",
    spaceType: "EVENT_VENUE",
    pricingType: "DAILY",
    capacity: 1000,
    minBookingHours: 4,
    maxBookingHours: null,
    address: "77 Mitropolit Varlaam",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2e/9e/e5/db/hotel-exterior-view.jpg?h=500&s=1&w=900",
    ],
    amenityNames: [
      "WiFi",
      "Air Conditioning",
      "Reception",
      "Printer",
      "Parking",
      "Security System",
    ],
    sourceUrls: [
      "https://www.radissonhotels.com/en-us/hotels/radisson-blu-chisinau-leogrand/meeting-events",
      "https://www.radissonhotels.com/en-us/hotels/radisson-blu-chisinau-leogrand",
    ],
    houseRules:
      "Large-event setup requires direct venue coordination for catering, staging, and final floor plan approval.",
    notes:
      "The official source publishes the venue area and setup capacities. Public pricing is proposal-based and not listed.",
  },
  {
    name: "Courtyard Diamond Hall",
    shortDescription:
      "Large Marriott event hall for launches, forums, workshops, and corporate receptions.",
    description:
      "Curated from Courtyard by Marriott Chisinau's official event capacity chart. Diamond is the hotel's largest event room at 160 m², published for up to 180 theater, 150 reception, or 100 banquet guests.",
    categorySlug: "event-venue",
    spaceType: "EVENT_VENUE",
    pricingType: "DAILY",
    capacity: 180,
    minBookingHours: 4,
    maxBookingHours: null,
    address: "21/A Arborilor Street",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: "2025",
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://cache.marriott.com/content/dam/marriott-renditions/KIVCY/kivcy-diamond-meeting-8316-hor-clsc.jpg?downsize=1336px%3A%2A&interpolation=progressive-bilinear&output-quality=70",
    ],
    amenityNames: ["WiFi", "Air Conditioning", "Reception", "Projector", "Parking"],
    sourceUrls: [
      "https://www.marriott.com/en-us/hotels/kivcy-courtyard-chisinau/events/",
      "https://www.marriott.com/en-us/hotels/kivcy-courtyard-chisinau/photos/",
    ],
    houseRules:
      "Event setup, catering, and AV support are coordinated with the hotel team before booking confirmation.",
    notes:
      "The hotel publishes capacity by setup, but not a direct room rental rate.",
  },
  {
    name: "MiaDora Wedding Hall",
    shortDescription:
      "Classical wedding venue in Botanica with a large reception hall, terrace, and landscaped grounds.",
    description:
      "Curated from MiaDora's official wedding pages. This listing models the main wedding hall and surrounding event areas, including the large reception hall, bar area, fourchette zone, green exterior, and dedicated parking that the venue advertises for one-event-at-a-time celebrations.",
    categorySlug: "wedding-venue",
    spaceType: "WEDDING_VENUE",
    pricingType: "DAILY",
    capacity: 220,
    minBookingHours: 6,
    maxBookingHours: null,
    address: "25A Hristo Botev Street",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: "MD-2043",
    latitude: null,
    longitude: null,
    imageSourceUrls: ["https://miadora.md/img/sala-de-evenimente-miadora.jpg"],
    amenityNames: ["Air Conditioning", "Parking", "Outdoor Space", "Reception"],
    sourceUrls: [
      "https://miadora.md/en/restaurant-si-sala-de-nunti.html",
      "https://miadora.md/en/index.html",
      "https://www.miadora.md/",
    ],
    houseRules:
      "Wedding planning, menu design, vendor access, and final schedule are confirmed directly with the venue manager.",
    notes:
      "The public site publishes venue area and a stated capacity of up to 220 people, but not an online booking price.",
  },
  {
    name: "Villa Garden Sky Garden Hall",
    shortDescription:
      "Refined wedding hall in Valea Trandafirilor with a green terrace and lounge zones.",
    description:
      "Curated from Villa Garden's official wedding pages. The Sky Garden Hall is presented as a 120-person event hall with a green terrace and interior lounge zones, suitable for weddings and other elegant celebrations inside the Rose Valley Park setting.",
    categorySlug: "wedding-venue",
    spaceType: "WEDDING_VENUE",
    pricingType: "DAILY",
    capacity: 120,
    minBookingHours: 6,
    maxBookingHours: null,
    address: "16 Bulevardul Decebal",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://static.wixstatic.com/media/3b3797_4bc53e08846f48a6932e8fbb55583f02~mv2.jpg/v1/fill/w_328%2Ch_493%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/3b3797_4bc53e08846f48a6932e8fbb55583f02~mv2.jpg",
    ],
    amenityNames: [
      "Air Conditioning",
      "Parking",
      "Outdoor Space",
      "Reception",
      "Security System",
    ],
    sourceUrls: [
      "https://www.villagarden.md/en/nunt%C4%83",
      "https://www.villagarden.md/sala-alb%C4%83",
    ],
    houseRules:
      "Wedding decor, guest flow, and terrace usage are coordinated with the venue's event managers before the event date.",
    notes:
      "The venue publishes a 120-person capacity for Sky Garden and a location in Rose Valley Park, but not public room rates.",
  },
  {
    name: "Tekwill Coworking Hub",
    shortDescription:
      "Large innovation-led coworking hub at UTM with desks, labs, events, and community programming.",
    description:
      "Curated from Tekwill's public coworking listing. This listing models the coworking membership experience inside Tekwill's 4,000 m² innovation hub, with desk space, labs, community events, and business amenities for founders, freelancers, and tech teams.",
    categorySlug: "coworking-space",
    spaceType: "COWORKING_SPACE",
    pricingType: "HOURLY",
    capacity: 1,
    minBookingHours: 1,
    maxBookingHours: 10,
    address: "9/11 Strada Studenților",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://coworker.imgix.net/photos/moldova/chisinau/tekwill/1.jpg?auto=format%2Ccompress&fit=crop&h=0&mark=%2Ftemplate%2Fimg%2Fwm_icon.png&markalign=center%2Cmiddle&markscale=5&q=90&w=800",
    ],
    amenityNames: [
      "WiFi",
      "Heating",
      "Air Conditioning",
      "Lounge Area",
      "Kitchen",
      "Parking",
      "Wheelchair Accessible",
      "24/7 Access",
      "Coffee/Tea",
    ],
    sourceUrls: ["https://www.coworker.com/moldova/chisinau/tekwill"],
    houseRules:
      "Coworking membership booking covers one working seat. Labs and event areas require separate venue coordination.",
    notes:
      "Tekwill's public listing emphasizes the hub scale and amenities but does not publish a public coworking rate on the official venue page.",
  },
  {
    name: "C51 Coworking House",
    shortDescription:
      "Historic coworking house on Columna for quiet work sessions and intimate community events.",
    description:
      "Curated from C51 Coworking's public listing. This entry models the venue as a coworking-style shared workspace inside a renovated 150-year-old house, combining open work areas with a terrace, projector-friendly event setup, and a cozy small-community atmosphere.",
    categorySlug: "coworking-space",
    spaceType: "COWORKING_SPACE",
    pricingType: "HOURLY",
    capacity: 1,
    minBookingHours: 1,
    maxBookingHours: 10,
    address: "51 Strada Columna",
    city: DEFAULT_CITY,
    state: null,
    country: DEFAULT_COUNTRY,
    postalCode: null,
    latitude: null,
    longitude: null,
    imageSourceUrls: [
      "https://coworker.imgix.net/photos/moldova/chisinau/c51-coworking/1-1541517227.jpg?auto=format%2Ccompress&fit=crop&h=0&mark=%2Ftemplate%2Fimg%2Fwm_icon.png&markalign=center%2Cmiddle&markscale=5&q=90&w=800",
    ],
    amenityNames: [
      "WiFi",
      "Air Conditioning",
      "Heating",
      "Lounge Area",
      "Outdoor Space",
      "Coffee/Tea",
    ],
    sourceUrls: ["https://www.coworker.com/moldova/chisinau/c51-coworking"],
    houseRules:
      "Coworking booking covers one working seat. Event setups, projector use, and catering are handled separately with the venue.",
    notes:
      "The public listing describes the space and amenities but does not expose a direct book-now rate.",
  },
];
