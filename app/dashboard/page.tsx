// app/dashboard/page.tsx
// Purpose: Main dashboard page showing portfolio, gold balance, transactions, and quick actions

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
 * Dashboard Page
 *
 * Main dashboard displaying:
 * - Total portfolio value
 * - Gold and cash balances with circular progress
 * - Gold price chart (1D/1W/1M/1Y)
 * - Quick actions (Buy/Sell/Deposit/Withdraw/Delivery/Achievements)
 * - Recent activity/transactions
 *
 * Matches the gold/dark theme design from screenshots
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
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background flex flex-col">
      {/* Header with branding, gold price, and user menu */}
      <DashboardHeader user={user} goldPrice={goldPrice} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full w-full mx-auto">
          {/* 2-column responsive grid: 8/12 left, 4/12 right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* LEFT COLUMN - Portfolio, Chart, Activity */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              {/* Portfolio Overview - Total, Gold, Cash with circular progress */}
              <PortfolioOverview
                totalValue={totalValueUSD}
                goldBalance={gold?.grams || 0}
                goldValue={gold?.currentValue || 0}
                cashBalance={balance?.USD || 0}
                changePercent={1.28} // TODO: Calculate from historical data
                transactionCount={transactions?.length || 0}
                achievementsCount={5} // TODO: Get from achievements system
                isLoading={isLoadingBalance}
              />

              {/* Gold Price Chart */}
              <GoldPriceChart
                currentPrice={goldPrice}
                isLoading={isLoadingBalance}
              />

              {/* Recent Activity - shown on mobile, hidden on desktop (duplicate in sidebar) */}
              <div className="lg:hidden">
                <RecentActivity
                  transactions={transactions || []}
                  isLoading={isLoadingTransactions}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - Quick Actions & Recent Activity */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              {/* Quick Actions Sidebar */}
              <QuickActions />

              {/* Recent Activity - hidden on mobile (shown in main column) */}
              <div className="hidden lg:block">
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
