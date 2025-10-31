// components/dashboard/portfolio-overview.tsx
// Purpose: Display total portfolio, gold/cash balances with circular progress, and key stats

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, History, Trophy } from 'lucide-react';
import { CircularProgress } from '@/components/dashboard/circular-progress';

interface PortfolioOverviewProps {
  totalValue: number;
  goldBalance: number;
  goldValue: number;
  cashBalance: number;
  changePercent: number;
  transactionCount: number;
  achievementsCount: number;
  isLoading: boolean;
}

export function PortfolioOverview({
  totalValue,
  goldBalance,
  goldValue,
  cashBalance,
  changePercent,
  transactionCount,
  achievementsCount,
  isLoading,
}: PortfolioOverviewProps) {
  const isPositive = changePercent >= 0;
  
  // Calculate percentages for circular progress (100% filled in design)
  const goldPercentage = 100;
  const cashPercentage = 100;

  const glassCardClasses = 'bg-card/60 backdrop-blur-md border border-border';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className={`${glassCardClasses} p-6 animate-pulse`}>
            <div className="h-20 bg-muted/20 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {/* Total Portfolio Card */}
      <Card className={`${glassCardClasses} p-6`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">
              Total Portfolio
            </p>
            <h2 className="text-3xl font-bold mb-2">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <Badge
              className={`text-xs ${
                isPositive
                  ? 'bg-green-500/20 text-green-500 border-green-500/20'
                  : 'bg-red-500/20 text-red-500 border-red-500/20'
              }`}
              variant="outline"
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </Badge>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Gold Balance Card */}
      <Card className={`${glassCardClasses} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Gold Balance
            </p>
            <h3 className="text-2xl font-bold mb-1">
              {goldBalance.toFixed(2)}<span className="text-base text-muted-foreground ml-1">g</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              ${goldValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {/* Circular Progress */}
          <CircularProgress
            value={goldPercentage}
            size={80}
            strokeWidth={6}
            className="text-primary"
          />
        </div>
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </Card>

      {/* Cash Balance Card */}
      <Card className={`${glassCardClasses} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Cash Balance
            </p>
            <h3 className="text-2xl font-bold mb-1">
              {cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-base text-muted-foreground ml-1">USD</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Available
            </p>
          </div>
          {/* Circular Progress */}
          <CircularProgress
            value={cashPercentage}
            size={80}
            strokeWidth={6}
            className="text-blue-500"
          />
        </div>
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </Card>

      {/* Total Transactions Card */}
      <Card className={`${glassCardClasses} p-4 hover:bg-card/70 transition-all cursor-pointer group`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-secondary/80 ring-1 ring-border group-hover:bg-primary/10 group-hover:ring-primary/20 transition-all">
            <History className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
            <p className="text-2xl font-bold">{transactionCount}</p>
          </div>
        </div>
      </Card>

      {/* Achievements Card */}
      <Card className={`${glassCardClasses} p-4 hover:bg-card/70 transition-all cursor-pointer group`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-secondary/80 ring-1 ring-border group-hover:bg-primary/10 group-hover:ring-primary/20 transition-all">
            <Trophy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Achievements Unlocked</p>
            <p className="text-2xl font-bold">{achievementsCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
