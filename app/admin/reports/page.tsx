// /app/admin/reports/page.tsx
// Admin reports page showing various analytics and insights
// ✅ FIXED: Removed icon props from AdminSection (icons now rendered inline)
// ✅ FIXED: Updated for Next.js 16 async searchParams

import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  getDashboardOverview,
  generateUserGrowthReport,
  generateTransactionVolumeReport,
  generateKYCReport,
} from "@/server/actions/admin/reports";
import { AdminCard, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  AlertCircle,
  FileText,
  ArrowUpRight,
} from "lucide-react";

export default async function ReportsPage() {
  // Get session and check permissions
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || "user";

  // Check permissions
  if (!hasPermission(userRole, PERMISSIONS.REPORTS_VIEW)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">
          You don't have permission to view reports
        </p>
      </div>
    );
  }

  // Fetch overview data
  const overviewResult = await getDashboardOverview(userId!);
  const overview = overviewResult.success ? overviewResult.data : null;

  // Generate date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Fetch report data
  const [userGrowthResult, transactionsResult, kycResult] = await Promise.all([
    generateUserGrowthReport(userId!, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    generateTransactionVolumeReport(userId!, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    generateKYCReport(userId!, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  ]);

  const userGrowth = userGrowthResult.success ? userGrowthResult.data : null;
  const transactions = transactionsResult.success
    ? transactionsResult.data
    : null;
  const kyc = kycResult.success ? kycResult.data : null;

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">
              Reports & Analytics
            </h1>
            <p className="text-zinc-400 mt-2">
              Comprehensive platform insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Removed icon prop, render inline instead */}
      <AdminSection className="mb-8">
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-white">Financial Overview</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ${(overview as any)?.totalRevenue?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">All time</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Volume</p>
                <p className="text-2xl font-bold text-white">
                  ${(overview as any)?.totalVolume?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Processed</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Platform Fees</p>
                <p className="text-2xl font-bold text-amber-400">
                  ${(overview as any)?.platformFees?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Collected</p>
              </div>
              <PieChart className="w-8 h-8 text-amber-500" />
            </div>
          </AdminCard>
        </div>

        {/* Revenue Chart Placeholder */}
        <AdminCard className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Revenue Trend (30 Days)
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <TrendingUp className="w-12 h-12 mr-3" />
            Revenue Chart Component Placeholder
          </div>
        </AdminCard>
      </AdminSection>

      {/* ✅ FIXED: Removed icon prop, render inline instead */}
      <AdminSection className="mt-8">
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-white">User Growth</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {(userGrowth as any)?.totalUsers || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Registered</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Users</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(userGrowth as any)?.activeUsers || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(userGrowth as any)?.activePercentage || 0}% of total
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Verified Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {(userGrowth as any)?.verifiedUsers || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">KYC approved</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>
        </div>

        {/* User Growth Chart Placeholder */}
        <AdminCard className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            User Growth Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <BarChart3 className="w-12 h-12 mr-3" />
            User Growth Chart Component Placeholder
          </div>
        </AdminCard>
      </AdminSection>

      {/* ✅ FIXED: Removed icon prop, render inline instead */}
      <AdminSection className="mt-8">
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <ArrowUpRight className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-white">
            Transaction Analytics
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {(transactions as any)?.totalTransactions || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">This period</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Transaction Volume</p>
                <p className="text-2xl font-bold text-amber-400">
                  ${(transactions as any)?.volume?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Avg: $
                  {(transactions as any)?.avgTransaction?.toLocaleString() ||
                    "0"}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {(transactions as any)?.successRate || 0}%
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(transactions as any)?.successfulTransactions || 0}{" "}
                  successful
                </p>
              </div>
              <PieChart className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>
        </div>
      </AdminSection>

      {/* ✅ FIXED: Removed icon prop, render inline instead */}
      <AdminSection className="mt-8">
        {/* Section Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-white">KYC Analytics</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Applications</p>
                <p className="text-2xl font-bold text-white">
                  {(kyc as any)?.totalApplications || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-zinc-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Verified</p>
                <p className="text-2xl font-bold text-green-400">
                  {(kyc as any)?.verified || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(kyc as any)?.pending || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Avg. Processing</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(kyc as any)?.avgProcessingTime?.toFixed(1) || 0}h
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>
        </div>
      </AdminSection>

      {/* Export Options */}
      <AdminCard className="mt-8">
        <div className="flex items-start gap-4">
          <Download className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-2">Export Reports</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Download detailed reports in various formats for further analysis
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </AdminCard>
    </>
  );
}
