// /app/admin/transactions/page.tsx
// Transaction monitoring page with advanced filtering and management
// ✅ FIXED: Updated for Next.js 16 async searchParams
// ✅ FIXED: Proper stats property handling with safe optional chaining
// ✅ FIXED: Serialization for MongoDB documents

import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  searchTransactions,
  getTransactionStats,
} from "@/server/actions/admin/transactions";
import { TransactionTable } from "@/components/admin/transaction-table";
import { AdminCard, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Coins,
  DollarSign,
  Flag,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { serializeDocs } from "@/lib/serialization";

/**
 * Transactions Page Component
 * Handles Next.js 16 async searchParams by awaiting the Promise
 */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    flagged?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    page?: string;
  }>;
}) {
  // Get session and check permissions
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || "user";

  // Check permissions
  if (!hasPermission(userRole, PERMISSIONS.TRANSACTION_VIEW)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">
          You don't have permission to view transactions
        </p>
      </div>
    );
  }

  // ✅ CRITICAL FIX: Await searchParams before accessing its properties (Next.js 16 requirement)
  const params = await searchParams;

  // Parse filters from awaited params
  const filters = {
    type: params.type,
    status: params.status,
    flagged: params.flagged === "true",
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    minAmount: params.minAmount ? parseFloat(params.minAmount) : undefined,
    maxAmount: params.maxAmount ? parseFloat(params.maxAmount) : undefined,
    page: parseInt(params.page || "1"),
    limit: 50,
  };

  // Fetch transactions and stats
  const [transactionsResult, statsResult] = await Promise.all([
    searchTransactions(userId!, filters),
    getTransactionStats(userId!),
  ]);

  // ✅ CRITICAL FIX: Serialize transactions before passing to client components
  const transactions = transactionsResult.success
    ? serializeDocs(transactionsResult.data?.transactions || [])
    : [];
  const totalPages = transactionsResult.data?.totalPages || 1;
  const stats = statsResult.success ? statsResult.data : null;

  // ✅ CRITICAL FIX: Calculate display values with proper null handling
  const displayStats = {
    // 24h volume (use todayVolume if volume24h not available)
    volume24h: stats?.todayVolume || 0,
    volumeChange: 0, // Calculate from historical data if available

    // Gold traded (convert from grams if goldTraded not available)
    goldTraded: stats?.totalGoldHoldings
      ? stats.totalGoldHoldings / 31.1035 // Convert grams to oz
      : 0,

    // Total transactions
    total: stats?.totalTransactions || 0,

    // Flagged transactions
    flagged: stats?.flaggedTransactions || 0,

    // Additional metrics
    pending: stats?.pendingTransactions || 0,
    failed: stats?.failedTransactions || 0,
    today: stats?.todayTransactions || 0,
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">
              Transaction Monitoring
            </h1>
            <p className="text-zinc-400 mt-2">
              Monitor and manage all platform transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">24h Volume</p>
              <p className="text-2xl font-bold text-white">
                ${displayStats.volume24h.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 mt-1 flex items-center">
                {displayStats.volumeChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-400" />
                )}
                <span
                  className={
                    displayStats.volumeChange >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {displayStats.volumeChange > 0 ? "+" : ""}
                  {displayStats.volumeChange.toFixed(1)}% vs prev period
                </span>
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Gold Traded</p>
              <p className="text-2xl font-bold text-amber-400">
                {displayStats.goldTraded.toFixed(2)} oz
              </p>
              <p className="text-xs text-zinc-500 mt-1">Today</p>
            </div>
            <Coins className="w-8 h-8 text-amber-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white">
                {displayStats.total}
              </p>
              <p className="text-xs text-zinc-500 mt-1">All time</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-blue-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Flagged</p>
              <p className="text-2xl font-bold text-red-400">
                {displayStats.flagged}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Requires review</p>
            </div>
            <Flag className="w-8 h-8 text-red-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.type || "all"}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="buy">Buy Gold</option>
              <option value="sell">Sell Gold</option>
              <option value="transfer">Transfer</option>
            </select>
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.status || "all"}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.flagged ? "true" : "false"}
            >
              <option value="false">All Transactions</option>
              <option value="true">Flagged Only</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Transaction Table */}
      {transactions.length > 0 ? (
        <AdminCard>
          <TransactionTable transactions={transactions} />
        </AdminCard>
      ) : (
        <AdminCard>
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-zinc-400">
              No transactions found
            </p>
            <p className="text-zinc-500 mt-2">
              Try adjusting your filters or date range
            </p>
          </div>
        </AdminCard>
      )}

      {/* Monitoring Guidelines */}
      <AdminCard className="mt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
          <div>
            <h3 className="font-semibold text-white mb-1">
              Monitoring Guidelines
            </h3>
            <p className="text-sm text-zinc-400">
              Monitor transactions for unusual patterns, large amounts, or
              suspicious activity. Flagged transactions should be reviewed
              immediately. Pay attention to rapid buying and selling patterns,
              unusually large transactions from new accounts, and any
              transactions that fail verification checks. Ensure all high-value
              transactions comply with regulatory requirements.
            </p>
          </div>
        </div>
      </AdminCard>
    </>
  );
}
