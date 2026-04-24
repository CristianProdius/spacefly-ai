import { signAccessToken } from "@repo/auth-middleware/jwt";
import express, { type NextFunction, type Request, type Response } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import spaceRouter from "./space.route.js";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  producerSend: vi.fn(),
  reviewAggregate: vi.fn(),
  spaceCategoryFindUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    space: {
      count: mocks.count,
      create: mocks.create,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    spaceCategory: {
      findUnique: mocks.spaceCategoryFindUnique,
    },
    spaceAmenity: {
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
    },
    review: {
      aggregate: mocks.reviewAggregate,
    },
  },
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

vi.mock("../controllers/review.controller.js", () => ({
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getSpaceReviews: vi.fn(),
  respondToReview: vi.fn(),
  updateReview: vi.fn(),
}));

class MockSocket extends Duplex {
  public destroyed = false;
  public remoteAddress = "127.0.0.1";
  public writable = true;
  public _writableState = {
    corked: 0,
  };

  _read() {}

  _write(
    _chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    callback();
  }

  destroy(error?: Error) {
    this.destroyed = true;
    if (error) {
      this.emit("error", error);
    }
    this.emit("close");
    return this;
  }

  setTimeout() {
    return this;
  }

  cork() {}

  uncork() {}

  end() {
    this.emit("finish");
    return this;
  }

  destroySoon() {}
}

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/spaces", spaceRouter);
  app.use((err: { status?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) =>
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error!" })
  );
  return app;
};

const createToken = (role: "USER" | "HOST" | "ADMIN", userId = "host-user-1") =>
  signAccessToken({
    userId,
    email: `${role.toLowerCase()}@example.com`,
    role,
  });

const invokeApp = async (input: {
  authorization?: string;
  body?: unknown;
  method: string;
  url: string;
}) => {
  const app = createTestApp();
  const socket = new MockSocket();
  const req = new IncomingMessage(socket as never);
  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];
  const bodyBuffer = input.body ? Buffer.from(JSON.stringify(input.body)) : undefined;

  req.on("end", () => {
    req.complete = true;
  });

  res.write = ((
    chunk: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: (error?: Error | null) => void
  ) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback?.();
    return true;
  }) as typeof res.write;

  res.end = ((
    chunk?: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: () => void
  ) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res.finished = true;
    callback?.();
    res.emit("finish");
    return res;
  }) as typeof res.end;

  req.method = input.method;
  req.url = input.url;
  req.headers = {
    ...(input.authorization ? { authorization: input.authorization } : {}),
    ...(bodyBuffer
      ? {
          "content-length": String(bodyBuffer.length),
          "content-type": "application/json",
        }
      : {}),
  };

  const finished = new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
  });

  app(req as never, res as never);

  if (bodyBuffer) {
    req.push(bodyBuffer);
  }
  req.push(null);

  await finished;
  socket.destroy();
  res.removeAllListeners();
  req.removeAllListeners();

  const body = Buffer.concat(chunks);
  return {
    json: body.length > 0 ? JSON.parse(body.toString("utf8")) : null,
    status: res.statusCode,
  };
};

describe("space routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-host, non-admin users before reaching the update controller", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("USER", "user-1")}`,
      body: { title: "Updated title" },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({ message: "Host or Admin access required" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("keeps host-owner restrictions inside the update controller", async () => {
    mocks.findUnique.mockResolvedValue({
      hostId: "different-host",
      id: 123,
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: { title: "Updated title" },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({ message: "Not authorized to update this space" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows admins to update a space they do not own", async () => {
    mocks.findUnique.mockResolvedValue({
      hostId: "different-host",
      id: 123,
    });
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "meeting-training-room",
    });
    mocks.update.mockResolvedValue({
      category: null,
      id: 123,
      spaceType: "MEETING_ROOM",
      title: "Updated title",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("ADMIN", "admin-1")}`,
      body: {
        categorySlug: "meeting-training-room",
        spaceType: "EVENT_VENUE",
        title: "Updated title",
      },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(response.json).toEqual({
      category: null,
      id: 123,
      spaceType: "MEETING_ROOM",
      title: "Updated title",
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          categorySlug: "meeting-training-room",
          spaceType: "MEETING_ROOM",
          title: "Updated title",
        },
        where: { id: 123 },
      })
    );
    expect(mocks.producerSend).toHaveBeenCalledWith("space.updated", { value: { id: 123 } });
  });

  it("derives the canonical legacy space type from categorySlug on create", async () => {
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "retail-store-shop-front",
    });
    mocks.create.mockResolvedValue({
      amenities: [],
      category: {
        group: {
          name: "Retail & Commercial",
          slug: "retail-commercial",
          sortOrder: 4,
        },
        groupSlug: "retail-commercial",
        id: 17,
        name: "Retail Store / Shop Front",
        slug: "retail-store-shop-front",
        sortOrder: 1,
      },
      id: 321,
      spaceType: "PRIVATE_OFFICE",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        address: "Main Street 1",
        amenities: [],
        categorySlug: "retail-store-shop-front",
        city: "Chisinau",
        country: "Moldova",
        description:
          "A bright retail space for launches, previews, and short-term brand activations.",
        images: ["/space.png"],
        name: "Launch Store",
        pricingType: "DAILY",
        shortDescription: "Flexible retail frontage in the city center",
        spaceType: "MEETING_ROOM",
      },
      method: "POST",
      url: "/spaces",
    });

    expect(response.status).toBe(201);
    expect(response.json).toMatchObject({
      id: 321,
      spaceType: "PRIVATE_OFFICE",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categorySlug: "retail-store-shop-front",
          hostId: "host-user-1",
          spaceType: "PRIVATE_OFFICE",
        }),
      })
    );
  });

  it("normalizes the legacy meeting-room slug on update", async () => {
    mocks.findUnique.mockResolvedValue({
      hostId: "host-user-1",
      id: 123,
    });
    mocks.spaceCategoryFindUnique.mockResolvedValue({
      slug: "meeting-training-room",
    });
    mocks.update.mockResolvedValue({
      category: {
        group: {
          name: "Business & Office",
          slug: "business-office",
          sortOrder: 1,
        },
        groupSlug: "business-office",
        id: 3,
        name: "Meeting & Training Room",
        slug: "meeting-training-room",
        sortOrder: 3,
      },
      id: 123,
      spaceType: "MEETING_ROOM",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST", "host-user-1")}`,
      body: {
        categorySlug: "meeting-room",
        spaceType: "WEDDING_VENUE",
      },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          categorySlug: "meeting-training-room",
          spaceType: "MEETING_ROOM",
        },
      })
    );
  });

  it("applies groupSlug filters through the category relation on list endpoints", async () => {
    mocks.findMany.mockResolvedValue([
      {
        _count: { reviews: 0 },
        amenities: [],
        category: {
          group: {
            name: "Events & Celebrations",
            slug: "events-celebrations",
            sortOrder: 2,
          },
          groupSlug: "events-celebrations",
          id: 11,
          name: "Event Venue",
          slug: "event-venue",
          sortOrder: 1,
        },
        host: {
          id: "host-1",
          image: null,
          name: "Host",
        },
        id: 1,
      },
    ]);
    mocks.count.mockResolvedValue(1);
    mocks.reviewAggregate.mockResolvedValue({
      _avg: { rating: null },
    });

    const response = await invokeApp({
      method: "GET",
      url: "/spaces?groupSlug=events-celebrations",
    });

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: {
            is: {
              groupSlug: "events-celebrations",
            },
          },
        }),
      })
    );
    expect(response.json.pagination.total).toBe(1);
  });
});
