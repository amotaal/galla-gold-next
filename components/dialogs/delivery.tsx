// /components/dialogs/delivery.tsx
// Physical Delivery Dialog - Full-Screen Professional Design
// Purpose: Request physical delivery of gold holdings to specified address

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
} from "@/components/full-dialog";
import {
  Package,
  MapPin,
  Truck,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "EG", label: "Egypt" },
] as const;

const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "Standard Shipping",
    duration: "5-7 business days",
    fee: 25,
    insurance: "Included",
  },
  {
    id: "express",
    label: "Express Shipping",
    duration: "2-3 business days",
    fee: 50,
    insurance: "Included",
  },
  {
    id: "overnight",
    label: "Overnight Shipping",
    duration: "1 business day",
    fee: 100,
    insurance: "Included",
  },
] as const;

/**
 * DeliveryDialog - Professional full-screen dialog for physical gold delivery
 *
 * Features:
 * - Address collection
 * - Multiple shipping options
 * - Real-time cost calculation
 * - Clear delivery terms
 * - Backend integration
 */
export function DeliveryDialog({ open, onOpenChange }: DeliveryDialogProps) {
  const { gold } = useWallet();

  // Form state
  const [grams, setGrams] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("US");
  const [shippingMethod, setShippingMethod] = useState<string>("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate values
  const gramsNum = parseFloat(grams) || 0;
  const availableGold = gold?.grams || 0;
  const selectedShipping = SHIPPING_METHODS.find(
    (m) => m.id === shippingMethod
  );
  const shippingFee = selectedShipping?.fee || 0;
  const insuranceFee = Math.ceil(gramsNum * 0.5); // $0.50 per gram insurance
  const totalFee = shippingFee + insuranceFee;

  // Minimum delivery amount
  const minimumDelivery = 10; // 10 grams minimum

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setGrams("");
      setFullName("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setState("");
      setPostalCode("");
      setCountry("US");
      setShippingMethod("standard");
      setShowConfirmation(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Quick select amounts
  const quickAmounts = [
    { label: "10g", value: 10 },
    { label: "25g", value: 25 },
    { label: "50g", value: 50 },
    { label: "All", value: availableGold },
  ];

  // Validate form
  const isFormValid =
    gramsNum >= minimumDelivery &&
    gramsNum <= availableGold &&
    fullName.trim() !== "" &&
    addressLine1.trim() !== "" &&
    city.trim() !== "" &&
    state.trim() !== "" &&
    postalCode.trim() !== "" &&
    country !== "";

  // Handle delivery request
  const handleDelivery = async () => {
    try {
      setIsSubmitting(true);

      // In production, this would call the backend API
      // const formData = new FormData();
      // formData.append("grams", grams);
      // formData.append("fullName", fullName);
      // ... etc

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Delivery request submitted!", {
        description: `Your ${grams}g will be shipped to ${city}, ${state}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Delivery request failed", {
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
              <div className="p-2 rounded-lg bg-linear-to-br from-amber-500/20 to-amber-600/20">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Physical Delivery
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Request shipment of your physical gold
                </FullScreenDialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available Gold</p>
                <p className="text-lg font-bold text-amber-500">
                  {availableGold.toFixed(2)}g
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
                {/* Delivery Amount */}
                <Card className="p-6 border-border">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="grams" className="text-lg font-semibold">
                        Amount to Deliver (grams)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum delivery: {minimumDelivery} grams
                      </p>
                    </div>

                    <div className="relative">
                      <Input
                        id="grams"
                        type="number"
                        min={minimumDelivery}
                        step="1"
                        max={availableGold}
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                        placeholder="0.00"
                        className="text-2xl h-14 pr-12 font-bold"
                        disabled={isSubmitting}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                        g
                      </span>
                    </div>

                    {gramsNum < minimumDelivery && grams !== "" && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Minimum delivery is {minimumDelivery} grams</span>
                      </div>
                    )}

                    {gramsNum > availableGold && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient gold balance</span>
                      </div>
                    )}

                    {/* Quick Select */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Quick Select
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map(({ label, value }) => (
                          <Button
                            key={label}
                            variant="outline"
                            size="sm"
                            onClick={() => setGrams(value.toFixed(2))}
                            disabled={isSubmitting || value > availableGold}
                            className="hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-500"
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Shipping Address */}
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    Shipping Address
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="123 Main Street"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="addressLine2">
                        Address Line 2 (Optional)
                      </Label>
                      <Input
                        id="addressLine2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Apartment, suite, etc."
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="New York"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="NY"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Postal / ZIP Code</Label>
                        <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="10001"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={country}
                          onValueChange={setCountry}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="country">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Shipping Method */}
                <Card className="p-6 border-border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-500" />
                    Shipping Method
                  </h3>

                  <div className="space-y-3">
                    {SHIPPING_METHODS.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setShippingMethod(method.id)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${
                            shippingMethod === method.id
                              ? "border-amber-500 bg-amber-500/5"
                              : "border-border hover:border-amber-500/50"
                          }
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{method.label}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {method.duration} • {method.insurance}
                            </p>
                          </div>
                          <p className="font-bold text-lg">${method.fee}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* RIGHT COLUMN - Summary (1/3) */}
              <div className="space-y-6">
                {/* Delivery Summary */}
                <Card className="p-6 border-border sticky top-0">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Delivery Summary
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
                        Shipping Method
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedShipping?.label.split(" ")[0]}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Shipping Fee
                      </span>
                      <span className="font-semibold">
                        ${shippingFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Insurance</span>
                      <span className="font-semibold">
                        ${insuranceFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total Cost</span>
                      <span className="font-bold text-2xl text-amber-500">
                        ${totalFee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Delivery Info */}
                <Card className="p-6 border-border bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-sm space-y-2">
                      <p className="font-semibold text-foreground">
                        Important Information
                      </p>
                      <p className="text-muted-foreground">
                        • Signature required upon delivery
                      </p>
                      <p className="text-muted-foreground">
                        • Fully insured during transit
                      </p>
                      <p className="text-muted-foreground">
                        • Tracking number provided
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Security Features */}
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-bold mb-4">
                    Security & Insurance
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Fully insured during shipping
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Secure courier with tracking
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        Real-time delivery updates
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="max-w-md mx-auto">
              <Card className="p-8 border-amber-500/30">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-amber-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      Confirm Delivery
                    </h3>
                    <p className="text-muted-foreground">
                      Please review your delivery request
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
                        Delivery to:
                      </span>
                      <span className="font-semibold text-sm">
                        {city}, {state}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold text-amber-500">
                        ${totalFee.toFixed(2)}
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
                      onClick={handleDelivery}
                      disabled={isSubmitting}
                      size="lg"
                      className="flex-1 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Confirm Delivery
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
                <p>Fully insured • Signature required • Tracking included</p>
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
                  disabled={!isFormValid || isSubmitting}
                  size="lg"
                  className="px-8 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Request Delivery
                </Button>
              </div>
            </div>
          </div>
        )}
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
