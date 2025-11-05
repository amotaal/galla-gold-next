// /components/dialogs/deposit.tsx
// Deposit Dialog - Full-Screen Professional Design
// Purpose: Add funds to wallet via multiple payment methods

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
} from "@/components/full-dialog";
import {
  ArrowDownToLine,
  CreditCard,
  Building2,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  Info,
} from "lucide-react";
import { depositAction } from "@/server/actions/wallet";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: Building2,
    fee: "Free",
    duration: "1-3 business days",
    recommended: true,
  },
  {
    id: "credit_card",
    label: "Credit Card",
    icon: CreditCard,
    fee: "2.9%",
    duration: "Instant",
    recommended: false,
  },
  {
    id: "debit_card",
    label: "Debit Card",
    icon: CreditCard,
    fee: "1.5%",
    duration: "Instant",
    recommended: false,
  },
] as const;

/**
 * DepositDialog - Professional full-screen dialog for depositing funds
 *
 * Features:
 * - Multiple payment methods
 * - Real-time fee calculation
 * - KYC-based limits
 * - Clear transaction flow
 * - Backend integration
 */
export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
  const { balance, refetchAll } = useWallet();

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate values
  const amountNum = parseFloat(amount) || 0;
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);
  const feePercent =
    selectedMethod?.id === "credit_card"
      ? 0.029
      : selectedMethod?.id === "debit_card"
      ? 0.015
      : 0;
  const fee = amountNum * feePercent;
  const total = amountNum + fee;
  const currentBalance = balance?.USD || 0;

  // Limits (these would come from KYC status in production)
  const dailyLimit = 10000;
  const singleLimit = 5000;

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setPaymentMethod("bank_transfer");
      setShowConfirmation(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Quick amounts
  const quickAmounts = [
    { label: "$100", value: 100 },
    { label: "$500", value: 500 },
    { label: "$1,000", value: 1000 },
    { label: "$5,000", value: 5000 },
  ];

  // Handle deposit
  const handleDeposit = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("currency", "USD");
      formData.append("paymentMethod", paymentMethod);
      formData.append("fee", fee.toString());

      const result = await depositAction(formData);

      if (result.success) {
        toast.success("Deposit initiated successfully!", {
          description: `$${amountNum.toFixed(2)} will be added to your wallet`,
        });
        await refetchAll();
        onOpenChange(false);
      } else {
        toast.error("Deposit failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Deposit failed", {
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
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-blue-600/20">
                <ArrowDownToLine className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Deposit Funds
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Add money to your wallet to buy gold
                </FullScreenDialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-lg font-bold text-blue-500">
                  ${currentBalance.toFixed(2)}
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
                {/* Deposit Amount Input */}
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-lg font-semibold">
                        Deposit Amount
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum deposit: $10
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        step="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-3xl h-16 pl-12 font-bold"
                        disabled={isSubmitting}
                      />
                    </div>

                    {amountNum < 10 && amount !== "" && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Minimum deposit is $10</span>
                      </div>
                    )}

                    {amountNum > singleLimit && (
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
                        key={value}
                        variant="outline"
                        size="lg"
                        onClick={() => setAmount(value.toString())}
                        disabled={isSubmitting || value > singleLimit}
                        className="text-base hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Payment Method Selection */}
                <Card className="p-6 border-border">
                  <Label className="text-lg font-semibold mb-4 block">
                    Payment Method
                  </Label>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.id} className="relative">
                        <div
                          className={`
                          flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all
                          ${
                            paymentMethod === method.id
                              ? "border-blue-500 bg-blue-500/5"
                              : "border-border hover:border-blue-500/50"
                          }
                        `}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`
                              p-2 rounded-lg 
                              ${
                                paymentMethod === method.id
                                  ? "bg-blue-500/10"
                                  : "bg-muted"
                              }
                            `}
                            >
                              <method.icon
                                className={`
                                w-5 h-5 
                                ${
                                  paymentMethod === method.id
                                    ? "text-blue-500"
                                    : "text-muted-foreground"
                                }
                              `}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={method.id}
                                  className="font-semibold cursor-pointer"
                                >
                                  {method.label}
                                </Label>
                                {method.recommended && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>Fee: {method.fee}</span>
                                <span>•</span>
                                <span>{method.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              </div>

              {/* RIGHT COLUMN - Summary (1/3) */}
              <div className="space-y-6">
                {/* Deposit Summary */}
                <Card className="p-6 border-border sticky top-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Deposit Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Deposit Amount
                      </span>
                      <span className="font-semibold">
                        ${amountNum.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Payment Method
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedMethod?.label}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Processing Fee
                      </span>
                      <span className="font-semibold text-blue-500">
                        ${fee.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total Charge</span>
                      <span className="font-bold text-2xl text-blue-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Limits Info */}
                <Card className="p-6 border-border bg-blue-500/5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm space-y-2">
                      <p className="font-semibold text-foreground">
                        Transaction Limits
                      </p>
                      <p className="text-muted-foreground">
                        Daily limit: ${dailyLimit.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">
                        Per transaction: ${singleLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-500 mt-2">
                        Complete KYC verification to increase limits
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Security Features */}
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-bold mb-4">Security Features</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Bank-level encryption
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Instant credit for card payments
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        24/7 transaction monitoring
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-md mx-auto">
              <Card className="p-8 border-blue-500/30">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-blue-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">Confirm Deposit</h3>
                    <p className="text-muted-foreground">
                      Please review your deposit details
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
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-semibold">
                        {selectedMethod?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Charge:
                      </span>
                      <span className="font-semibold text-blue-500">
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
                      onClick={handleDeposit}
                      disabled={isSubmitting}
                      size="lg"
                      className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirm Deposit
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
                <p>Secure payment • Encrypted connection • PCI DSS compliant</p>
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
                    amountNum < 10 ||
                    amountNum > singleLimit ||
                    isSubmitting
                  }
                  size="lg"
                  className="px-8 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                >
                  <ArrowDownToLine className="w-5 h-5 mr-2" />
                  Deposit Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
