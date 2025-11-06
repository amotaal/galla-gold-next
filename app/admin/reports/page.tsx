// /app/admin/reports/page.tsx
// Reports and analytics page with comprehensive business intelligence

import { getSession } from '@/server/auth/session';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { 
  getFinancialReport,
  getUserGrowthReport,
  getTransactionReport,
  getKYCReport 
} from '@/server/actions/admin/reports';
import { AdminCard, AdminSection } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
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
  Percent
} from 'lucide-react';
import { format } from 'date-fns';

export default async function ReportsPage({
  searchParams
}: {
  searchParams: {
    period?: string;
    from?: string;
    to?: string;
  }
}) {
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || 'user';

  // Check permissions
  if (!hasPermission(userRole, PERMISSIONS.REPORTS_VIEW)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">You don't have permission to view reports</p>
      </div>
    );
  }

  // Parse date range
  const period = searchParams.period || '30d';
  const dateFrom = searchParams.from || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const dateTo = searchParams.to || format(new Date(), 'yyyy-MM-dd');

  // Fetch all reports
  const [financialReport, userReport, transactionReport, kycReport] = await Promise.all([
    getFinancialReport(userId!, { dateFrom, dateTo }),
    getUserGrowthReport(userId!, { period }),
    getTransactionReport(userId!, { dateFrom, dateTo }),
    getKYCReport(userId!, { period })
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
            <h1 className="text-3xl font-bold text-amber-500">Reports & Analytics</h1>
            <p className="text-zinc-400 mt-2">
              Comprehensive business intelligence and analytics
            </p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Download className="w-4 h-4 mr-2" />
            Export All Reports
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <AdminCard className="mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <select 
            name="period"
            defaultValue={period}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {period === 'custom' && (
            <>
              <input
                type="date"
                name="from"
                defaultValue={dateFrom}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
              />
              <input
                type="date"
                name="to"
                defaultValue={dateTo}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
              />
            </>
          )}
          
          <Button type="submit" variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Reports
          </Button>
        </form>
      </AdminCard>

      {/* Financial Overview */}
      <AdminSection>
        <h2 className="text-xl font-semibold text-white mb-4">Financial Overview</h2>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${financial.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className={`text-xs mt-1 ${financial.revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {financial.revenueChange > 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {Math.abs(financial.revenueChange || 0)}% vs prev period
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Transaction Fees</p>
                <p className="text-2xl font-bold text-white">
                  ${financial.totalFees?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {financial.feePercentage || 0}% of volume
                </p>
              </div>
              <Percent className="w-8 h-8 text-green-400" />
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Gold in Custody</p>
                <p className="text-2xl font-bold text-white">
                  {financial.totalGoldOz?.toFixed(2) || 0} oz
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  ${(financial.totalGoldValue || 0).toLocaleString()} value
                </p>
              </div>
              <Coins className="w-8 h-8 text-yellow-400" />
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Cash Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${financial.totalCashBalance?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Across all users
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </AdminCard>
        </div>

        {/* Revenue Chart */}
        <AdminCard title="Revenue Trend">
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <LineChart className="w-8 h-8 mr-2" />
            Revenue Chart Component Placeholder
          </div>
        </AdminCard>
      </AdminSection>

      {/* User Growth Report */}
      <AdminSection className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">User Growth</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {userGrowth.totalUsers || 0}
                </p>
                <p className="text-xs text-green-400 mt-1">
                  +{userGrowth.newUsersThisPeriod || 0} new this period
                </p>
              </div>
              <Users className="w-8 h-8 text-amber-400" />
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {userGrowth.activeUsers || 0}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {((userGrowth.activeUsers / userGrowth.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Retention Rate</p>
                <p className="text-2xl font-bold text-white">
                  {userGrowth.retentionRate || 0}%
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Month over month
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </AdminCard>
        </div>

        {/* User Growth Chart */}
        <AdminCard title="User Growth Trend">
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <BarChart3 className="w-8 h-8 mr-2" />
            User Growth Chart Component Placeholder
          </div>
        </AdminCard>
      </AdminSection>

      {/* Transaction Analytics */}
      <AdminSection className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Transaction Analytics</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Transaction Volume */}
          <AdminCard title="Transaction Volume">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Transactions</span>
                <span className="text-lg font-semibold text-white">
                  {transactions.totalCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Volume</span>
                <span className="text-lg font-semibold text-white">
                  ${transactions.totalVolume?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Average Transaction</span>
                <span className="text-lg font-semibold text-white">
                  ${transactions.avgTransaction?.toFixed(2) || 0}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* Transaction Types */}
          <AdminCard title="Transaction Types">
            <div className="space-y-4">
              {transactions.byType && Object.entries(transactions.byType).map(([type, data]: [string, any]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span className="text-sm text-zinc-300 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{data.count}</span>
                    <span className="text-xs text-zinc-500 ml-2">
                      (${data.volume?.toLocaleString()})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </AdminSection>

      {/* KYC Report */}
      <AdminSection className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">KYC Compliance</h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <AdminCard>
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-2">Verified Users</p>
              <p className="text-3xl font-bold text-green-400">{kyc.verifiedCount || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {kyc.verifiedPercentage || 0}% of total
              </p>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-2">Pending KYC</p>
              <p className="text-3xl font-bold text-yellow-400">{kyc.pendingCount || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Awaiting review
              </p>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-2">Rejected</p>
              <p className="text-3xl font-bold text-red-400">{kyc.rejectedCount || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">
                This period
              </p>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-2">Avg Processing</p>
              <p className="text-3xl font-bold text-white">{kyc.avgProcessingHours || 0}h</p>
              <p className="text-xs text-zinc-500 mt-1">
                Time to review
              </p>
            </div>
          </AdminCard>
        </div>
      </AdminSection>
    </>
  );
}
