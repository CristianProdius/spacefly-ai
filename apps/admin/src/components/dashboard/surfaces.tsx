import type { ComponentProps, ElementType, ReactNode } from "react";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

function DashboardPageHeader({
  title,
  description,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  titleAs?: "h2" | "h3" | "h4";
};

function DashboardSection({
  title,
  description,
  children,
  className,
  contentClassName,
  titleAs: TitleTag = "h2",
}: DashboardSectionProps) {
  return (
    <Card className={cn("gap-0 border-border/60 bg-card shadow-sm", className)}>
      <CardHeader className="gap-1 border-b border-border/60">
        <TitleTag className="text-base font-semibold text-card-foreground">
          {title}
        </TitleTag>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("pt-6", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

type DashboardStatCardProps = {
  label: string;
  value: string;
  icon: ElementType;
  className?: string;
};

function DashboardStatCard({
  label,
  value,
  icon: Icon,
  className,
}: DashboardStatCardProps) {
  return (
    <Card className={cn("gap-0 border-border/60 bg-card shadow-sm", className)}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type DashboardActionCardProps = {
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  className?: string;
} & Omit<
  ComponentProps<typeof Link>,
  "children" | "className" | "href" | "title"
>;

const actionCardClassName =
  "flex min-h-36 w-full flex-col items-start gap-4 rounded-lg border border-border/60 bg-card px-5 py-4 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function DashboardActionCard({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: DashboardActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(actionCardClassName, className)}
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

export {
  DashboardActionCard,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatCard,
};
