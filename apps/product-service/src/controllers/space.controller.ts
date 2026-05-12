import { Request, Response } from "express";
import { prisma, Prisma, PricingType, SpaceType, CancellationPolicy } from "@repo/db";
import { producer } from "../utils/kafka.js";
import { buildCategoryPayload } from "../lib/space-taxonomy.js";

const venueInclude = {
  select: {
    id: true,
    name: true,
    shortDescription: true,
    description: true,
    images: true,
    address: true,
    city: true,
    state: true,
    country: true,
    postalCode: true,
    latitude: true,
    longitude: true,
    hostId: true,
    isActive: true,
  },
};

/**
 * Flatten venue location fields onto space for backward compat.
 * Existing clients read space.city, space.address — this keeps them working.
 */
const flattenVenue = (space: any) => {
  if (!space?.venue) return space;
  return {
    ...space,
    address: space.venue.address,
    city: space.venue.city,
    state: space.venue.state,
    country: space.venue.country,
    postalCode: space.venue.postalCode,
    latitude: space.venue.latitude,
    longitude: space.venue.longitude,
  };
};

// Get all spaces with search/filter
export const getSpaces = async (req: Request, res: Response) => {
  // Parse sort param into sortBy/sortOrder before destructuring
  const sortParam = req.query.sort as string | undefined;
  let resolvedSortBy = (req.query.sortBy as string) || "createdAt";
  let resolvedSortOrder = (req.query.sortOrder as string) || "desc";

  if (sortParam) {
    switch (sortParam) {
      case "newest":
        resolvedSortBy = "createdAt";
        resolvedSortOrder = "desc";
        break;
      case "price_asc":
        resolvedSortBy = "pricePerHour";
        resolvedSortOrder = "asc";
        break;
      case "price_desc":
        resolvedSortBy = "pricePerHour";
        resolvedSortOrder = "desc";
        break;
      case "rating":
        // averageRating is computed after the query, so we can't sort by it in Prisma.
        // Falls back to newest as a reasonable approximation.
        resolvedSortBy = "createdAt";
        resolvedSortOrder = "desc";
        break;
    }
  }

  const {
    city,
    spaceType,
    categorySlug,
    minPrice,
    maxPrice,
    minCapacity: minCapacityParam,
    capacity: capacityParam,
    amenityIds,
    instantBook,
    currency: currencyParam,
    page = "1",
    limit = "20",
  } = req.query;

  const minCapacity = minCapacityParam || capacityParam;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const where: Prisma.SpaceWhereInput = {
    isActive: true,
    ...(city && {
      venue: { city: { contains: city as string, mode: "insensitive" } },
    }),
    ...(spaceType && { spaceType: spaceType as SpaceType }),
    ...(categorySlug && { categorySlug: categorySlug as string }),
    ...(minCapacity && { capacity: { gte: parseInt(minCapacity as string) } }),
    ...(instantBook !== undefined && { instantBook: instantBook === "true" }),
    ...(currencyParam && { currency: currencyParam as string }),
    ...((minPrice || maxPrice) && {
      OR: [
        {
          pricePerHour: {
            ...(minPrice && { gte: parseInt(minPrice as string) }),
            ...(maxPrice && { lte: parseInt(maxPrice as string) }),
          },
        },
        {
          pricePerDay: {
            ...(minPrice && { gte: parseInt(minPrice as string) }),
            ...(maxPrice && { lte: parseInt(maxPrice as string) }),
          },
        },
      ],
    }),
  };

  const orderBy: Prisma.SpaceOrderByWithRelationInput = {
    [resolvedSortBy]: resolvedSortOrder,
  };

  const skip = (pageNum - 1) * limitNum;

  const [spaces, total] = await Promise.all([
    prisma.space.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        category: true,
        venue: venueInclude,
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        pricingTiers: { orderBy: { minutes: "asc" } },
        _count: {
          select: { reviews: true },
        },
      },
    }),
    prisma.space.count({ where }),
  ]);

  // Calculate average rating for each space
  const spacesWithRating = await Promise.all(
    spaces.map(async (space) => {
      const avgRating = await prisma.review.aggregate({
        where: { spaceId: space.id },
        _avg: { rating: true },
      });
      return flattenVenue({
        ...space,
        averageRating: avgRating._avg.rating || 0,
        reviewCount: space._count.reviews,
      });
    })
  );

  res.status(200).json({
    spaces: spacesWithRating,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

// Get single space by ID
export const getSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      category: true,
      venue: venueInclude,
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          hostingSince: true,
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      pricingTiers: { orderBy: { minutes: "asc" } },
      availability: true,
      blockedDates: {
        where: {
          date: { gte: new Date() },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Get average rating
  const avgRating = await prisma.review.aggregate({
    where: { spaceId: space.id },
    _avg: { rating: true },
  });

  const reviewCount = await prisma.review.count({
    where: { spaceId: space.id },
  });

  res.status(200).json(
    flattenVenue({
      ...space,
      averageRating: avgRating._avg.rating || 0,
      reviewCount,
    })
  );
};

// Create space (HOST only)
export const createSpace = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const { amenityIds, venueId, pricingTiers, ...spaceData } = req.body;

  if (!venueId) {
    return res.status(400).json({ message: "venueId is required" });
  }
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) {
    return res.status(400).json({ message: "Venue not found" });
  }
  if (venue.hostId !== hostId) {
    return res.status(403).json({ message: "Venue does not belong to you" });
  }

  const space = await prisma.space.create({
    data: {
      ...buildCategoryPayload(spaceData),
      hostId,
      venueId,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      postalCode: venue.postalCode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      amenities: amenityIds
        ? {
            create: amenityIds.map((amenityId: number) => ({ amenityId })),
          }
        : undefined,
    },
    include: {
      category: true,
      amenities: {
        include: { amenity: true },
      },
    },
  });

  if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
    await prisma.pricingTier.createMany({
      data: pricingTiers.map((tier: { minutes: number; label: string; price: number }) => ({
        spaceId: space.id,
        minutes: tier.minutes,
        label: tier.label,
        price: tier.price,
      })),
    });
  }

  producer.send("space.created", { value: { id: space.id, hostId } });

  res.status(201).json(space);
};

