// /components/dialogs/buy.tsx
// Buy Gold Dialog - Full-Screen Professional Design
// Purpose: Purchase physical gold at live market prices with real-time calculations

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
  Plus,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { buyGoldAction } from "@/server/actions/gold";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet";

interface BuyGoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * BuyGoldDialog - Professional full-screen dialog for buying gold
 *
 * Features:
 * - Full-screen layout (95% viewport)
 * - Two-column design (form + summary)
 * - Real-time price updates
 * - Live calculations
 * - Clear validation
 * - Confirmation flow
 * - Backend integration
 */
export function BuyGoldDialog({ open, onOpenChange }: BuyGoldDialogProps) {
  const { balance, goldPrice, refetchAll } = useWallet();

  // Form state
  const [grams, setGrams] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate values
  const gramsNum = parseFloat(grams) || 0;
  const pricePerGram = goldPrice || 65.5;
  const subtotal = gramsNum * pricePerGram;
  const fee = subtotal * 0.01; // 1% transaction fee
  const total = subtotal + fee;
  const availableBalance = balance?.USD || 0; // Extract USD property

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setGrams("");
      setShowConfirmation(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Quick select amounts
  const quickAmounts = [
    { label: "1g", value: 1 },
    { label: "5g", value: 5 },
    { label: "10g", value: 10 },
    { label: "50g", value: 50 },
  ];

  // Handle purchase
  const handlePurchase = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("grams", grams);
      formData.append("currency", "USD");
      formData.append("totalAmount", total.toString());
      formData.append("pricePerGram", pricePerGram.toString());

      const result = await buyGoldAction(formData);

      if (result.success) {
        toast.success("Gold purchased successfully!", {
          description: `You bought ${grams}g of gold`,
        });
        await refetchAll();
        onOpenChange(false);
      } else {
        toast.error("Purchase failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Purchase failed", {
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
              <div className="p-2 rounded-lg bg-linear-to-br from-green-500/20 to-green-600/20">
                <Plus className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Buy Gold
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Purchase physical gold at live market price
                </FullScreenDialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Live Price</p>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-green-500" />
                  <p className="text-lg font-bold text-green-500">
                    ${pricePerGram.toFixed(2)}/g
                  </p>
                </div>
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
                <Card className="p-6 border-green-500/30 bg-green-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Available Balance
                      </p>
                      <p className="text-3xl font-bold text-green-500">
                        ${availableBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ready to trade
                      </p>
                    </div>
                    <div className="p-4 rounded-full bg-green-500/10">
                      <Sparkles className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </Card>

                {/* Purchase Amount Input */}
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="grams" className="text-lg font-semibold">
                        Amount to Buy (grams)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum purchase: 0.1 grams
                      </p>
                    </div>

                    <div className="relative">
                      <Input
                        id="grams"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                        placeholder="0.00"
                        className="text-3xl h-16 pr-12 font-bold"
                        disabled={isSubmitting}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                        g
                      </span>
                    </div>

                    {gramsNum < 0.1 && grams !== "" && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Minimum purchase is 0.1 grams</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Quick Select */}
                <Card className="p-6 border-border">
                  <Label className="text-base font-semibold mb-3 block">
                    Quick Select
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {quickAmounts.map(({ label, value }) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="lg"
                        onClick={() => setGrams(value.toString())}
                        disabled={isSubmitting}
                        className="text-base hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN - Summary (1/3) */}
              <div className="space-y-6">
                {/* Purchase Summary */}
                <Card className="p-6 border-border sticky top-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Purchase Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gold Amount</span>
                      <span className="font-semibold">
                        {gramsNum.toFixed(2)}g
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Price per Gram
                      </span>
                      <span className="font-semibold">
                        ${pricePerGram.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Transaction Fee (1%)
                      </span>
                      <span className="font-semibold text-green-500">
                        ${fee.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total Cost</span>
                      <span className="font-bold text-2xl text-green-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Benefits */}
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-bold mb-4">Why Buy Gold?</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Secure asset backed by physical gold
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Instant settlement at live prices
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        24/7 trading, market never closes
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-md mx-auto">
              <Card className="p-8 border-green-500/30">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      Confirm Purchase
                    </h3>
                    <p className="text-muted-foreground">
                      Please review your purchase details
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Gold Amount:
                      </span>
                      <span className="font-semibold">
                        {gramsNum.toFixed(2)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold text-green-500">
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
                      onClick={handlePurchase}
                      disabled={isSubmitting}
                      size="lg"
                      className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirm Purchase
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
                  Secure transaction • Instant settlement • Competitive rates
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
                    !grams ||
                    gramsNum < 0.1 ||
                    total > availableBalance ||
                    isSubmitting
                  }
                  size="lg"
                  className="px-8 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Buy Gold Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
