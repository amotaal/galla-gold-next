// /app/admin/transactions/page.tsx
// Transaction monitoring page with advanced filtering and management

import { getSession } from '@/server/auth/session';
import { hasPermission, PERMISSIONS } from '@/server/lib/permissions';
import { searchTransactions, getTransactionStats } from '@/server/actions/admin/transactions';
import { TransactionTable } from '@/components/admin/transaction-table';
import { AdminCard, AdminSection } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: {
    type?: string;
    status?: string;
    flagged?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    page?: string;
  }
}) {
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || 'user';

  // Check permissions
  if (!hasPermission(userRole, PERMISSIONS.TRANSACTION_VIEW)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">You don't have permission to view transactions</p>
      </div>
    );
  }

  // Parse filters
  const filters = {
    type: searchParams.type,
    status: searchParams.status,
    flagged: searchParams.flagged === 'true',
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    minAmount: searchParams.minAmount ? parseFloat(searchParams.minAmount) : undefined,
    maxAmount: searchParams.maxAmount ? parseFloat(searchParams.maxAmount) : undefined,
    page: parseInt(searchParams.page || '1'),
    limit: 50
  };

  // Fetch transactions and stats
  const [transactionsResult, statsResult] = await Promise.all([
    searchTransactions(userId!, filters),
    getTransactionStats(userId!)
  ]);

  const transactions = transactionsResult.success ? transactionsResult.data?.transactions || [] : [];
  const totalPages = transactionsResult.data?.totalPages || 1;
  const stats = statsResult.success ? statsResult.data : {};

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">Transaction Monitoring</h1>
        <p className="text-zinc-400 mt-2">
          Monitor and manage all platform transactions
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">24h Volume</p>
              <p className="text-2xl font-bold text-white">
                ${stats.dailyVolume?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-green-400 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +{stats.volumeChange || 0}%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-400" />
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Gold Traded</p>
              <p className="text-2xl font-bold text-white">
                {stats.goldVolume?.toFixed(2) || 0} oz
              </p>
              <p className="text-xs text-zinc-400 mt-1">Today</p>
            </div>
            <Coins className="w-8 h-8 text-yellow-400" />
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalTransactions || 0}
              </p>
              <p className="text-xs text-zinc-400 mt-1">All time</p>
            </div>
            <ArrowLeftRight className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Flagged</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.flaggedCount || 0}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Requires review</p>
            </div>
            <Flag className="w-8 h-8 text-red-400" />
          </div>
        </AdminCard>
      </div>

      {/* Advanced Filters */}
      <AdminCard className="mb-6">
        <form className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Transaction Type */}
            <select 
              name="type"
              defaultValue={filters.type}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
              <option value="buy_gold">Buy Gold</option>
              <option value="sell_gold">Sell Gold</option>
              <option value="transfer">Transfer</option>
            </select>
            
            {/* Status */}
            <select 
              name="status"
              defaultValue={filters.status}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            {/* Date From */}
            <Input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom}
              className="bg-zinc-900 border-zinc-800"
              placeholder="From date"
            />
            
            {/* Date To */}
            <Input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo}
              className="bg-zinc-900 border-zinc-800"
              placeholder="To date"
            />
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {/* Min Amount */}
            <Input
              type="number"
              name="minAmount"
              defaultValue={filters.minAmount}
              className="bg-zinc-900 border-zinc-800"
              placeholder="Min amount"
            />
            
            {/* Max Amount */}
            <Input
              type="number"
              name="maxAmount"
              defaultValue={filters.maxAmount}
              className="bg-zinc-900 border-zinc-800"
              placeholder="Max amount"
            />
            
            {/* Flagged Only */}
            <label className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                name="flagged"
                defaultChecked={filters.flagged}
                value="true"
                className="rounded border-zinc-700"
              />
              <span className="text-white">Flagged Only</span>
            </label>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" variant="outline" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
              <Button type="button" variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </AdminCard>

      {/* Transactions Table */}
      <AdminCard>
        {transactions.length > 0 ? (
          <>
            <TransactionTable 
              transactions={transactions}
              userRole={userRole}
              canFlag={hasPermission(userRole, PERMISSIONS.TRANSACTION_FLAG)}
              canRefund={hasPermission(userRole, PERMISSIONS.TRANSACTION_REFUND)}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-800">
                <div className="text-sm text-zinc-400">
                  Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                  {Math.min(filters.page * filters.limit, transactionsResult.data?.total || 0)} of{' '}
                  {transactionsResult.data?.total || 0} transactions
                </div>
                
                <div className="flex gap-2">
                  {filters.page > 1 && (
                    <a href={`?page=${filters.page - 1}${searchParams.type ? `&type=${searchParams.type}` : ''}`}>
                      <Button variant="outline" size="sm">Previous</Button>
                    </a>
                  )}
                  
                  <span className="flex items-center px-4 text-sm">
                    Page {filters.page} of {totalPages}
                  </span>
                  
                  {filters.page < totalPages && (
                    <a href={`?page=${filters.page + 1}${searchParams.type ? `&type=${searchParams.type}` : ''}`}>
                      <Button variant="outline" size="sm">Next</Button>
                    </a>
                  )}
                </div>
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

      {/* Quick Actions */}
      {hasPermission(userRole, PERMISSIONS.TRANSACTION_FLAG) && stats.flaggedCount > 0 && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-semibold text-red-400">
                  {stats.flaggedCount} Flagged Transactions Require Review
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  High-value or suspicious transactions need immediate attention
                </p>
              </div>
            </div>
            <a href="?flagged=true">
              <Button variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/20">
                Review Flagged
              </Button>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
