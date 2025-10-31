// components/dashboard/recent-activity.tsx
// Purpose: Display recent transactions with icons, amounts, and status

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Minus,
  ArrowDownToLine,
  Send,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: Date | string;
}

interface RecentActivityProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentActivity({ transactions, isLoading }: RecentActivityProps) {
  const router = useRouter();
  const glassCardClasses = 'bg-card/60 backdrop-blur-md border border-border';

  // Get transaction icon and color
  const getTransactionDisplay = (type: string) => {
    switch (type) {
      case 'buy_gold':
      case 'gold_purchase':
        return {
          icon: Plus,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          sign: '-',
        };
      case 'sell_gold':
      case 'gold_sale':
        return {
          icon: Minus,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          sign: '+',
        };
      case 'deposit':
        return {
          icon: ArrowDownToLine,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          sign: '+',
        };
      case 'withdrawal':
        return {
          icon: Send,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          sign: '-',
        };
      default:
        return {
          icon: Coins,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          sign: '',
        };
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Get status badge variant
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/20';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${glassCardClasses} p-6 flex-1`}>
        <h3 className="text-base font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted/20" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted/20 rounded w-3/4" />
                <div className="h-2 bg-muted/20 rounded w-1/2" />
              </div>
              <div className="h-4 w-16 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card className={`${glassCardClasses} p-6 flex-1 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold">Recent Activity</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/transactions')}
          className="text-xs text-muted-foreground hover:text-foreground -mr-2"
        >
          View All
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-2 flex-1 overflow-auto">
        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Coins className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start by buying some gold
            </p>
          </div>
        ) : (
          recentTransactions.map((tx) => {
            const display = getTransactionDisplay(tx.type);
            const Icon = display.icon;

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
                onClick={() => router.push(`/transactions/${tx.id}`)}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${display.bgColor} ring-1 ring-border flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${display.color}`} />
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description || `${tx.type.replace('_', ' ')}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-4 px-1.5 ${getStatusColor(tx.status)}`}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">
                    {display.sign}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all ml-auto" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
