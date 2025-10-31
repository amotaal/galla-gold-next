// app/dashboard/transactions/page.tsx
// Purpose: View complete transaction history with filters and search

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  History,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  ArrowDownToLine,
  Send,
  Package,
  Loader2,
  Calendar,
  TrendingUp,
} from "lucide-react";

/**
 * Transactions Page
 * 
 * View complete transaction history
 * Features:
 * - Filterable transaction list (type, date, status)
 * - Search functionality
 * - Transaction details
 * - Export to CSV (placeholder)
 * - Pagination
 */
export default function TransactionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { transactions, isLoadingTransactions } = useWallet();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Filter and search transactions
  const filteredTransactions = transactions
    ?.filter((tx) => {
      // Type filter
      if (filterType !== "all" && tx.type !== filterType) return false;
      
      // Status filter
      if (filterStatus !== "all" && tx.status !== filterStatus) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          tx.description?.toLowerCase().includes(query) ||
          tx.id.toLowerCase().includes(query) ||
          tx.type.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return (b.amount || 0) - (a.amount || 0);
      }
    }) || [];

  // Get transaction icon and color
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy_gold":
        return { icon: Plus, color: "text-green-500", bg: "bg-green-500/10" };
      case "sell_gold":
        return { icon: Minus, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "deposit":
        return { icon: ArrowDownToLine, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "withdrawal":
        return { icon: Send, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "physical_delivery":
      case "delivery":
        return { icon: Package, color: "text-amber-500", bg: "bg-amber-500/10" };
      default:
        return { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" };
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export to CSV (placeholder)
  const handleExport = () => {
    // TODO: Implement CSV export
    alert("Export feature coming soon!");
  };

  // Loading state
  if (!user) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6 text-primary" />
                  Transaction History
                </h1>
                <p className="text-sm text-muted-foreground">
                  View all your transactions
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="pl-10 bg-background/50"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy_gold">Buy Gold</SelectItem>
                <SelectItem value="sell_gold">Sell Gold</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdraw</SelectItem>
                <SelectItem value="physical_delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="bg-card/60 backdrop-blur-md border-border p-12 text-center">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Start trading to see your transaction history"}
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Transaction Count */}
            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? "s" : ""}
            </div>

            {/* Transaction List */}
            {filteredTransactions.map((tx) => {
              const { icon: Icon, color, bg } = getTransactionIcon(tx.type);
              
              return (
                <Card
                  key={tx.id}
                  className="bg-card/60 backdrop-blur-md border-border p-4 hover:bg-card/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {tx.description || tx.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tx.createdAt.toString())}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold ${
                            tx.type === "buy_gold" || tx.type === "deposit"
                              ? "text-green-500"
                              : "text-orange-500"
                          }`}>
                            {tx.type === "buy_gold"
                              ? `+${tx.goldAmount?.toFixed(6) || 0} g`
                              : tx.type === "sell_gold"
                              ? `-${tx.goldAmount?.toFixed(6) || 0} g`
                              : `${tx.type === "deposit" ? "+" : "-"}$${tx.amount?.toFixed(2) || 0}`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.currency || "USD"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status and ID */}
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(tx.status)}
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {tx.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
