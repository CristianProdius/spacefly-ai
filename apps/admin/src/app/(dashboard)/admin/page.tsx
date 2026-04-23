import { Building2, Users, CalendarCheck, DollarSign } from "lucide-react";

import {
  DashboardActionCard,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard";

const AdminDashboard = () => {
  const stats = [
    { label: "Total Spaces", value: "--", icon: Building2 },
    { label: "Total Users", value: "--", icon: Users },
    { label: "Total Bookings", value: "--", icon: CalendarCheck },
    { label: "Revenue", value: "--", icon: DollarSign },
  ];

  const actions = [
    {
      title: "Manage Users",
      description: "View and manage platform users",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "View Bookings",
      description: "Monitor all bookings",
      icon: CalendarCheck,
      href: "/admin/bookings",
    },
    {
      title: "View Spaces",
      description: "Browse all listed spaces",
      icon: Building2,
      href: "/admin/spaces",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Platform Dashboard"
        description="Manage all spaces, users, and bookings across the platform"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DashboardSection
        title="Quick Actions"
        description="Jump into the admin workflows that need attention."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <DashboardActionCard
              key={action.href}
              title={action.title}
              description={action.description}
              icon={action.icon}
              href={action.href}
            />
          ))}
        </div>
      </DashboardSection>
    </div>
  );
};

export default AdminDashboard;
