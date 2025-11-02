// app/dashboard/deposit/page.tsx
// Purpose: Add funds to wallet via various payment methods

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { depositAction } from "@/server/actions/wallet";
import {
  ArrowLeft,
  ArrowDownToLine,
  CreditCard,
  Building2,
  Loader2,
  CheckCircle2,
  Copy,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Deposit Page
 * 
 * Allows users to add funds to their wallet
 * Payment methods:
 * - Bank Transfer
 * - Credit/Debit Card
 * - Wire Transfer
 */
export default function DepositPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { balance, refetchAll } = useWallet();
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "credit_card">("bank_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Bank transfer details (mock - replace with real data)
  const bankDetails = {
    bankName: "GALLA GOLD BANK",
    accountName: "Galla Gold Holdings Ltd",
    accountNumber: "1234567890",
    routingNumber: "021000021",
    swiftCode: "GALLAGLD",
    reference: user?.email || "",
  };

  // Handle deposit
  const handleDeposit = async () => {
    const amountNum = parseFloat(amount);

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
        title: "Minimum Deposit",
        description: "Minimum deposit amount is $10",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("amount", amountNum.toString());
      formData.append("currency", "USD");
      formData.append("paymentMethod", paymentMethod);

      const result = await depositAction(formData);

      if (result.success) {
        toast({
          title: "Deposit Initiated",
          description: result.message,
        });

        if (paymentMethod === "bank_transfer") {
          setShowInstructions(true);
        } else {
          // For card payments, show success and redirect
          await refetchAll();
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      } else {
        toast({
          title: "Deposit Failed",
          description: result.error || "Failed to process deposit",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
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
                <ArrowDownToLine className="w-6 h-6 text-blue-500" />
                Deposit Funds
              </h1>
              <p className="text-sm text-muted-foreground">
                Add money to your wallet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {!showInstructions ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <Tabs
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as "bank_transfer" | "credit_card")
                }
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="bank_transfer">
                    <Building2 className="w-4 h-4 mr-2" />
                    Bank Transfer
                  </TabsTrigger>
                  <TabsTrigger value="credit_card">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Card
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-6">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-background/50 text-lg pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum deposit: $10
                    </p>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary"
                      >
                        ${quickAmount}
                      </Button>
                    ))}
                  </div>

                  {/* Payment Method Specific Content */}
                  <TabsContent value="bank_transfer" className="mt-0">
                    <Card className="bg-blue-500/10 border-blue-500/20 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground mb-1">
                            Bank Transfer Instructions
                          </p>
                          <p>
                            Processing time: 1-3 business days. You will receive
                            bank details after clicking "Continue".
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="credit_card" className="mt-0">
                    <Card className="bg-green-500/10 border-green-500/20 p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground mb-1">
                            Instant Processing
                          </p>
                          <p>
                            Funds will be available immediately. A 2.9% + $0.30
                            processing fee applies.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Action Button */}
                  <Button
                    onClick={handleDeposit}
                    disabled={!amount || parseFloat(amount) < 10 || isSubmitting}
                    className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    )}
                  </Button>
                </div>
              </Tabs>
            </Card>

            {/* Right Column - Info */}
            <div className="space-y-6">
              {/* Current Balance */}
              <Card className="bg-linear-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Current Balance
                  </span>
                  <ArrowDownToLine className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-500">
                  ${(balance?.USD || 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  USD Available
                </div>
              </Card>

              {/* Fees Info */}
              <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                <h3 className="text-lg font-bold mb-4">Fees & Limits</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Transfer Fee</span>
                    <span className="font-medium text-green-500">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card Processing</span>
                    <span className="font-medium">2.9% + $0.30</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-muted-foreground">Minimum</span>
                    <span className="font-medium">$10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Limit</span>
                    <span className="font-medium">$50,000</span>
                  </div>
                </div>
              </Card>

              {/* Security Info */}
              <Card className="bg-card/60 backdrop-blur-md border-border p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Secure & Protected
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bank-level encryption (256-bit SSL)</li>
                  <li>• PCI DSS compliant payment processing</li>
                  <li>• Funds are FDIC insured up to $250,000</li>
                  <li>• Real-time transaction monitoring</li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          /* Bank Transfer Instructions */
          <Card className="bg-card/60 backdrop-blur-md border-border p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Bank Transfer Details</h2>
              <p className="text-muted-foreground">
                Use these details to transfer ${amount} to your Galla Gold account
              </p>
            </div>

            <div className="space-y-4 bg-secondary/30 rounded-lg p-6 mb-6">
              {Object.entries(bankDetails).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        copyToClipboard(
                          value,
                          key.replace(/([A-Z])/g, " $1").trim()
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Include your email as the reference</li>
                    <li>• Processing takes 1-3 business days</li>
                    <li>• You'll receive an email when funds arrive</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInstructions(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-linear-to-r from-blue-500 to-blue-600"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
