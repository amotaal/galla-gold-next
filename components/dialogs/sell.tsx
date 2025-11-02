// /components/dialogs/sell.tsx
// Sell Gold Dialog - Full-Screen Professional Design
// Purpose: Convert physical gold to cash at live market prices

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
  Minus,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
} from "lucide-react";
import { sellGoldAction } from "@/server/actions/gold";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet";

interface SellGoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * SellGoldDialog - Professional full-screen dialog for selling gold
 *
 * Features:
 * - Convert gold to cash
 * - Real-time price calculations
 * - Clear transaction breakdown
 * - Confirmation flow
 * - Backend integration
 */
export function SellGoldDialog({ open, onOpenChange }: SellGoldDialogProps) {
  const { gold, goldPrice, refetchAll } = useWallet();

  // Form state
  const [grams, setGrams] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate values
  const gramsNum = parseFloat(grams) || 0;
  const pricePerGram = goldPrice || 65.5;
  const subtotal = gramsNum * pricePerGram;
  const fee = subtotal * 0.01; // 1% transaction fee
  const total = subtotal - fee; // Net amount received
  const availableGold = gold?.grams || 0;

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
    { label: "All", value: availableGold },
  ];

  // Handle sale
  const handleSale = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("grams", grams);

      const result = await sellGoldAction(formData);

      if (result.success) {
        toast.success("Gold sold successfully!", {
          description: `You sold ${grams}g of gold for $${total.toFixed(2)}`,
        });
        await refetchAll();
        onOpenChange(false);
      } else {
        toast.error("Sale failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Sale failed", {
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
              <div className="p-2 rounded-lg bg-linear-to-br from-orange-500/20 to-orange-600/20">
                <Minus className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Sell Gold
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Convert your gold to cash at live market price
                </FullScreenDialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Live Price</p>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-orange-500" />
                  <p className="text-lg font-bold text-orange-500">
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
                {/* Available Gold Card */}
                <Card className="p-6 border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Available Gold
                      </p>
                      <p className="text-3xl font-bold text-orange-500">
                        {availableGold.toFixed(2)}g
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ready to sell
                      </p>
                    </div>
                    <div className="p-4 rounded-full bg-orange-500/10">
                      <Coins className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </Card>

                {/* Sale Amount Input */}
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="grams" className="text-lg font-semibold">
                        Amount to Sell (grams)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum sale: 0.1 grams
                      </p>
                    </div>

                    <div className="relative">
                      <Input
                        id="grams"
                        type="number"
                        min="0.1"
                        step="0.1"
                        max={availableGold}
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
                        <span>Minimum sale is 0.1 grams</span>
                      </div>
                    )}

                    {gramsNum > availableGold && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient gold balance</span>
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
                        key={label}
                        variant="outline"
                        size="lg"
                        onClick={() => setGrams(value.toFixed(2))}
                        disabled={isSubmitting || value > availableGold}
                        className="text-base hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-500"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN - Summary (1/3) */}
              <div className="space-y-6">
                {/* Sale Summary */}
                <Card className="p-6 border-border sticky top-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-primary" />
                    Sale Summary
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
                      <span className="text-muted-foreground">
                        Gross Amount
                      </span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Transaction Fee (1%)
                      </span>
                      <span className="font-semibold text-orange-500">
                        -${fee.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">You Receive</span>
                      <span className="font-bold text-2xl text-orange-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Benefits */}
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-bold mb-4">Sale Benefits</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Instant cash at market rates
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Fast settlement to your wallet
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        24/7 availability, sell anytime
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-md mx-auto">
              <Card className="p-8 border-orange-500/30">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-orange-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">Confirm Sale</h3>
                    <p className="text-muted-foreground">
                      Please review your sale details
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
                      <span className="text-muted-foreground">
                        You Receive:
                      </span>
                      <span className="font-semibold text-orange-500">
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
                      onClick={handleSale}
                      disabled={isSubmitting}
                      size="lg"
                      className="flex-1 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirm Sale
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
                  Instant settlement • Competitive rates • Secure transaction
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
                    gramsNum > availableGold ||
                    isSubmitting
                  }
                  size="lg"
                  className="px-8 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                >
                  <Minus className="w-5 h-5 mr-2" />
                  Sell Gold Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
