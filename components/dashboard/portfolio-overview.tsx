// /components/dashboard/portfolio-overview.tsx
// Portfolio Overview Component - GOLD STYLED
// Purpose: Portfolio cards with gold accents matching design sample
// UPDATE: Vibrant gold colors, glass effects, proper styling

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PortfolioOverviewProps {
  totalValue: number;
  goldBalance: number;
  goldValue: number;
  cashBalance: number;
  changePercent: number;
  transactionCount: number;
  achievementsCount: number;
  isLoading?: boolean;
}

// ============================================================================
// CIRCULAR PROGRESS COMPONENT
// ============================================================================

/**
 * CircularProgress - Circular progress indicator with gold accent
 */
function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = "primary",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Color mapping
  const colors = {
    primary: "#FFC107", // Gold
    blue: "#3B82F6",
    green: "#10B981",
  };

  const strokeColor = colors[color as keyof typeof colors] || colors.primary;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle with gold color */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
          style={{
            filter: `drop-shadow(0 0 8px ${strokeColor}40)`, // Gold glow
          }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: strokeColor }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// PORTFOLIO OVERVIEW COMPONENT
// ============================================================================

/**
 * PortfolioOverview - Main portfolio cards with gold styling
 *
 * Features:
 * - Total portfolio value with gold badge
 * - Gold balance with circular progress (gold)
 * - Cash balance with circular progress (blue)
 * - Transaction count
 * - Achievements count
 * - Glass morphism effects
 * - Gold accents throughout
 */
export function PortfolioOverview({
  totalValue,
  goldBalance,
  goldValue,
  cashBalance,
  changePercent,
  transactionCount,
  achievementsCount,
  isLoading,
}: PortfolioOverviewProps) {
  const isPositive = changePercent >= 0;

  // Calculate percentages for circular progress
  const total = goldValue + cashBalance;
  const goldPercentage = total > 0 ? Math.round((goldValue / total) * 100) : 0;
  const cashPercentage =
    total > 0 ? Math.round((cashBalance / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card p-6">
            <Skeleton className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Portfolio Card - GOLD ACCENT */}
      <Card className="glass-card p-6 hover:shadow-gold-glow transition-all duration-300">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Total Portfolio
            </p>
            <h3 className="text-3xl font-bold mb-2">
              $
              {totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            {/* GOLD BADGE - Change percentage */}
            <Badge
              className={`
                ${
                  isPositive
                    ? "bg-green-500/20 text-green-500 border-green-500/20"
                    : "bg-red-500/20 text-red-500 border-red-500/20"
                }
              `}
              variant="outline"
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%
            </Badge>
          </div>
          {/* GOLD ICON */}
          <div className="p-3 rounded-xl bg-linear-to-br from-[#FFD700]/20 to-[#FFC107]/10 ring-1 ring-primary/20">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Gold Balance Card - GOLD THEME */}
      <Card className="glass-card p-6 hover:shadow-gold-glow transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Gold Balance
            </p>
            <h3 className="text-2xl font-bold mb-1">
              {goldBalance.toFixed(2)}
              <span className="text-base text-muted-foreground ml-1">g</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              $
              {goldValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          {/* Gold circular progress */}
          <CircularProgress
            value={goldPercentage}
            size={80}
            strokeWidth={6}
            color="primary"
          />
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-primary font-medium">
            ✓ Available for delivery
          </p>
        </div>
      </Card>

      {/* Cash Balance Card - BLUE THEME */}
      <Card className="glass-card p-6 hover:border-blue-500/30 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Cash Balance
            </p>
            <h3 className="text-2xl font-bold mb-1">
              $
              {cashBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-base text-muted-foreground ml-1">USD</span>
            </h3>
            <p className="text-sm text-muted-foreground">Available</p>
          </div>
          {/* Blue circular progress */}
          <CircularProgress
            value={cashPercentage}
            size={80}
            strokeWidth={6}
            color="blue"
          />
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-blue-500 font-medium">✓ Ready to trade</p>
        </div>
      </Card>

      {/* Stats Card - COMBINED */}
      <Card className="glass-card p-6 space-y-4">
        {/* Transactions */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Total Transactions
              </p>
              <p className="text-xl font-bold">{transactionCount}</p>
            </div>
          </div>
        </div>

        {/* Achievements - GOLD ACCENT */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer group ring-1 ring-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Achievements</p>
              <p className="text-xl font-bold text-primary">
                {achievementsCount}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * GOLD STYLING DETAILS:
 *
 * Total Portfolio Card:
 * - Gold icon background: from-[#FFD700]/20 to-[#FFC107]/10
 * - Gold glow on hover: hover:shadow-gold-glow
 * - Gold accent color on icon
 *
 * Gold Balance Card:
 * - Gold circular progress with glow effect
 * - Primary color throughout
 * - Hover glow effect
 *
 * Cash Balance Card:
 * - Blue theme for differentiation
 * - Blue circular progress
 * - Blue accent text
 *
 * Circular Progress:
 * - Gold: #FFC107 with glow
 * - Blue: #3B82F6
 * - Smooth animations
 * - Glowing stroke effect
 *
 * Glass Effect:
 * - glass-card class provides backdrop blur
 * - Semi-transparent backgrounds
 * - Borders with transparency
 *
 *
 * DESIGN PRINCIPLES:
 *
 * - Gold is the primary accent (matches design sample)
 * - Glass morphism for modern feel
 * - Circular progress for visual interest
 * - Hover effects for interactivity
 * - Consistent spacing and sizing
 */
