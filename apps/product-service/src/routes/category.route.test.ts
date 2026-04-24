import express, { type NextFunction, type Request, type Response } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import categoryRouter from "./category.route.js";

const mocks = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  categoryFindUnique: vi.fn(),
  groupFindMany: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    spaceCategory: {
      findMany: mocks.categoryFindMany,
      findUnique: mocks.categoryFindUnique,
    },
    spaceCategoryGroup: {
      findMany: mocks.groupFindMany,
    },
  },
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
  app.use("/categories", categoryRouter);
  app.use((err: { status?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) =>
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error!" })
  );
  return app;
};

const invokeApp = async (input: { method: string; url: string }) => {
  const app = createTestApp();
  const socket = new MockSocket();
  const req = new IncomingMessage(socket as never);
  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];

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
  req.headers = {};

  const finished = new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
  });

  app(req as never, res as never);
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

describe("category routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns categories with embedded group metadata ordered for admin/client use", async () => {
    mocks.categoryFindMany.mockResolvedValue([
      {
        _count: { spaces: 0 },
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
    ]);

    const response = await invokeApp({
      method: "GET",
      url: "/categories",
    });

    expect(response.status).toBe(200);
    expect(response.json).toEqual([
      {
        _count: { spaces: 0 },
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
    ]);
    expect(mocks.categoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          group: true,
        }),
      })
    );
  });

  it("returns grouped taxonomy data when requested", async () => {
    mocks.groupFindMany.mockResolvedValue([
      {
        categories: [
          {
            _count: { spaces: 0 },
            groupSlug: "events-celebrations",
            id: 6,
            name: "Event Venue",
            slug: "event-venue",
            sortOrder: 1,
          },
        ],
        name: "Events & Celebrations",
        slug: "events-celebrations",
        sortOrder: 2,
      },
    ]);

    const response = await invokeApp({
      method: "GET",
      url: "/categories?grouped=true",
    });

    expect(response.status).toBe(200);
    expect(response.json).toEqual([
      {
        categories: [
          {
            _count: { spaces: 0 },
            groupSlug: "events-celebrations",
            id: 6,
            name: "Event Venue",
            slug: "event-venue",
            sortOrder: 1,
          },
        ],
        name: "Events & Celebrations",
        slug: "events-celebrations",
        sortOrder: 2,
      },
    ]);
  });
});
