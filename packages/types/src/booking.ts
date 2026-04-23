import z from "zod";
import type { Space } from "./space";
import type { User } from "./auth";

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface Booking {
  id: string;

  // Guest & Host
  guestId: string;
  hostId: string;
  spaceId: number;

  // Booking details
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  guests: number;
  isHourly: boolean;

  // Pricing (all in dollars)
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;

  // Status
  status: BookingStatus;
  guestMessage: string | null;
  hostMessage: string | null;

  // Cancellation
  cancelledBy: string | null;
  cancellationReason: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
}

export interface BookingWithDetails extends Booking {
  space: Space;
  guest: Pick<User, "id" | "name" | "email" | "image">;
  host: Pick<User, "id" | "name" | "email" | "image">;
}

export interface BookingChartType {
  month: string;
  total: number;
  confirmed: number;
  revenue: number;
}

// Zod Schemas
export const CreateBookingSchema = z.object({
  spaceId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guests: z.number().min(1).default(1),
  isHourly: z.boolean(),
  message: z.string().optional(),
});

export const ApproveBookingSchema = z.object({
  hostNote: z.string().optional(),
});

export const RejectBookingSchema = z.object({
  reason: z.string().min(1, "Please provide a reason for rejection"),
});

export const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ApproveBookingInput = z.infer<typeof ApproveBookingSchema>;
export type RejectBookingInput = z.infer<typeof RejectBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
