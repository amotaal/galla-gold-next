// app/dashboard/sell/page.tsx
// Purpose: Sell gold holdings and convert to cash balance

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sellGoldAction } from "@/server/actions/gold";
import {
  ArrowLeft,
  Coins,
  DollarSign,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Sell Gold Page
 * 
 * Allows users to sell their gold holdings for cash
 * Features:
 * - Real-time gold balance display
 * - Amount input with validation
 * - Live price calculation
 * - Fee breakdown
 * - Currency selection
 * - Confirmation dialog
 */
export default function SellPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { gold, goldPrice, refetchAll } = useWallet();
  const { toast } = useToast();

  // Form state
  const [grams, setGrams] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Calculate proceeds
  const gramsNum = parseFloat(grams) || 0;
  const pricePerGram = goldPrice || 0; // goldPrice is already the price per gram
  const subtotal = gramsNum * pricePerGram;
  const feePercentage = 0.01; // 1% fee
  const fee = subtotal * feePercentage;
  const totalProceeds = subtotal - fee;

  // Available gold balance
  const availableGold = gold?.grams || 0;

  // Handle sell
  const handleSell = async () => {
    if (gramsNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of gold to sell",
        variant: "destructive",
      });
      return;
    }

    if (gramsNum > availableGold) {
      toast({
        title: "Insufficient Gold",
        description: `You only have ${availableGold.toFixed(6)} grams available`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("grams", gramsNum.toString());
      formData.append("currency", currency);
      formData.append("pricePerGram", pricePerGram.toString());

      const result = await sellGoldAction(formData);

      if (result.success) {
        toast({
          title: "Sale Successful!",
          description: result.message,
        });

        // Refresh wallet data
        await refetchAll();

        // Reset form
        setGrams("");
        setShowConfirmation(false);

        // Navigate back to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast({
          title: "Sale Failed",
          description: result.error || "Failed to sell gold",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sell error:", error);
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
                <TrendingDown className="w-6 h-6 text-orange-500" />
                Sell Gold
              </h1>
              <p className="text-sm text-muted-foreground">
                Convert your gold holdings to cash
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Live Price: ${pricePerGram.toFixed(2)}/g
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <Card className="bg-card/60 backdrop-blur-md border-border p-6">
            <div className="space-y-6">
              {/* Available Balance */}
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Available Gold
                  </span>
                  <Coins className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-500">
                  {availableGold.toFixed(6)} g
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ≈ ${(availableGold * pricePerGram).toFixed(2)} USD
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="grams">Amount to Sell (grams)</Label>
                <div className="relative">
                  <Input
                    id="grams"
                    type="number"
                    step="0.000001"
                    min="0"
                    max={availableGold}
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    placeholder="0.000000"
                    className="bg-background/50 text-lg pr-20"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGrams(availableGold.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: 0.1 grams
                </p>
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency">Receive In</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EGP">EGP (E£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warning */}
              {gramsNum > availableGold && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">
                    Insufficient gold balance. You have {availableGold.toFixed(6)} grams available.
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={
                  !grams ||
                  gramsNum <= 0 ||
                  gramsNum > availableGold ||
                  isSubmitting
                }
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Review Sale
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Price Breakdown */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Proceeds Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{gramsNum.toFixed(6)} g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per gram</span>
                  <span className="font-medium">
                    ${pricePerGram.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Fee ({(feePercentage * 100).toFixed(1)}%)
                  </span>
                  <span className="font-medium text-orange-500">
                    -${fee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold">You Receive</span>
                  <span className="text-xl font-bold text-primary">
                    ${totalProceeds.toFixed(2)}
                  </span>
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
                <li>• Funds will be added to your wallet instantly</li>
                <li>• Current market price is locked for 60 seconds</li>
                <li>• Transaction cannot be reversed once confirmed</li>
                <li>• A {(feePercentage * 100).toFixed(1)}% service fee applies</li>
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
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Sale</h3>
              <p className="text-sm text-muted-foreground">
                Please review your transaction details
              </p>
            </div>

            <div className="space-y-3 bg-secondary/30 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling</span>
                <span className="font-medium">{gramsNum.toFixed(6)} g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-bold text-primary">
                  ${totalProceeds.toFixed(2)} {currency}
                </span>
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
                onClick={handleSell}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Sale
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
