// /app/admin/reports/page.tsx
// Reports and analytics page with comprehensive business intelligence
// FIXED: Properly awaiting searchParams Promise

import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  getFinancialReport,
  getUserGrowthReport,
  getTransactionReport,
  getKYCReport,
} from "@/server/actions/admin/reports";
import { AdminCard, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Activity,
  PieChart,
  LineChart,
  AlertCircle,
  Percent,
  Clock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
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

  // CRITICAL: Await searchParams BEFORE using it
  const params = await searchParams;

  // Parse date range from awaited params
  const period = params.period || "30d";
  const dateFrom =
    params.from ||
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const dateTo = params.to || format(new Date(), "yyyy-MM-dd");

  // Fetch all reports
  const [financialReport, userReport, transactionReport, kycReport] =
    await Promise.all([
      getFinancialReport(userId!, { startDate: dateFrom, endDate: dateTo }),
      getUserGrowthReport(userId!, { startDate: dateFrom, endDate: dateTo }),
      getTransactionReport(userId!, { startDate: dateFrom, endDate: dateTo }),
      getKYCReport(userId!, { startDate: dateFrom, endDate: dateTo }),
    ]);

  const financial = financialReport.success ? financialReport.data : {};
  const userGrowth = userReport.success ? userReport.data : {};
  const transactions = transactionReport.success ? transactionReport.data : {};
  const kyc = kycReport.success ? kycReport.data : {};

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
              Comprehensive business intelligence and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form method="GET" className="flex gap-2">
              <select
                name="period"
                defaultValue={period}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <Button type="submit" size="sm" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Reports
              </Button>
            </form>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export All Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <AdminSection title="Financial Overview" icon={DollarSign}>
        <div className="grid md:grid-cols-4 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${(financial as any)?.totalRevenue?.toLocaleString() || "0"}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {(financial as any)?.revenueChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span
                    className={`text-xs ${
                      (financial as any)?.revenueChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {(financial as any)?.revenueChange > 0 ? "+" : ""}
                    {(financial as any)?.revenueChange?.toFixed(1) || "0"}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Transaction Fees</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {(financial as any)?.transactionFees?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(financial as any)?.feePercentage || "0"}% of volume
                </p>
              </div>
              <Percent className="w-8 h-8 text-amber-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Gold in Custody</p>
                <p className="text-2xl font-bold text-amber-400">
                  {(financial as any)?.goldInCustody?.toFixed(2) || "0.00"} oz
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  ${(financial as any)?.goldValue?.toLocaleString() || "0"}{" "}
                  value
                </p>
              </div>
              <Coins className="w-8 h-8 text-amber-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Cash Balance</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${(financial as any)?.cashBalance?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Across all users</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>
        </div>

        {/* Revenue Chart Placeholder */}
        <AdminCard className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Revenue Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <LineChart className="w-12 h-12 mr-3" />
            Revenue Chart Component Placeholder
          </div>
        </AdminCard>
      </AdminSection>

      {/* User Growth */}
      <AdminSection title="User Growth" icon={Users} className="mt-8">
        <div className="grid md:grid-cols-4 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {(userGrowth as any)?.totalUsers || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">All time</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">New Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {(userGrowth as any)?.newUsers || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">This period</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
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

      {/* Transaction Analytics */}
      <AdminSection
        title="Transaction Analytics"
        icon={ArrowUpRight}
        className="mt-8"
      >
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

      {/* KYC Analytics */}
      <AdminSection title="KYC Analytics" icon={FileText} className="mt-8">
        <div className="grid md:grid-cols-4 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(kyc as any)?.pending || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Approved</p>
                <p className="text-2xl font-bold text-green-400">
                  {(kyc as any)?.approved || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Rejected</p>
                <p className="text-2xl font-bold text-red-400">
                  {(kyc as any)?.rejected || 0}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Avg Processing</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(kyc as any)?.avgProcessingTime || "0h"}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </AdminCard>
        </div>
      </AdminSection>
    </>
  );
}
