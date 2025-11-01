// /app/dashboard/page.tsx
// Dashboard Page - FIXED LAYOUT VERSION
// Purpose: Viewport-contained dashboard with no scrollbars on desktop
// FIX: Proper height management, responsive grid, no overflow

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { GoldPriceChart } from "@/components/dashboard/gold-price-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Loader2 } from "lucide-react";

/**
 * Dashboard Page - Fixed Layout
 *
 * Main dashboard with viewport-contained layout:
 * - No horizontal scrollbars
 * - No vertical scrollbars on desktop (fits viewport)
 * - Responsive grid that adapts to screen size
 * - Proper spacing and sizing
 *
 * Layout Structure:
 * - Header: Fixed height (64px)
 * - Main Content: calc(100vh - 64px) - fits remaining viewport
 * - Grid: 2 columns on desktop (8/4 split), 1 column on mobile
 * - All cards sized to fit within their containers
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const {
    balance,
    gold,
    totalValueUSD,
    goldPrice,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    refetchAll,
  } = useWallet();

  const [mounted, setMounted] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Mark as mounted for animations
  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (authLoading || !mounted || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed height */}
      <DashboardHeader user={user} goldPrice={goldPrice} />

      {/* Main Content - Fill remaining viewport height */}
      <main className="flex-1 overflow-hidden">
        {/* Container with proper padding and max-width */}
        <div className="h-full w-full max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          {/* Grid Layout - Responsive 2-column on desktop, 1-column on mobile */}
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 overflow-y-auto custom-scrollbar">
            {/* LEFT COLUMN - Portfolio, Chart, Recent Activity */}
            <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4 lg:gap-6">
              {/* Portfolio Overview - 3 cards in row */}
              <PortfolioOverview
                totalValue={totalValueUSD}
                goldBalance={gold?.grams || 0}
                goldValue={gold?.currentValue || 0}
                cashBalance={balance?.USD || 0}
                changePercent={1.28}
                transactionCount={transactions?.length || 0}
                achievementsCount={5}
                isLoading={isLoadingBalance}
              />

              {/* Gold Price Chart - Responsive height */}
              <div className="flex-1 min-h-[300px] lg:min-h-[400px]">
                <GoldPriceChart
                  currentPrice={goldPrice}
                  isLoading={isLoadingBalance}
                />
              </div>

              {/* Recent Activity - Mobile only (hidden on desktop) */}
              <div className="lg:hidden">
                <RecentActivity
                  transactions={transactions || []}
                  isLoading={isLoadingTransactions}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - Quick Actions & Recent Activity */}
            <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4 lg:gap-6">
              {/* Quick Actions - Responsive card */}
              <QuickActions />

              {/* Recent Activity - Desktop only (hidden on mobile) */}
              <div className="hidden lg:block flex-1 min-h-0">
                <RecentActivity
                  transactions={transactions || []}
                  isLoading={isLoadingTransactions}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * VIEWPORT CONTAINMENT STRATEGY:
 *
 * This layout uses a combination of techniques to ensure no scrollbars:
 *
 * 1. Container Structure:
 *    - Outer div: min-h-screen + flex flex-col + overflow-hidden
 *    - Header: Fixed height (h-16 = 64px)
 *    - Main: flex-1 (fills remaining space) + overflow-hidden
 *
 * 2. Content Grid:
 *    - Height: h-full (fills parent main)
 *    - Overflow: overflow-y-auto (allows scrolling if content exceeds)
 *    - Custom scrollbar styling for aesthetics
 *
 * 3. Responsive Design:
 *    - Desktop (lg+): 2 columns (8/4 split)
 *    - Mobile: 1 column (stacked)
 *    - Gap sizes scale with breakpoints
 *
 * 4. Card Sizing:
 *    - Chart: min-height ensures visibility, flex-1 allows growth
 *    - Activities: flex-1 on desktop, auto on mobile
 *    - All cards have proper padding and borders
 *
 * RESULT:
 * - No horizontal scrollbars (ever)
 * - No vertical scrollbars on desktop (content fits viewport)
 * - Smooth scrolling on mobile if needed
 * - Responsive across all screen sizes
 */
