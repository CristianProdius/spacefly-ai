import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { updateReview } from "./review.controller.js";

const mocks = vi.hoisted(() => ({
  reviewFindUnique: vi.fn(),
  reviewUpdate: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    review: {
      findUnique: mocks.reviewFindUnique,
      update: mocks.reviewUpdate,
    },
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

describe("review controller validation", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects invalid update ratings before writing to Prisma", async () => {
    mocks.reviewFindUnique.mockResolvedValue({
      id: 10,
      rating: 4,
      userId: "user-1",
    });
    const req = {
      body: { rating: 6 },
      params: { reviewId: "10" },
      user: { role: "USER" },
      userId: "user-1",
    } as unknown as Request;
    const res = createResponse();

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Rating must be between 1 and 5" });
    expect(mocks.reviewUpdate).not.toHaveBeenCalled();
  });
});
