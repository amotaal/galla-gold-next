// components/admin/stat-card.tsx
// Purpose: Stat Card - Display key metrics and statistics on admin dashboard

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string; // e.g., "+12.5%" or "-5.2%"
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  loading?: boolean;
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

/**
 * StatCard - Display a single statistic with optional trend indicator
 *
 * Features:
 * - Large value display
 * - Optional icon with custom color
 * - Trend indicator (up/down percentage)
 * - Description text
 * - Loading state
 * - Responsive design
 *
 * Usage:
 * <StatCard
 *   title="Total Users"
 *   value="1,234"
 *   change="+12.5%"
 *   changeType="positive"
 *   icon={Users}
 *   description="Active users this month"
 * />
 */
export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  description,
  loading = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            {/* Value */}
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mt-2" />
            ) : (
              <p className="text-3xl font-bold mt-2">{value}</p>
            )}

            {/* Change Indicator */}
            {change && !loading && (
              <p
                className={cn(
                  "text-sm font-medium mt-1",
                  changeType === "positive" && "text-green-600",
                  changeType === "negative" && "text-red-600",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}

            {/* Description */}
            {description && !loading && (
              <p className="text-xs text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className={cn("p-3 rounded-lg bg-muted", iconColor)}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
