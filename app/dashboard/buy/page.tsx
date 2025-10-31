// app/dashboard/buy/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  TrendingUp,
  Wallet,
  AlertCircle,
  Check,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BuyGoldPage() {
  const router = useRouter();
  const { goldPrice, balance } = useWallet();
  const [grams, setGrams] = useState("");
  const [currency, setCurrency] = useState("USD");

  const fee = 0.02; // 2% fee
  const cost = parseFloat(grams || "0") * (goldPrice || 0);
  const totalCost = cost * (1 + fee);
  const availableBalance = balance?.[currency as keyof typeof balance] || 0;

  return (
    <div className="dark min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary mb-2">
          Buy Gold
        </h1>
        <p className="text-muted-foreground mb-8">Purchase physical gold</p>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card/60 backdrop-blur-md border-border p-6">
            <h3 className="text-lg font-bold mb-6">Order Details</h3>

            <div className="space-y-4">
              <div>
                <Label>Amount (grams)</Label>
                <Input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  placeholder="0.00"
                  className="bg-background/50 text-lg"
                />
              </div>

              <div>
                <Label>Payment Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {parseFloat(grams || "0") > 0 && totalCost > availableBalance && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-sm">
                    Insufficient balance. Available: $
                    {availableBalance.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          <Card className="bg-card/60 backdrop-blur-md border-border p-6">
            <h3 className="text-lg font-bold mb-6">Order Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Current Gold Price
                </span>
                <span className="font-medium">${goldPrice.toFixed(2)}/g</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{grams || "0.00"} grams</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${cost.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Transaction Fee (2%)
                </span>
                <span className="font-medium">${(cost * fee).toFixed(2)}</span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                disabled={
                  parseFloat(grams || "0") === 0 || totalCost > availableBalance
                }
              >
                <Check className="w-5 h-5 mr-2" />
                Confirm Purchase
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
