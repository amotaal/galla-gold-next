// /components/dialogs/withdraw.tsx
// Withdraw Dialog - Full-Screen Professional Design
// Purpose: Withdraw funds from wallet to bank account with bank details collection

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
 * - Bank details collection
 * - Real-time fee calculation
 * - KYC-based limits
 * - Clear transaction flow
 * - Backend integration (FIXED - now sends all required fields)
 */
export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const { balance, refetchAll } = useWallet();

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
  });
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
      setBankDetails({
        accountName: "",
        accountNumber: "",
        routingNumber: "",
        bankName: "",
      });
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

  // Validation for bank details
  const isBankDetailsValid =
    bankDetails.accountName.trim() !== "" &&
    bankDetails.accountNumber.trim() !== "" &&
    bankDetails.routingNumber.trim() !== "" &&
    bankDetails.bankName.trim() !== "";

  // ✅ FIXED: Handle withdrawal with all required fields
  const handleWithdraw = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("currency", "USD"); // ✅ ADDED: Currency field
      formData.append("paymentMethod", "bank_transfer");
      formData.append("bankDetails", JSON.stringify(bankDetails)); // ✅ ADDED: Bank details

      const result = await withdrawalAction(formData);

      if (result.success) {
        toast.success("Withdrawal initiated successfully!", {
          description: `$${amountNum.toFixed(
            2
          )} will arrive in 1-3 business days`,
        });
        await refetchAll();
        onOpenChange(false);
      } else {
        toast.error("Withdrawal failed", {
          description: result.error || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
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

  // Proceed to confirmation only if amount and bank details are valid
  const canProceed =
    amount &&
    amountNum >= minimumWithdrawal &&
    amountNum <= availableBalance &&
    amountNum <= singleLimit &&
    isBankDetailsValid &&
    !isSubmitting;

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
            <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {/* Left Column - Withdrawal Form */}
              <div className="space-y-6">
                <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                  <h3 className="text-lg font-bold mb-4">Withdrawal Details</h3>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-lg pl-7"
                        step="0.01"
                        min={minimumWithdrawal}
                        max={Math.min(availableBalance, singleLimit)}
                      />
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {quickAmounts.map((quick) => (
                      <Button
                        key={quick.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(quick.value.toString())}
                        disabled={quick.value > availableBalance}
                        className="hover:bg-purple-500/10 hover:border-purple-500"
                      >
                        {quick.label}
                      </Button>
                    ))}
                  </div>

                  {/* Limits Display */}
                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Minimum withdrawal:</span>
                      <span>${minimumWithdrawal}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Single transaction limit:</span>
                      <span>${singleLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Daily limit:</span>
                      <span>${dailyLimit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {amountNum > 0 && amountNum < minimumWithdrawal && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-4">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-500">
                          Below Minimum
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Minimum withdrawal is ${minimumWithdrawal}
                        </p>
                      </div>
                    </div>
                  )}

                  {amountNum > availableBalance && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-500">
                          Insufficient Balance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You only have ${availableBalance.toFixed(2)} available
                        </p>
                      </div>
                    </div>
                  )}

                  {amountNum > singleLimit && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-500">
                          Exceeds Transaction Limit
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum per transaction is $
                          {singleLimit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Bank Details Form - NEW SECTION */}
                <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    Bank Account Details
                  </h3>

                  <div className="space-y-4">
                    {/* Account Holder Name */}
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Holder Name *</Label>
                      <Input
                        id="accountName"
                        type="text"
                        placeholder="John Doe"
                        value={bankDetails.accountName}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Bank Name */}
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        type="text"
                        placeholder="Bank of America"
                        value={bankDetails.bankName}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            bankName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="1234567890"
                        value={bankDetails.accountNumber}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Routing Number */}
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number *</Label>
                      <Input
                        id="routingNumber"
                        type="text"
                        placeholder="021000021"
                        value={bankDetails.routingNumber}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            routingNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Info Alert */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Your bank details are encrypted and stored securely.
                          We'll use these for this withdrawal only.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div className="space-y-6">
                <Card className="bg-card/60 backdrop-blur-md border-border p-6 sticky top-0">
                  <h3 className="text-lg font-bold mb-4">Withdrawal Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">
                        ${amountNum.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">
                        Transfer Fee
                      </span>
                      <span className="font-semibold text-green-500">FREE</span>
                    </div>

                    <div className="flex justify-between py-3 text-lg">
                      <span className="font-bold">You'll Receive</span>
                      <span className="font-bold text-purple-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Processing time: 1-3 business days</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Secure bank transfer via ACH</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Info Card */}
                <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Withdrawal Information
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      • Withdrawals are processed via secure ACH bank transfer
                    </p>
                    <p>• Funds typically arrive within 1-3 business days</p>
                    <p>• No withdrawal fees</p>
                    <p>• Minimum withdrawal: ${minimumWithdrawal}</p>
                    <p>
                      • Maximum per transaction: ${singleLimit.toLocaleString()}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-2xl mx-auto">
              <Card className="bg-card/60 backdrop-blur-md border-border p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-purple-500" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Confirm Withdrawal
                  </h3>
                  <p className="text-muted-foreground">
                    Please review your withdrawal details
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left mt-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">
                      ${amountNum.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="font-semibold text-green-500">FREE</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">
                      Total to Receive:
                    </span>
                    <span className="font-semibold text-purple-500 text-lg">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">
                        {bankDetails.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-medium">
                        ****{bankDetails.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {bankDetails.accountName}
                      </span>
                    </div>
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
                  disabled={!canProceed}
                  size="lg"
                  className="px-8 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
