import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getHost, getHosts } from "./host.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return {
    prisma,
    userFindMany: prisma.user.findMany,
    userCount: prisma.user.count,
    userFindUnique: prisma.user.findUnique,
  };
});

vi.mock("@repo/db", () => ({
  prisma: mocks.prisma,
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

describe("host controller", () => {
  afterEach(() => vi.resetAllMocks());

  it("lists only users that have at least one active venue", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        id: "u1",
        name: "Alice",
        username: "alice",
        image: null,
        bio: "Bio",
        hostingSince: new Date("2024-01-01"),
        hostVerified: true,
        venues: [
          { city: "Chisinau", _count: { spaces: 3 } },
          { city: "Chisinau", _count: { spaces: 0 } },
        ],
      },
    ]);
    mocks.userCount.mockResolvedValue(1);
    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getHosts(req, res);

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          venues: { some: { isActive: true } },
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.hosts).toHaveLength(1);
    expect(payload.hosts[0]).toMatchObject({
      id: "u1",
      venueCount: 2,
      spaceCount: 3,
      cities: ["Chisinau"],
    });
    expect(payload.pagination).toMatchObject({ page: 1, total: 1 });
  });

  it("returns 404 when host not found or has no active venues", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    const req = { params: { id: "missing" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns host with venues and active space lists", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "u1",
      name: "Alice",
      username: "alice",
      image: null,
      bio: "Bio",
      hostingSince: new Date("2024-01-01"),
      hostVerified: true,
      venues: [
        {
          id: 1,
          name: "Hub",
          city: "Chisinau",
          country: "Moldova",
          images: ["/v.jpg"],
          isActive: true,
          spaces: [{ id: 10, name: "Room A", isActive: true }],
          _count: { spaces: 1 },
        },
      ],
    });
    const req = { params: { id: "u1" } } as unknown as Request;
    const res = createResponse();

    await getHost(req, res);

    expect(mocks.userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.id).toBe("u1");
    expect(payload.venues).toHaveLength(1);
    expect(payload.venues[0].spaces[0].id).toBe(10);
  });
});
