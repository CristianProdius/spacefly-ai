import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createVenue, updateVenue } from "./venue.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    space: {
      updateMany: vi.fn(),
    },
    venue: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    prisma,
    producerSend: vi.fn(),
    spaceUpdateMany: prisma.space.updateMany,
    venueCreate: prisma.venue.create,
    venueFindUnique: prisma.venue.findUnique,
    venueUpdate: prisma.venue.update,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

const createResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };

  res.status.mockReturnValue(res);
  return res;
};

describe("venue controller contract", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("persists media, currency, and translations when creating venues", async () => {
    mocks.venueCreate.mockResolvedValue({ id: 12 });
    const req = {
      body: {
        address: "Main 1",
        city: "Chisinau",
        country: "Moldova",
        currency: "EUR",
        description: "Long description",
        descriptionTranslations: { ro: "Descriere" },
        images: ["/venue.jpg"],
        name: "Venue",
        nameTranslations: { ro: "Locatie" },
        shortDescTranslations: { ro: "Scurt" },
        shortDescription: "Short description",
        videoUrl: "https://youtu.be/demo",
      },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await createVenue(req, res);

    expect(mocks.venueCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "EUR",
        descriptionTranslations: { ro: "Descriere" },
        nameTranslations: { ro: "Locatie" },
        shortDescTranslations: { ro: "Scurt" },
        videoUrl: "https://youtu.be/demo",
      }),
    });
  });

  it("persists media, currency, and translations when updating venues", async () => {
    mocks.venueFindUnique
      .mockResolvedValueOnce({ hostId: "host-1", id: 12 })
      .mockResolvedValueOnce({ id: 12 });
    mocks.venueUpdate.mockResolvedValue({ id: 12 });
    const req = {
      body: {
        currency: "MDL",
        nameTranslations: { ru: "Ploshchadka" },
        videoUrl: "https://youtube.com/watch?v=demo",
      },
      params: { id: "12" },
      user: { role: "HOST" },
      userId: "host-1",
    } as unknown as Request;
    const res = createResponse();

    await updateVenue(req, res);

    expect(mocks.venueUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "MDL",
        nameTranslations: { ru: "Ploshchadka" },
        videoUrl: "https://youtube.com/watch?v=demo",
      }),
      where: { id: 12 },
    });
  });
});
