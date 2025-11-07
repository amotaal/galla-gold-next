// components/dialogs/transaction.tsx
// Purpose: Transaction Detail Dialog - View and process transaction details
// Allows admins to approve deposits, complete withdrawals, or reject transactions

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Calendar,
  Hash,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  approveDeposit,
  completeWithdrawal,
  rejectTransaction,
} from "@/server/actions/admin/management";

interface Transaction {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
  onSuccess?: () => void;
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  adminId,
  onSuccess,
}: TransactionDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  if (!transaction) return null;

  const isPending = transaction.status === "pending";
  const isDeposit = transaction.type === "deposit";
  const isWithdrawal = transaction.type === "withdrawal";

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = () => {
    const variants: Record<string, { color: string; Icon: any }> = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        Icon: Clock,
      },
      completed: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        Icon: CheckCircle,
      },
      failed: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        Icon: XCircle,
      },
      cancelled: {
        color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        Icon: XCircle,
      },
    };

    const variant = variants[transaction.status] || variants.pending;
    const Icon = variant.Icon;

    return (
      <Badge className={`${variant.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {transaction.status}
      </Badge>
    );
  };

  // Handle approve
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const result = isDeposit
        ? await approveDeposit(adminId, {
            transactionId: transaction._id,
            notes,
          })
        : await completeWithdrawal(adminId, {
            transactionId: transaction._id,
            paymentReference: paymentRef,
            notes,
          });

      if (result.success) {
        toast.success(
          `${
            isDeposit ? "Deposit approved" : "Withdrawal completed"
          } successfully!`
        );
        onOpenChange(false);
        onSuccess?.();
        setNotes("");
        setPaymentRef("");
        setShowApprove(false);
      } else {
        toast.error(result.error || "Failed to process transaction");
      }
    } catch (error) {
      console.error("Process transaction error:", error);
      toast.error("An error occurred while processing the transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (rejectReason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await rejectTransaction(adminId, {
        transactionId: transaction._id,
        reason: rejectReason,
      });

      if (result.success) {
        toast.success("Transaction rejected successfully");
        onOpenChange(false);
        onSuccess?.();
        setRejectReason("");
        setShowReject(false);
      } else {
        toast.error(result.error || "Failed to reject transaction");
      }
    } catch (error) {
      console.error("Reject transaction error:", error);
      toast.error("An error occurred while rejecting the transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Transaction Details
              </DialogTitle>
              <DialogDescription className="mt-1">
                ID: {transaction._id}
              </DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <div className="flex items-center mt-1">
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {transaction.userId.firstName} {transaction.userId.lastName}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="mt-1">
                  <span className="font-medium">
                    {transaction.userId.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              Transaction Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {transaction.type}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <div className="flex items-center mt-1">
                  <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                  <span className="font-bold text-lg">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Payment Method
                </Label>
                <div className="flex items-center mt-1">
                  <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="font-medium capitalize">
                    {transaction.paymentMethod || "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(transaction.createdAt), "PPp")}
                  </span>
                </div>
              </div>
            </div>

            {transaction.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <p className="mt-1 text-sm">{transaction.description}</p>
              </div>
            )}

            {transaction.metadata &&
              Object.keys(transaction.metadata).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Label className="text-xs text-muted-foreground">
                    Metadata
                  </Label>
                  <div className="mt-2 text-xs font-mono bg-background rounded p-2">
                    {JSON.stringify(transaction.metadata, null, 2)}
                  </div>
                </div>
              )}
          </div>

          {/* Action Section - Only for pending transactions */}
          {isPending && (isDeposit || isWithdrawal) && (
            <div className="border-t pt-4">
              {!showApprove && !showReject ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowApprove(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isDeposit ? "Approve Deposit" : "Complete Withdrawal"}
                  </Button>
                  <Button
                    onClick={() => setShowReject(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              ) : showApprove ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-500">
                          {isDeposit
                            ? "Approve Deposit"
                            : "Complete Withdrawal"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isDeposit
                            ? "This will add the funds to the user's wallet."
                            : "This will mark the withdrawal as completed."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isWithdrawal && (
                    <div>
                      <Label htmlFor="payment-ref">
                        Payment Reference (Optional)
                      </Label>
                      <Input
                        id="payment-ref"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g., Transaction ID from bank"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this transaction..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowApprove(false)}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm {isDeposit ? "Approval" : "Completion"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-500">
                          Reject Transaction
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isWithdrawal
                            ? "Funds will be returned to the user's wallet."
                            : "The deposit will be marked as failed."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reject-reason">Rejection Reason *</Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this transaction is being rejected (minimum 10 characters)..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowReject(false)}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      className="flex-1"
                      disabled={isProcessing || rejectReason.trim().length < 10}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Confirm Rejection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!showApprove && !showReject && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
