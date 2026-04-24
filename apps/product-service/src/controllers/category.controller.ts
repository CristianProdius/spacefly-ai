import { Prisma, prisma } from "@repo/db";
import { Request, Response } from "express";

const buildCategoryCreateInput = (
  body: Record<string, unknown>
): Prisma.SpaceCategoryCreateInput => {
  const groupSlug =
    typeof body.groupSlug === "string" && body.groupSlug.trim() !== ""
      ? body.groupSlug
      : null;
  const name = String(body.name ?? "").trim();
  const slug =
    typeof body.slug === "string" && body.slug.trim() !== ""
      ? body.slug.trim()
      : name.toLowerCase().replace(/\s+/g, "-");

  if (!groupSlug) {
    throw Object.assign(new Error("groupSlug is required"), { status: 400 });
  }

  return {
    description: typeof body.description === "string" ? body.description : null,
    group: {
      connect: {
        slug: groupSlug,
      },
    },
    icon: typeof body.icon === "string" ? body.icon : null,
    name,
    slug,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
  };
};

const buildCategoryUpdateInput = (
  body: Record<string, unknown>
): Prisma.SpaceCategoryUpdateInput => {
  const data: Prisma.SpaceCategoryUpdateInput = {
    ...(typeof body.description === "string" || body.description === null
      ? { description: body.description as string | null }
      : {}),
    ...(typeof body.icon === "string" || body.icon === null
      ? { icon: body.icon as string | null }
      : {}),
    ...(typeof body.name === "string" ? { name: body.name } : {}),
    ...(typeof body.slug === "string" ? { slug: body.slug } : {}),
    ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
  };

  if (typeof body.groupSlug === "string" && body.groupSlug.trim() !== "") {
    data.group = {
      connect: {
        slug: body.groupSlug,
      },
    };
  }

  return data;
};

export const createCategory = async (req: Request, res: Response) => {
  if (typeof req.body?.name !== "string" || req.body.name.trim() === "") {
    return res.status(400).json({ message: "Category name is required" });
  }
  if (typeof req.body?.groupSlug !== "string" || req.body.groupSlug.trim() === "") {
    return res.status(400).json({ message: "Category group is required" });
  }

  const category = await prisma.spaceCategory.create({
    data: buildCategoryCreateInput(req.body),
    include: {
      group: true,
    },
  });

  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);

  const category = await prisma.spaceCategory.update({
    where: { id: categoryId },
    data: buildCategoryUpdateInput(req.body),
    include: {
      group: true,
    },
  });

  return res.status(200).json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);

  const category = await prisma.spaceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const spacesCount = await prisma.space.count({
    where: { categorySlug: category.slug },
  });

  if (spacesCount > 0) {
    return res.status(400).json({
      message: `Cannot delete category with ${spacesCount} spaces. Please reassign or delete those spaces first.`,
    });
  }

  await prisma.spaceCategory.delete({
    where: { id: categoryId },
  });

  return res.status(200).json({ message: "Category deleted" });
};

export const getCategories = async (req: Request, res: Response) => {
  const grouped = req.query.grouped === "true";

  if (grouped) {
    const groups = await prisma.spaceCategoryGroup.findMany({
      include: {
        categories: {
          include: {
            _count: {
              select: { spaces: true },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json(groups);
  }

  const categories = await prisma.spaceCategory.findMany({
    include: {
      _count: {
        select: { spaces: true },
      },
      group: true,
    },
    orderBy: [{ group: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return res.status(200).json(categories);
};

export const getCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);

  const category = await prisma.spaceCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { spaces: true },
      },
      group: true,
    },
  });

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.status(200).json(category);
};
