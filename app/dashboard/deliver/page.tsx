// app/dashboard/deliver/page.tsx
// Purpose: Request physical gold delivery to user's address

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
import { requestPhysicalDeliveryAction } from "@/server/actions/gold";
import {
  ArrowLeft,
  Package,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Truck,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Physical Delivery Page
 * 
 * Request delivery of physical gold
 * Features:
 * - Gold balance display
 * - Delivery address form
 * - Shipping options (standard/express/insured)
 * - Cost calculator
 * - Estimated delivery date
 * - KYC requirement check
 */
export default function DeliverPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { gold, refetchAll } = useWallet();
  const { toast } = useToast();

  // Form state
  const [grams, setGrams] = useState("");
  const [deliveryType, setDeliveryType] = useState<"standard" | "express" | "insured">("standard");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check authentication and KYC
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Calculate delivery cost and date
  const gramsNum = parseFloat(grams) || 0;
  const deliveryCosts = {
    standard: 25,
    express: 50,
    insured: 75,
  };
  const deliveryCost = deliveryCosts[deliveryType];

  const deliveryDays = {
    standard: 7,
    express: 3,
    insured: 5,
  };
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays[deliveryType]);

  // Available gold balance
  const availableGold = gold?.grams || 0;

  // Minimum delivery amount
  const minimumGrams = 1;

  // Check KYC status
  const isKYCVerified = user?.kycStatus === "verified";

  // Handle delivery request
  const handleDelivery = async () => {
    if (!isKYCVerified) {
      toast({
        title: "KYC Required",
        description: "Please complete identity verification to request physical delivery",
        variant: "destructive",
      });
      return;
    }

    if (gramsNum < minimumGrams) {
      toast({
        title: "Minimum Amount",
        description: `Minimum delivery amount is ${minimumGrams} gram`,
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

    if (!street || !city || !state || !postalCode || !country) {
      toast({
        title: "Missing Address",
        description: "Please fill in all address fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("grams", gramsNum.toString());
      formData.append("deliveryType", deliveryType);
      formData.append("street", street);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("postalCode", postalCode);
      formData.append("country", country);

      const result = await requestPhysicalDeliveryAction(formData);

      if (result.success) {
        toast({
          title: "Delivery Requested!",
          description: result.message,
        });

        // Refresh wallet data
        await refetchAll();

        // Reset form
        setGrams("");
        setShowConfirmation(false);

        // Navigate to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        toast({
          title: "Request Failed",
          description: result.error || "Failed to request delivery",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delivery request error:", error);
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
                <Package className="w-6 h-6 text-amber-500" />
                Physical Delivery
              </h1>
              <p className="text-sm text-muted-foreground">
                Request shipment of your gold
              </p>
            </div>
          </div>
          {isKYCVerified ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              KYC Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <ShieldAlert className="w-3 h-3 mr-1" />
              KYC Required
            </Badge>
          )}
        </div>
      </div>

      {/* KYC Warning */}
      {!isKYCVerified && (
        <div className="max-w-7xl mx-auto p-6">
          <Card className="bg-amber-500/10 border-amber-500/20 p-6">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">Identity Verification Required</h3>
                <p className="text-muted-foreground mb-4">
                  For security and regulatory compliance, you must complete KYC verification before requesting physical delivery of gold.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/profile")}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Complete KYC Now
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <Card className={`bg-card/60 backdrop-blur-md border-border p-6 ${!isKYCVerified ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-6">
              {/* Available Gold */}
              <div className="bg-linear-to-br from-amber-500/10 to-amber-600/10 rounded-lg p-4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Available Gold
                  </span>
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-500">
                  {availableGold.toFixed(6)} g
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="grams">Amount to Deliver (grams)</Label>
                <Input
                  id="grams"
                  type="number"
                  step="0.000001"
                  min={minimumGrams}
                  max={availableGold}
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  placeholder="0.000000"
                  className="bg-background/50 text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: {minimumGrams} gram
                </p>
              </div>

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <div className="grid gap-2">
                  {[
                    { value: "standard", label: "Standard", days: 7, price: 25, icon: Truck },
                    { value: "express", label: "Express", days: 3, price: 50, icon: Clock },
                    { value: "insured", label: "Insured", days: 5, price: 75, icon: ShieldAlert },
                  ].map(({ value, label, days, price, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setDeliveryType(value as any)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        deliveryType === value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/50 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${deliveryType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-left">
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{days} business days</p>
                        </div>
                      </div>
                      <span className="font-bold">${price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Address
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main Street"
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="NY"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10001"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country" className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={
                  !isKYCVerified ||
                  !grams ||
                  gramsNum < minimumGrams ||
                  gramsNum > availableGold ||
                  !street ||
                  !city ||
                  !state ||
                  !postalCode ||
                  isSubmitting
                }
                className="w-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Review Request
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Delivery Summary */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-4">Delivery Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gold Amount</span>
                  <span className="font-medium">{gramsNum.toFixed(6)} g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Cost</span>
                  <span className="font-medium">${deliveryCost}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span className="font-medium">
                    {estimatedDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold">Total Cost</span>
                  <span className="text-xl font-bold text-primary">
                    ${deliveryCost}
                  </span>
                </div>
              </div>
            </Card>

            {/* Important Info */}
            <Card className="bg-blue-500/10 backdrop-blur-md border-blue-500/20 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-500">
                <AlertCircle className="w-4 h-4" />
                Important Information
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gold will be deducted from your account immediately</li>
                <li>• Delivery requires signature upon receipt</li>
                <li>• Insured option includes $100,000 coverage</li>
                <li>• Track your shipment via email updates</li>
                <li>• Contact support for international deliveries</li>
              </ul>
            </Card>

            {/* Security Info */}
            <Card className="bg-card/60 backdrop-blur-md border-border p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Secure Delivery
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Discreet packaging with no external markings</li>
                <li>• GPS-tracked throughout delivery</li>
                <li>• Tamper-evident seals on all packages</li>
                <li>• 24/7 customer support during transit</li>
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
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Please review your delivery details
              </p>
            </div>

            <div className="space-y-3 bg-secondary/30 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivering</span>
                <span className="font-medium">{gramsNum.toFixed(6)} g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Cost</span>
                <span className="font-medium">${deliveryCost}</span>
              </div>
              <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                <p>To: {street}</p>
                <p>{city}, {state} {postalCode}</p>
                <p>{country}</p>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Est. Delivery</span>
                <span className="font-medium">{estimatedDate.toLocaleDateString()}</span>
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
                onClick={handleDelivery}
                disabled={isSubmitting}
                className="flex-1 bg-linear-to-r from-amber-500 to-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Request
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
