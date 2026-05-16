import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bookingRoute } from "./booking.js";

const mocks = vi.hoisted(() => {
  const bookingCreate = vi.fn();
  const bookingFindFirst = vi.fn();
  const bookingFindMany = vi.fn();
  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    booking: {
      create: bookingCreate,
      findFirst: bookingFindFirst,
      findMany: bookingFindMany,
    },
    exchangeRate: {
      findUnique: vi.fn(),
    },
    space: {
      findUnique: vi.fn(),
    },
  };

  return {
    bookingCreate,
    bookingFindFirst,
    bookingFindMany,
    prisma,
    producerSend: vi.fn(),
    spaceFindUnique: prisma.space.findUnique,
  };
});

vi.mock("@repo/db", () => ({
  BookingStatus: {
    CONFIRMED: "CONFIRMED",
    PENDING: "PENDING",
  },
  prisma: mocks.prisma,
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(bookingRoute);
  return app;
};

const createUserToken = () =>
  signAccessToken({
    userId: "guest-1",
    email: "guest@example.com",
    role: "USER",
  });

const monday = "2026-05-18";

const baseSpace = {
  availability: [
    {
      dayOfWeek: 1,
      endTime: "17:00",
      isOpen: true,
      startTime: "09:00",
    },
  ],
  blockedDates: [],
  capacity: 4,
  cleaningFee: 0,
  currency: "USD",
  host: { email: "host@example.com" },
  hostId: "host-1",
  id: 42,
  instantBook: false,
  isActive: true,
  maxBookingHours: 8,
  minBookingHours: 1,
  name: "Focused room",
  pricePerDay: null,
  pricePerHour: 25,
  pricingTiers: [],
  pricingType: "HOURLY",
};

const createdBooking = {
  guest: {
    email: "guest@example.com",
    id: "guest-1",
    name: "Guest",
  },
  guestId: "guest-1",
  hostId: "host-1",
  id: "booking-new",
  space: {
    host: { email: "host@example.com" },
  },
  spaceId: 42,
  status: "PENDING",
};

describe("booking routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("allows adjacent hourly bookings on the same date", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue({
      endDate: new Date(monday),
      endTime: "10:00",
      isHourly: true,
      startDate: new Date(monday),
      startTime: "09:00",
    });
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "10:00",
        isHourly: true,
        startDate: new Date(monday),
        startTime: "09:00",
      },
    ]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalled();
    await app.close();
  });

  it("rejects hourly bookings outside configured availability", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "18:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "17:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Booking time is outside availability" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects blocked booking dates before creating a booking", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      blockedDates: [{ date: new Date(monday), reason: "Maintenance" }],
    });
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Some requested dates are blocked" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects invalid hourly time ranges before pricing", async () => {
    const app = await createApp();

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "10:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "11:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.spaceFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });
});
