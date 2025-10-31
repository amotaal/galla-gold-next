// app/dashboard/withdraw/page.tsx
// Purpose: Withdraw funds from wallet to bank account

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { withdrawAction } from "@/server/actions/wallet";
import {
  ArrowLeft,
  Send,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Withdraw Page
 * 
 * Allows users to withdraw funds to their bank account
 * Features:
 * - Balance display
 * - Amount validation with limits
 * - Bank account details
 * - Fee calculation
 * - Processing time estimate
 */
export default function WithdrawPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { balance, refetchAll } = useWallet();
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState(user?.firstName + " " + user?.lastName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Calculate fees and net amount
  const amountNum = parseFloat(amount) || 0;
  const withdrawalFee = amountNum > 0 ? 2.5 : 0; // Flat $2.50 fee
  const netAmount = amountNum - withdrawalFee;
  const availableBalance = balance?.USD || 0;

  // Daily limit (mock - should come from backend)
  const dailyLimit = 10000;
  const withdrawnToday = 0; // Mock - should come from backend
  const remainingLimit = dailyLimit - withdrawnToday;

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!amountNum || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 10) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is $10",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have $${availableBalance.toFixed(2)} available`,
        variant: "destructive",
      });
      return;
    }

    if (amountNum > remainingLimit) {
      toast({
        title: "Daily Limit Exceeded",
        description: `Daily limit remaining: $${remainingLimit.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (!bankAccount || !routingNumber || !accountHolder) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("amount", amountNum.toString());
      formData.append("currency", "USD");
      formData.append("paymentMethod", "bank_transfer");
      formData.append("bankAccount", bankAccount);
      formData.append("routingNumber", routingNumber);
      formData.append("accountHolder", accountHolder);

      const result = await withdrawAction(formData);

      if (result.success) {
        toast({
          title: "Withdrawal Initiated",
          description: result.message,
        });

        // Refresh wallet data
        await refetchAll();

        // Reset form
        setAmount("");
        setBankAccount("");
        setRoutingNumber("");
        setShowConfirmation(false);

        // Navigate back to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.error || "Failed to process withdrawal",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
                <Send className="w-6 h-6 text-purple-500" />
                Withdraw Funds
              </h1>
              <p className="text-sm text-muted-foreground">
                Transfer money to your bank account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <Card className="bg-card/60 backdrop-blur-md border-border p-6">
            <div className="space-y-6">
              {/* Available Balance */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Available Balance
                  </span>
                  <DollarSign className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-500">
                  ${availableBalance.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  USD Available to Withdraw
                </div>
              </div>

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
                    step="0.01"
                    min="10"
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-background/50 text-lg pl-8 pr-20"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAmount(availableBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: $10 • Daily limit: ${remainingLimit.toFixed(2)}
                </p>
              </div>

              {/* Bank Account Details */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Bank Account Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="John Doe"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="1234567890"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="021000021"
                    className="bg-background/50"
                  />
                </div>
              </div>

              {/* Warnings */}
              {amountNum > availableBalance && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">
                    Insufficient balance. Available: ${availableBalance.toFixed(2)}
                  </div>
                </div>
              )}

              {amountNum > remainingLimit && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-500">
                    Daily limit exceeded. Remaining: ${remainingLimit.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={
                  !amount ||
                  amountNum < 10 ||
                  amountNum > availableBalance ||
                  amountNum > remainingLimit ||
                  !bankAccount ||
                  !routingNumber ||
                  !accountHolder ||
                  isSubmitting
                }
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Review Withdrawal
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Withdrawal Summary */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Withdrawal Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Withdrawal Amount</span>
                  <span className="font-medium">${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium text-purple-500">
                    -${withdrawalFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold">You Receive</span>
                  <span className="text-xl font-bold text-primary">
                    ${netAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Limits Info */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-4">Limits & Processing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Withdrawal</span>
                  <span className="font-medium">$10.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Limit</span>
                  <span className="font-medium">
                    ${remainingLimit.toFixed(2)} / $10,000
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="text-muted-foreground">Processing Time</span>
                  <span className="font-medium">1-3 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">$2.50 per withdrawal</span>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-500/10 backdrop-blur-md border-blue-500/20 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-500">
                <AlertCircle className="w-4 h-4" />
                Important Information
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Withdrawals processed Monday-Friday</li>
                <li>• Bank details must match your verified identity</li>
                <li>• You'll receive email confirmation when processed</li>
                <li>• Contact support if funds don't arrive in 3 days</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                Please review your withdrawal details
              </p>
            </div>

            <div className="space-y-3 bg-secondary/30 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${amountNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">-${withdrawalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-bold text-primary">
                  ${netAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                <p>To: {accountHolder}</p>
                <p>Account: ****{bankAccount.slice(-4)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
