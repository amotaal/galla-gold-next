// /components/dialogs/withdraw.tsx
// Withdraw Dialog - Full-Screen Professional Design
// Purpose: Withdraw funds from wallet to bank account

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
} from "@/components/full-dialog";
import {
  Send,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  Info,
  TrendingUp,
} from "lucide-react";
import { withdrawalAction } from "@/server/actions/wallet";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WithdrawDialog - Professional full-screen dialog for withdrawing funds
 *
 * Features:
 * - Bank transfer withdrawals
 * - Real-time fee calculation
 * - KYC-based limits
 * - Clear transaction flow
 * - Backend integration
 */
export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const { balance, refetchAll } = useWallet();

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate values
  const amountNum = parseFloat(amount) || 0;
  const fee = 0; // Free withdrawals
  const total = amountNum; // No fees
  const availableBalance = balance?.USD || 0;

  // Limits (these would come from KYC status in production)
  const dailyLimit = 5000;
  const singleLimit = 2500;
  const minimumWithdrawal = 20;

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setShowConfirmation(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Quick amounts
  const quickAmounts = [
    { label: "$100", value: 100 },
    { label: "$500", value: 500 },
    { label: "$1,000", value: 1000 },
    { label: "All", value: Math.min(availableBalance, singleLimit) },
  ];

  // Handle withdrawal
  const handleWithdraw = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("paymentMethod", "bank_transfer");

      const result = await withdrawalAction(formData);

      if (result.success) {
        toast.success("Withdrawal initiated successfully!", {
          description: `$${amountNum.toFixed(
            2
          )} will be sent to your bank account`,
        });
        await refetchAll();
        onOpenChange(false);
      } else {
        toast.error("Withdrawal failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Withdrawal failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent className="p-0">
        {/* Fixed Header */}
        <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-purple-500/20 to-purple-600/20">
                <Send className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Withdraw Funds
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Transfer money to your bank account
                </FullScreenDialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-lg font-bold text-purple-500">
                  ${availableBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!showConfirmation ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* LEFT COLUMN - Form (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Available Balance Card */}
                <Card className="p-6 border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Available to Withdraw
                      </p>
                      <p className="text-3xl font-bold text-purple-500">
                        ${availableBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Free bank transfers
                      </p>
                    </div>
                    <div className="p-4 rounded-full bg-purple-500/10">
                      <Wallet className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </Card>

                {/* Withdrawal Amount Input */}
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-lg font-semibold">
                        Withdrawal Amount
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum withdrawal: ${minimumWithdrawal}
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        min={minimumWithdrawal}
                        step="10"
                        max={availableBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-3xl h-16 pl-12 font-bold"
                        disabled={isSubmitting}
                      />
                    </div>

                    {amountNum < minimumWithdrawal && amount !== "" && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Minimum withdrawal is ${minimumWithdrawal}</span>
                      </div>
                    )}

                    {amountNum > availableBalance && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient balance</span>
                      </div>
                    )}

                    {amountNum > singleLimit &&
                      amountNum <= availableBalance && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            Exceeds single transaction limit of ${singleLimit}
                          </span>
                        </div>
                      )}
                  </div>
                </Card>

                {/* Quick Amounts */}
                <Card className="p-6 border-border">
                  <Label className="text-base font-semibold mb-3 block">
                    Quick Amounts
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {quickAmounts.map(({ label, value }) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="lg"
                        onClick={() => setAmount(value.toFixed(2))}
                        disabled={
                          isSubmitting ||
                          value > availableBalance ||
                          value > singleLimit
                        }
                        className="text-base hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-500"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Bank Account Info */}
                <Card className="p-6 border-border">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-purple-500 mt-1 shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">Bank Account</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Funds will be sent to your linked bank account:
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="font-medium">**** **** **** 1234</p>
                        <p className="text-muted-foreground">Bank of America</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN - Summary (1/3) */}
              <div className="space-y-6">
                {/* Withdrawal Summary */}
                <Card className="p-6 border-border sticky top-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Withdrawal Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Withdrawal Amount
                      </span>
                      <span className="font-semibold">
                        ${amountNum.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Transfer Method
                      </span>
                      <span className="font-semibold text-sm">
                        Bank Transfer
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Processing Fee
                      </span>
                      <span className="font-semibold text-green-500">Free</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Arrival Time
                      </span>
                      <span className="font-semibold text-sm">
                        1-3 business days
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">You Receive</span>
                      <span className="font-bold text-2xl text-purple-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Limits Info */}
                <Card className="p-6 border-border bg-purple-500/5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                    <div className="text-sm space-y-2">
                      <p className="font-semibold text-foreground">
                        Withdrawal Limits
                      </p>
                      <p className="text-muted-foreground">
                        Daily limit: ${dailyLimit.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">
                        Per transaction: ${singleLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-500 mt-2">
                        Complete KYC verification to increase limits
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Security Features */}
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-bold mb-4">
                    Security & Processing
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Secure bank-verified transfers
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Processed within 1-3 business days
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        No withdrawal fees
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-md mx-auto">
              <Card className="p-8 border-purple-500/30">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-purple-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      Confirm Withdrawal
                    </h3>
                    <p className="text-muted-foreground">
                      Please review your withdrawal details
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">
                        ${amountNum.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Destination:
                      </span>
                      <span className="font-semibold text-sm">
                        Bank ****1234
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        You Receive:
                      </span>
                      <span className="font-semibold text-purple-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowConfirmation(false)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleWithdraw}
                      disabled={isSubmitting}
                      size="lg"
                      className="flex-1 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirm Withdrawal
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        {!showConfirmation && (
          <div className="shrink-0 border-t border-border bg-card/50 p-6">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-sm text-muted-foreground">
                <p>
                  Free transfers • 1-3 business days • Bank-verified • Secure
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => setShowConfirmation(true)}
                  disabled={
                    !amount ||
                    amountNum < minimumWithdrawal ||
                    amountNum > availableBalance ||
                    amountNum > singleLimit ||
                    isSubmitting
                  }
                  size="lg"
                  className="px-8 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Withdraw Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
