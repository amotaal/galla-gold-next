// /app/admin/transactions/page.tsx
// Transaction monitoring page with advanced filtering and management
// FIXED: Updated for Next.js 16 async searchParams

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

  // IMPORTANT: Await searchParams before accessing its properties (Next.js 16 requirement)
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

  const transactions = transactionsResult.success
    ? transactionsResult.data?.transactions || []
    : [];
  const totalPages = transactionsResult.data?.totalPages || 1;
  const stats = statsResult.success
    ? statsResult.data
    : {
        total: 0,
        volume24h: 0,
        goldTraded: 0,
        cashBalance: 0,
        flagged: 0,
        volumeChange: 0,
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
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">24h Volume</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats.volume24h?.toLocaleString() || "0"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {stats.volumeChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span
                  className={`text-xs ${
                    stats.volumeChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stats.volumeChange > 0 ? "+" : ""}
                  {stats.volumeChange?.toFixed(1)}% vs prev period
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Gold Traded</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {stats.goldTraded?.toFixed(2) || "0.00"} oz
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
              <p className="text-2xl font-bold text-white mt-1">
                {stats.total || 0}
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
              <p className="text-2xl font-bold text-red-400 mt-1">
                {stats.flagged || 0}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Requires review</p>
            </div>
            <Flag className="w-8 h-8 text-red-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters Section */}
      <AdminCard className="mb-6">
        <form method="GET" action="/admin/transactions">
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            {/* Type Filter */}
            <select
              name="type"
              defaultValue={params.type || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Types</option>
              <option value="buy">Buy Gold</option>
              <option value="sell">Sell Gold</option>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
              <option value="delivery">Physical Delivery</option>
            </select>

            {/* Status Filter */}
            <select
              name="status"
              defaultValue={params.status || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Flagged Filter */}
            <select
              name="flagged"
              defaultValue={params.flagged || "false"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="false">All Transactions</option>
              <option value="true">Flagged Only</option>
            </select>

            {/* Min Amount */}
            <Input
              type="number"
              name="minAmount"
              placeholder="Min amount"
              defaultValue={params.minAmount}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Max Amount */}
            <Input
              type="number"
              name="maxAmount"
              placeholder="Max amount"
              defaultValue={params.maxAmount}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Date From */}
            <Input
              type="date"
              name="dateFrom"
              defaultValue={params.dateFrom}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Date To */}
            <Input
              type="date"
              name="dateTo"
              defaultValue={params.dateTo}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Apply Filters Button */}
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>

            {/* Clear Filters Link */}
            <a href="/admin/transactions">
              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-zinc-800"
              >
                Clear Filters
              </Button>
            </a>
          </div>
        </form>
      </AdminCard>

      {/* Transactions Table */}
      <AdminCard>
        {transactions.length > 0 ? (
          <>
            <TransactionTable transactions={transactions} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-zinc-800">
                {filters.page > 1 && (
                  <a
                    href={`?page=${filters.page - 1}${
                      params.type ? `&type=${params.type}` : ""
                    }${params.status ? `&status=${params.status}` : ""}${
                      params.flagged ? `&flagged=${params.flagged}` : ""
                    }${params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""}${
                      params.dateTo ? `&dateTo=${params.dateTo}` : ""
                    }${
                      params.minAmount ? `&minAmount=${params.minAmount}` : ""
                    }${
                      params.maxAmount ? `&maxAmount=${params.maxAmount}` : ""
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </a>
                )}

                <span className="flex items-center px-4 text-sm text-zinc-400">
                  Page {filters.page} of {totalPages}
                </span>

                {filters.page < totalPages && (
                  <a
                    href={`?page=${filters.page + 1}${
                      params.type ? `&type=${params.type}` : ""
                    }${params.status ? `&status=${params.status}` : ""}${
                      params.flagged ? `&flagged=${params.flagged}` : ""
                    }${params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""}${
                      params.dateTo ? `&dateTo=${params.dateTo}` : ""
                    }${
                      params.minAmount ? `&minAmount=${params.minAmount}` : ""
                    }${
                      params.maxAmount ? `&maxAmount=${params.maxAmount}` : ""
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <ArrowLeftRight className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No transactions found</p>
            <p className="text-sm text-zinc-500 mt-2">
              Try adjusting your filters or date range
            </p>
          </div>
        )}
      </AdminCard>

      {/* Transaction Monitoring Guidelines */}
      <AdminCard className="mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">
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
