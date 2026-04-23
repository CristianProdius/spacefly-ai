"use client";

import { useCallback, useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";

import {
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  serviceFee: number;
  cleaningFee: number;
  startDate: string;
  endDate: string;
  space: {
    name: string;
  };
  guest: {
    name: string;
  };
}

interface EarningsStats {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  completedBookings: number;
}

const HostEarningsPage = () => {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings/host`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data: Booking[] = await res.json();
        setBookings(data);

        const completedBookings = data.filter(
          (b) => b.status === "COMPLETED"
        );
        const pendingBookings = data.filter((b) =>
          ["CONFIRMED"].includes(b.status)
        );

        const calculateNetEarnings = (booking: Booking) =>
          booking.totalAmount - booking.serviceFee;

        const totalEarnings = completedBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );
        const pendingEarnings = pendingBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        const now = new Date();
        const thisMonthBookings = completedBookings.filter((b) => {
          const endDate = new Date(b.endDate);
          return (
            endDate.getMonth() === now.getMonth() &&
            endDate.getFullYear() === now.getFullYear()
          );
        });
        const thisMonth = thisMonthBookings.reduce(
          (sum, b) => sum + calculateNetEarnings(b),
          0
        );

        setStats({
          totalEarnings,
          pendingEarnings,
          thisMonth,
          completedBookings: completedBookings.length,
        });
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchEarnings();
  }, [fetchEarnings, token]);

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const pendingPayoutBookings = bookings.filter((b) =>
    ["CONFIRMED"].includes(b.status)
  );
  const statCards = [
    {
      label: "Total Earnings",
      value: `$${stats?.totalEarnings?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
    },
    {
      label: "Pending",
      value: `$${stats?.pendingEarnings?.toFixed(2) || "0.00"}`,
      icon: Clock,
    },
    {
      label: "This Month",
      value: `$${stats?.thisMonth?.toFixed(2) || "0.00"}`,
      icon: Calendar,
    },
    {
      label: "Completed",
      value: `${stats?.completedBookings || 0}`,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Earnings"
        description="Track your hosting income"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {pendingPayoutBookings.length > 0 && (
        <DashboardSection
          title="Pending Payouts"
          description="Confirmed bookings that will pay out after completion."
        >
          <div className="rounded-lg border border-border/60 bg-accent/30 p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              These bookings are confirmed and earnings will be available after
              completion.
            </p>
            <div className="space-y-3">
              {pendingPayoutBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-card-foreground">
                      {booking.space.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString()} -{" "}
                      {booking.guest.name}
                    </p>
                  </div>
                  <p className="font-semibold text-card-foreground">
                    ${(booking.totalAmount - booking.serviceFee).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>
      )}

      <DashboardSection
        title="Completed Bookings"
        description="Transaction history for completed stays."
      >
        {completedBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-accent/20 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No completed bookings yet
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full">
              <thead className="bg-accent/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Space
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Service Fee
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Net Earnings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {completedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 text-sm text-card-foreground">
                      {booking.space.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {booking.guest.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-card-foreground">
                      ${booking.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-destructive">
                      -${booking.serviceFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-primary">
                      ${(booking.totalAmount - booking.serviceFee).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  );
};

export default HostEarningsPage;
