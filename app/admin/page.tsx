// /app/admin/page.tsx
// Admin dashboard overview with key metrics and quick actions
// ✅ FIXED: Removed icon components from StatCard props to avoid client component errors

import { getSession } from "@/server/auth/session";
import {
  getDashboardStats,
  getRecentActivity,
} from "@/server/actions/admin/reports";
import { StatCard } from "@/components/admin/stat-card";
import { AdminSection, AdminCard } from "@/components/admin/admin-shell";
import {
  Users,
  Shield,
  ArrowLeftRight,
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  FileCheck,
  AlertCircle,
  Clock,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  // Fetch dashboard statistics
  const statsResult = await getDashboardStats(userId!);
  const activityResult = await getRecentActivity(userId!);

  const stats = statsResult.success ? statsResult.data : null;
  const activity = activityResult.success ? activityResult.data : [];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">Admin Dashboard</h1>
        <p className="text-zinc-400 mt-2">
          Welcome back, {session?.user?.name}. Here's your system overview.
        </p>
      </div>

      {/* Quick Actions */}
      <AdminCard
        title="Quick Actions"
        className="mb-6"
        action={
          <Link href="/admin/reports">
            <Button variant="outline" size="sm">
              View All Reports
            </Button>
          </Link>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/kyc">
            <Button variant="outline" className="w-full justify-start">
              <FileCheck className="w-4 h-4 mr-2" />
              Review KYC
            </Button>
          </Link>
          <Link href="/admin/transactions/flagged">
            <Button variant="outline" className="w-full justify-start">
              <AlertCircle className="w-4 h-4 mr-2" />
              Flagged Txns
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              System Config
            </Button>
          </Link>
        </div>
      </AdminCard>

      {/* Statistics Grid */}
      <AdminSection>
        <h2 className="text-xl font-semibold text-white mb-4">Key Metrics</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* ✅ FIXED: Removed icon prop */}
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            trend={{
              value: stats?.userGrowth || 0,
              isPositive: (stats?.userGrowth || 0) > 0,
            }}
            description="Active accounts"
          />

          {/* ✅ FIXED: Removed icon prop */}
          <StatCard
            title="KYC Pending"
            value={stats?.pendingKYC || 0}
            trend={{
              value: stats?.kycProcessingTime || 0,
              label: "avg hours",
            }}
            description="Awaiting review"
            variant="warning"
          />

          {/* ✅ FIXED: Removed icon prop */}
          <StatCard
            title="Daily Volume"
            value={`$${(stats?.dailyVolume || 0).toLocaleString()}`}
            trend={{
              value: stats?.volumeChange || 0,
              isPositive: (stats?.volumeChange || 0) > 0,
            }}
            description="24h transactions"
          />

          {/* ✅ FIXED: Removed icon prop */}
          <StatCard
            title="Gold Holdings"
            value={`${(stats?.totalGoldOz || 0).toFixed(2)} oz`}
            trend={{
              value: stats?.goldChange || 0,
              isPositive: (stats?.goldChange || 0) > 0,
            }}
            description="Total in custody"
            variant="accent"
          />
        </div>
      </AdminSection>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Transaction Volume Chart */}
        <AdminCard title="Transaction Volume (7 Days)">
          <div className="h-64 flex items-center justify-center text-zinc-500">
            {/* Chart component would go here */}
            <Activity className="w-8 h-8 mr-2" />
            Chart Component Placeholder
          </div>
        </AdminCard>

        {/* User Growth Chart */}
        <AdminCard title="User Growth (30 Days)">
          <div className="h-64 flex items-center justify-center text-zinc-500">
            {/* Chart component would go here */}
            <TrendingUp className="w-8 h-8 mr-2" />
            Chart Component Placeholder
          </div>
        </AdminCard>
      </div>

      {/* Recent Activity */}
      <AdminCard title="Recent Admin Activity" className="mt-6">
        <div className="space-y-4">
          {activity && activity.length > 0 ? (
            activity.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${
                      item.status === "success"
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    }
                  `}
                  >
                    {item.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.description}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      by {item.userEmail} • {item.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">
                    {format(new Date(item.timestamp), "MMM dd, HH:mm")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 py-8">No recent activity</p>
          )}

          {activity && activity.length > 10 && (
            <Link href="/admin/audit">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </Link>
          )}
        </div>
      </AdminCard>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">API Status</p>
              <p className="text-lg font-semibold text-green-400">
                Operational
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Response Time</p>
              <p className="text-lg font-semibold text-white">142ms</p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Error Rate</p>
              <p className="text-lg font-semibold text-white">0.02%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>
      </div>
    </>
  );
}
