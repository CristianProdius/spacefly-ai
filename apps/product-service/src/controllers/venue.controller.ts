import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { producer } from "../utils/kafka.js";

export const getMyVenues = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const venues = await prisma.venue.findMany({
    where: { hostId },
    include: { _count: { select: { spaces: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(venues);
};

export const getVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string);
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      host: { select: { id: true, name: true, image: true } },
      spaces: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          spaceType: true,
          capacity: true,
          pricePerHour: true,
          pricePerDay: true,
          pricingType: true,
          images: true,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!venue) return res.status(404).json({ message: "Venue not found" });
  res.status(200).json(venue);
};

export const createVenue = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const {
    name,
    shortDescription,
    description,
    images,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
  } = req.body;
  if (!name || !address || !city || !country) {
    return res
      .status(400)
      .json({ message: "Name, address, city, and country are required" });
  }
  const venue = await prisma.venue.create({
    data: {
      name,
      shortDescription: shortDescription || "",
      description: description || "",
      images: images || [],
      address,
      city,
      state: state || null,
      country,
      postalCode: postalCode || null,
      latitude: latitude || null,
      longitude: longitude || null,
      hostId,
    },
  });
  producer.send("venue.created", { value: { id: venue.id, hostId } });
  res.status(201).json(venue);
};

export const updateVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string);
  const userId = req.userId!;
  const userRole = req.user?.role;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && userRole !== "ADMIN") {
    return res
      .status(403)
      .json({ message: "Not authorized to update this venue" });
  }
  const {
    name,
    shortDescription,
    description,
    images,
    address,
    city,
    state,
    country,
    postalCode,
    latitude,
    longitude,
    isActive,
  } = req.body;
  const venue = await prisma.venue.update({
    where: { id: venueId },
    data: {
      ...(name !== undefined && { name }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(country !== undefined && { country }),
      ...(postalCode !== undefined && { postalCode }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  producer.send("venue.updated", { value: { id: venue.id } });
  res.status(200).json(venue);
};

export const deleteVenue = async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id as string);
  const userId = req.userId!;
  const userRole = req.user?.role;
  const existing = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!existing) return res.status(404).json({ message: "Venue not found" });
  if (existing.hostId !== userId && userRole !== "ADMIN") {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this venue" });
  }
  await prisma.$transaction([
    prisma.venue.update({
      where: { id: venueId },
      data: { isActive: false },
    }),
    prisma.space.updateMany({ where: { venueId }, data: { isActive: false } }),
  ]);
  producer.send("venue.deleted", { value: { id: venueId } });
  res.status(200).json({ message: "Venue deleted successfully" });
};
