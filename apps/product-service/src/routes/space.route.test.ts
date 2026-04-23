import { signAccessToken } from "@repo/auth-middleware/jwt";
import express, { type NextFunction, type Request, type Response } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex } from "node:stream";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import spaceRouter from "./space.route.js";

const mocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  findUnique: vi.fn(),
  producerSend: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    space: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    spaceAmenity: {
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
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
    mocks.update.mockResolvedValue({
      id: 123,
      title: "Updated title",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("ADMIN", "admin-1")}`,
      body: { title: "Updated title" },
      method: "PUT",
      url: "/spaces/123",
    });

    expect(response.status).toBe(200);
    expect(response.json).toEqual({
      id: 123,
      title: "Updated title",
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: "Updated title" },
        where: { id: 123 },
      })
    );
    expect(mocks.producerSend).toHaveBeenCalledWith("space.updated", { value: { id: 123 } });
  });
});
