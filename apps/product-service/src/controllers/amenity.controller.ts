import { Prisma, prisma } from "@repo/db";
import { Request, Response } from "express";

export const createAmenity = async (req: Request, res: Response) => {
  const { name, icon, category, spaceTypes } = req.body;

  const amenity = await prisma.amenity.create({
    data: { name, icon, category, spaceTypes },
  });
  res.status(201).json(amenity);
};

export const updateAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id, 10);
  if (Number.isNaN(amenityId)) return res.status(400).json({ message: "Invalid ID" });
  const { name, icon, category, spaceTypes } = req.body;

  const amenity = await prisma.amenity.update({
    where: { id: amenityId },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(category !== undefined && { category }),
      ...(spaceTypes !== undefined && { spaceTypes }),
    },
  });

  return res.status(200).json(amenity);
};

export const deleteAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id, 10);
  if (Number.isNaN(amenityId)) return res.status(400).json({ message: "Invalid ID" });

  // First remove from all spaces
  await prisma.spaceAmenity.deleteMany({
    where: { amenityId },
  });

  const amenity = await prisma.amenity.delete({
    where: { id: amenityId },
  });

  return res.status(200).json(amenity);
};

export const getAmenities = async (req: Request, res: Response) => {
  const { category, spaceType } = req.query;

  const where: Prisma.AmenityWhereInput = {};

  if (category) {
    where.category = category as string;
  }

  if (spaceType) {
    where.OR = [
      { spaceTypes: { has: spaceType as any } },
      { spaceTypes: { isEmpty: true } },
    ];
  }

  const amenities = await prisma.amenity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return res.status(200).json(amenities);
};

export const getAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id, 10);
  if (Number.isNaN(amenityId)) return res.status(400).json({ message: "Invalid ID" });

  const amenity = await prisma.amenity.findUnique({
    where: { id: amenityId },
  });

  if (!amenity) {
    return res.status(404).json({ message: "Amenity not found" });
  }

  return res.status(200).json(amenity);
};
