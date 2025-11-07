// components/admin/transaction-table.tsx
// Purpose: Transaction Table - Display and manage transactions

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Flag } from "lucide-react";
import Link from "next/link";
import { TransactionDetailDialog } from "@/components/dialogs/transaction";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth";

interface Transaction {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  flagged?: boolean;
}

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function TransactionTable({
  transactions,
  loading,
}: TransactionTableProps) {
  const { user } = useAuth();
  const adminId = user?.id || ""; // Get adminId from auth context

  // ... rest of the component

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow
                key={tx._id}
                className={tx.flagged ? "bg-red-50 dark:bg-red-950/10" : ""}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">
                      {tx.userId.firstName} {tx.userId.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.userId.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="capitalize">
                  {tx.type.replace("_", " ")}
                </TableCell>
                <TableCell className="font-medium">
                  {formatAmount(tx.amount, tx.currency)}
                </TableCell>
                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                <TableCell className="text-sm">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={tx.status === "pending" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {tx.status === "pending" ? "Process" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        adminId={adminId}
        onSuccess={() => {
          // Refresh transactions list
          window.location.reload();
        }}
      />
    </div>
  );
}

export default TransactionTable;
