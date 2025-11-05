// /components/dialogs/kyc.tsx
// KYC Verification Dialog - Full-Screen Professional Design with Better Space Utilization
// Purpose: Complete 4-step KYC verification (Personal Info, ID Upload, Address Proof, Review)

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Shield,
  User,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Loader2,
  Info,
} from "lucide-react";
import { submitKYCAction } from "@/server/actions/kyc";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth";
import { cn } from "@/lib/utils";

interface KYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Step configuration with better organization
const KYC_STEPS = [
  { id: 1, title: "Personal Info", icon: User, color: "text-blue-500" },
  { id: 2, title: "ID Document", icon: CreditCard, color: "text-green-500" },
  { id: 3, title: "Address Proof", icon: FileText, color: "text-purple-500" },
  { id: 4, title: "Review", icon: CheckCircle2, color: "text-primary" },
];

export function KYCDialog({ open, onOpenChange }: KYCDialogProps) {
  const { user, refetch } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state - organized by step
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    addressProof: null as File | null,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setPersonalInfo({
        fullName: "",
        dateOfBirth: "",
        nationality: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
      });
      setDocuments({
        idFront: null,
        idBack: null,
        addressProof: null,
      });
      setIsSubmitting(false);
    }
  }, [open]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // File upload handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof documents
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 10MB",
        });
        return;
      }

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type", {
          description: "Please upload JPG, PNG, or PDF files only",
        });
        return;
      }

      setDocuments((prev) => ({ ...prev, [field]: file }));
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Add personal info
      Object.entries(personalInfo).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add documents
      if (documents.idFront) formData.append("idFront", documents.idFront);
      if (documents.idBack) formData.append("idBack", documents.idBack);
      if (documents.addressProof)
        formData.append("addressProof", documents.addressProof);

      const result = await submitKYCAction(formData);

      if (result.success) {
        toast.success("KYC submitted successfully!", {
          description: "Your documents are under review",
        });
        await refetch();
        onOpenChange(false);
      } else {
        toast.error("Submission failed", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("Submission failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation checks per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          personalInfo.fullName &&
          personalInfo.dateOfBirth &&
          personalInfo.nationality
        );
      case 2:
        return !!(documents.idFront && documents.idBack);
      case 3:
        return !!documents.addressProof;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent className="p-0">
        {/* Fixed Header with Progress */}
        <div className="shrink-0 border-b border-border bg-card/50 px-6 py-6">
          <FullScreenDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-blue-600/20">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-2xl">
                  Identity Verification
                </FullScreenDialogTitle>
                <FullScreenDialogDescription>
                  Complete your KYC to unlock all features
                </FullScreenDialogDescription>
              </div>
            </div>

            {/* Progress Bar - Horizontal with better spacing */}
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between gap-2">
                {KYC_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      {/* Step Circle */}
                      <div className="flex flex-col items-center gap-2 min-w-[100px]">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                            isActive &&
                              "bg-primary ring-4 ring-primary/20 scale-110",
                            isCompleted && "bg-primary",
                            !isActive && !isCompleted && "bg-secondary"
                          )}
                        >
                          <StepIcon
                            className={cn(
                              "w-6 h-6 transition-colors",
                              (isActive || isCompleted) &&
                                "text-primary-foreground",
                              !isActive &&
                                !isCompleted &&
                                "text-muted-foreground"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium text-center",
                            isActive && "text-primary",
                            !isActive && "text-muted-foreground"
                          )}
                        >
                          {step.title}
                        </span>
                      </div>

                      {/* Connector Line */}
                      {index < KYC_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-1 rounded-full mx-2 transition-colors duration-300",
                            currentStep > step.id ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </FullScreenDialogHeader>
        </div>

        {/* Content Area - Better space utilization */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-5xl mx-auto">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                  <Card className="bg-card/60 backdrop-blur-md border-border p-6 space-y-4">
                    <h3 className="text-lg font-bold mb-4">
                      Basic Information
                    </h3>

                    <div>
                      <Label htmlFor="fullName">Full Legal Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="As shown on your ID"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            fullName: e.target.value,
                          })
                        }
                        className="bg-background/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={personalInfo.dateOfBirth}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              dateOfBirth: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Select
                          value={personalInfo.nationality}
                          onValueChange={(value) =>
                            setPersonalInfo({
                              ...personalInfo,
                              nationality: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="eg">Egypt</SelectItem>
                            <SelectItem value="ae">
                              United Arab Emirates
                            </SelectItem>
                            <SelectItem value="sa">Saudi Arabia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={personalInfo.address}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            address: e.target.value,
                          })
                        }
                        className="bg-background/50"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={personalInfo.city}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              city: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          placeholder="USA"
                          value={personalInfo.country}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              country: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          placeholder="10001"
                          value={personalInfo.postalCode}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              postalCode: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Right Column - Info */}
                  <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                    <h3 className="text-lg font-bold mb-4">Why We Need This</h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Regulatory Compliance
                          </p>
                          <p className="text-xs text-muted-foreground">
                            We're required by law to verify your identity to
                            prevent fraud and comply with international
                            anti-money laundering regulations.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                        <p className="text-sm font-semibold">
                          What you'll unlock:
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Buy and sell gold
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Request physical delivery
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Higher transaction limits
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Full account features
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-500 font-medium mb-1">
                          Data Security
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your information is encrypted and stored securely. We
                          never share your data with third parties.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 2: ID Document */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column - Upload */}
                  <div className="space-y-6">
                    <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                      <h3 className="text-lg font-bold mb-4">Front of ID</h3>

                      <label
                        htmlFor="idFront"
                        className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <input
                          id="idFront"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "idFront")}
                          className="hidden"
                        />
                        {documents.idFront ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                            <p className="font-medium">
                              {documents.idFront.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click to change
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG, or PDF (max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                      <h3 className="text-lg font-bold mb-4">Back of ID</h3>

                      <label
                        htmlFor="idBack"
                        className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <input
                          id="idBack"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "idBack")}
                          className="hidden"
                        />
                        {documents.idBack ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                            <p className="font-medium">
                              {documents.idBack.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click to change
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG, or PDF (max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </Card>
                  </div>

                  {/* Right Column - Instructions */}
                  <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                    <h3 className="text-lg font-bold mb-4">
                      Document Guidelines
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">
                          Accepted Documents:
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Passport
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            National ID Card
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Driver's License
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm font-semibold mb-2">
                          Photo Requirements:
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>• Clear, in-focus image</li>
                          <li>• All text must be readable</li>
                          <li>• No glare or shadows</li>
                          <li>• Full document visible</li>
                          <li>• Not expired</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-500 mb-1">
                              Common Mistakes
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avoid blurry photos, covered corners, or documents
                              that have been edited or altered in any way.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 3: Address Proof */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column - Upload */}
                  <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                    <h3 className="text-lg font-bold mb-4">Proof of Address</h3>

                    <label
                      htmlFor="addressProof"
                      className="block border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <input
                        id="addressProof"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, "addressProof")}
                        className="hidden"
                      />
                      {documents.addressProof ? (
                        <div className="space-y-3">
                          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                          <p className="font-medium text-lg">
                            {documents.addressProof.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click to change document
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                          <p className="font-medium text-lg">Click to upload</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, or PDF (max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </Card>

                  {/* Right Column - Info */}
                  <Card className="bg-card/60 backdrop-blur-md border-border p-6">
                    <h3 className="text-lg font-bold mb-4">
                      Document Requirements
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">
                          Accepted Documents:
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Utility bill (electricity, water, gas)
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Bank statement
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Government-issued document
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Tax document
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm font-semibold mb-2">
                          Document Must Show:
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>• Your full name</li>
                          <li>• Your current address</li>
                          <li>• Issue date (within last 3 months)</li>
                          <li>• Issuer name/logo visible</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-500 mb-1">
                              Important Note
                            </p>
                            <p className="text-xs text-muted-foreground">
                              The address on this document must match the
                              address you provided in Step 1. Document must be
                              less than 3 months old.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-card/60 backdrop-blur-md border-border p-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Review Your Information
                    </h3>
                    <p className="text-muted-foreground">
                      Please verify all details before submitting
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Personal Info Summary */}
                    <div className="space-y-3 p-6 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">Personal Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">
                            {personalInfo.fullName || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Date of Birth:
                          </span>
                          <span className="font-medium">
                            {personalInfo.dateOfBirth || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Nationality:
                          </span>
                          <span className="font-medium">
                            {personalInfo.nationality || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Address:
                          </span>
                          <span className="font-medium text-right">
                            {personalInfo.address || "-"}
                            {personalInfo.city && `, ${personalInfo.city}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Documents Summary */}
                    <div className="space-y-3 p-6 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold">Documents Uploaded</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            ID Front:
                          </span>
                          <div className="flex items-center gap-2">
                            {documents.idFront ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Uploaded</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-500">Missing</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            ID Back:
                          </span>
                          <div className="flex items-center gap-2">
                            {documents.idBack ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Uploaded</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-500">Missing</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Address Proof:
                          </span>
                          <div className="flex items-center gap-2">
                            {documents.addressProof ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Uploaded</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-500">Missing</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-500 mb-1">
                          Next Steps
                        </p>
                        <p className="text-muted-foreground">
                          After submission, our team will review your documents
                          within 24-48 hours. You'll receive an email
                          notification once your verification is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Navigation */}
        <div className="shrink-0 border-t border-border bg-card/50 p-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {KYC_STEPS.length}
            </div>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Back
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep) || isSubmitting}
                  size="lg"
                  className="px-8 bg-primary hover:bg-primary/90"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isStepValid(currentStep)}
                  size="lg"
                  className="px-8 bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