// Update space (HOST owner or ADMIN)
export const updateSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Check ownership (unless admin)
  if (existingSpace.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to update this space" });
  }

  const { amenityIds, venueId, pricingTiers, ...body } = req.body;

  // Whitelist allowed update fields to prevent mass assignment
  const allowed: Record<string, unknown> = {};
  const allowedKeys = [
    "name", "shortDescription", "description", "spaceType", "pricingType",
    "pricePerHour", "pricePerDay", "cleaningFee", "capacity",
    "minBookingHours", "maxBookingHours", "images", "isActive",
    "instantBook", "cancellationPolicy", "houseRules", "categorySlug", "currency",
  ] as const;
  for (const key of allowedKeys) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  // If venueId is being changed, validate ownership
  if (venueId !== undefined && venueId !== existingSpace.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      return res.status(400).json({ message: "Venue not found" });
    }
    if (venue.hostId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Venue does not belong to you" });
    }
    allowed.venueId = venueId;
    // Update denormalized location fields from new venue
    allowed.address = venue.address;
    allowed.city = venue.city;
    allowed.state = venue.state;
    allowed.country = venue.country;
    allowed.postalCode = venue.postalCode;
    allowed.latitude = venue.latitude;
    allowed.longitude = venue.longitude;
  }

  // Handle categorySlug → spaceType resolution
  if (allowed.categorySlug) {
    const resolved = buildCategoryPayload({ ...body, categorySlug: allowed.categorySlug });
    allowed.categorySlug = resolved.categorySlug;
    allowed.spaceType = resolved.spaceType;
  }

  const space = await prisma.space.update({
    where: { id: spaceId },
    data: allowed,
    include: {
      category: true,
      amenities: {
        include: { amenity: true },
      },
    },
  });

  // Update amenities if provided
  if (amenityIds !== undefined) {
    await prisma.spaceAmenity.deleteMany({
      where: { spaceId },
    });
    if (amenityIds.length > 0) {
      await prisma.spaceAmenity.createMany({
        data: amenityIds.map((amenityId: number) => ({
          spaceId,
          amenityId,
        })),
      });
    }
  }

  // Update pricing tiers if provided
  if (pricingTiers !== undefined) {
    await prisma.pricingTier.deleteMany({ where: { spaceId } });
    if (Array.isArray(pricingTiers) && pricingTiers.length > 0) {
      await prisma.pricingTier.createMany({
        data: pricingTiers.map((tier: { minutes: number; label: string; price: number }) => ({
          spaceId,
          minutes: tier.minutes,
          label: tier.label,
          price: tier.price,
        })),
      });
    }
  }

  producer.send("space.updated", { value: { id: space.id } });

  res.status(200).json(space);
};

// Delete space (HOST owner or ADMIN)
export const deleteSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (existingSpace.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to delete this space" });
  }

  // Soft delete - just mark as inactive
  await prisma.space.update({
    where: { id: spaceId },
    data: { isActive: false },
  });

  producer.send("space.deleted", { value: { id: spaceId } });

  res.status(200).json({ message: "Space deleted successfully" });
};

// Get host's own spaces
export const getMySpaces = async (req: Request, res: Response) => {
  const hostId = req.userId!;

  const spaces = await prisma.space.findMany({
    where: { hostId },
    include: {
      category: true,
      venue: venueInclude,
      pricingTiers: { orderBy: { minutes: "asc" } },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(spaces.map(flattenVenue));
};

// Get/Update space availability
export const getAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);

  const availability = await prisma.availability.findMany({
    where: { spaceId },
    orderBy: { dayOfWeek: "asc" },
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      spaceId,
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
  });

  res.status(200).json({ availability, blockedDates });
};

export const updateAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const { availability, blockedDates } = req.body;

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (space.hostId !== userId && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Update availability
  if (availability) {
    await prisma.availability.deleteMany({ where: { spaceId } });
    await prisma.availability.createMany({
      data: availability.map((a: any) => ({
        spaceId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isOpen: a.isOpen ?? true,
      })),
    });
  }

  // Update blocked dates
  if (blockedDates) {
    await prisma.blockedDate.deleteMany({
      where: {
        spaceId,
        date: { gte: new Date() },
      },
    });
    await prisma.blockedDate.createMany({
      data: blockedDates.map((d: any) => ({
        spaceId,
        date: new Date(d.date),
        reason: d.reason,
      })),
    });
  }

  res.status(200).json({ message: "Availability updated" });
};

// Check availability for specific dates
export const checkAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const { startDate, endDate } = req.body;

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      availability: true,
      blockedDates: true,
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check blocked dates
  const blockedInRange = space.blockedDates.filter((bd) => {
    const bdDate = new Date(bd.date);
    return bdDate >= start && bdDate <= end;
  });

  if (blockedInRange.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Some dates are blocked",
      blockedDates: blockedInRange,
    });
  }

  // Check existing bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      spaceId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Dates conflict with existing bookings",
    });
  }

  res.status(200).json({ available: true });
};
