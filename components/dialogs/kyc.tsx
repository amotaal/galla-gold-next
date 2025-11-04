// /components/dialogs/kyc.tsx
// KYC Verification Dialog - Premium Gold Theme
// Purpose: Multi-step identity verification with gold fintech design

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
  MapPin,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { submitKYCAction } from "@/server/actions/kyc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KYCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Address", icon: MapPin },
  { id: 3, name: "ID Document", icon: CreditCard },
  { id: 4, name: "Proof of Address", icon: FileText },
  { id: 5, name: "Review", icon: CheckCircle2 },
];

const COUNTRIES = [
  { code: "EG", name: "Egypt" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
];

const SOURCE_OF_FUNDS = [
  { value: "employment", label: "Employment" },
  { value: "business", label: "Business Ownership" },
  { value: "investment", label: "Investments" },
  { value: "inheritance", label: "Inheritance" },
  { value: "other", label: "Other" },
];

const ID_TYPES = [
  { value: "national_id", label: "National ID Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

const PROOF_TYPES = [
  { value: "bank_statement", label: "Bank Statement" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "rental_agreement", label: "Rental Agreement" },
];

export function KYCDialog({ open, onOpenChange }: KYCDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    nationality: "EG",
    occupation: "",
    sourceOfFunds: "employment",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "EG",
    idType: "national_id",
    idNumber: "",
    idExpiry: "",
    idFrontFile: null as File | null,
    idBackFile: null as File | null,
    proofType: "bank_statement",
    proofFile: null as File | null,
  });

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setIsSubmitting(false);
    }
  }, [open]);

  const updateFormData = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      updateFormData(field, file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (
          !formData.fullName ||
          !formData.dateOfBirth ||
          !formData.occupation
        ) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      case 2:
        if (!formData.street || !formData.city || !formData.country) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      case 3:
        if (
          !formData.idNumber ||
          !formData.idExpiry ||
          !formData.idFrontFile ||
          !formData.idBackFile
        ) {
          toast.error(
            "Please fill in all required fields and upload documents"
          );
          return false;
        }
        return true;
      case 4:
        if (!formData.proofFile) {
          toast.error("Please upload proof of address");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const formDataToSend = new FormData();

      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append(
        "dateOfBirth",
        new Date(formData.dateOfBirth).toISOString()
      );
      formDataToSend.append("nationality", formData.nationality);
      formDataToSend.append("occupation", formData.occupation);
      formDataToSend.append("sourceOfFunds", formData.sourceOfFunds);

      formDataToSend.append("street", formData.street);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("state", formData.state || "");
      formDataToSend.append("postalCode", formData.postalCode || "");
      formDataToSend.append("country", formData.country);

      formDataToSend.append("documents[0][type]", formData.idType);
      formDataToSend.append("documents[0][documentNumber]", formData.idNumber);
      formDataToSend.append(
        "documents[0][expiryDate]",
        new Date(formData.idExpiry).toISOString()
      );
      formDataToSend.append(
        "documents[0][frontImage]",
        formData.idFrontFile as File
      );
      formDataToSend.append(
        "documents[0][backImage]",
        formData.idBackFile as File
      );

      formDataToSend.append("documents[1][type]", formData.proofType);
      formDataToSend.append("documents[1][documentNumber]", "N/A");
      formDataToSend.append(
        "documents[1][expiryDate]",
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      );
      formDataToSend.append(
        "documents[1][frontImage]",
        formData.proofFile as File
      );

      const result = await submitKYCAction(formDataToSend);

      if (result.success) {
        toast.success("KYC verification submitted successfully!");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent className="p-0 bg-background">
        <FullScreenDialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-xl">
                  KYC Verification
                </FullScreenDialogTitle>
                <FullScreenDialogDescription className="text-sm">
                  Step {currentStep} of {STEPS.length}
                </FullScreenDialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {STEPS.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all",
                      currentStep === step.id
                        ? "bg-linear-to-br from-[#FFD700] to-[#FFC107] text-black shadow-lg shadow-[#FFD700]/20"
                        : currentStep > step.id
                        ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden lg:inline",
                      currentStep === step.id
                        ? "text-[#FFD700]"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-linear-to-r from-[#FFD700] to-[#FFC107] rounded-full transition-all duration-500 shadow-lg shadow-[#FFD700]/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </FullScreenDialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {currentStep === 1 && (
              <Step1PersonalInfo
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <Step2Address
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <Step3IDDocument
                formData={formData}
                updateFormData={updateFormData}
                handleFileUpload={handleFileUpload}
              />
            )}
            {currentStep === 4 && (
              <Step4ProofOfAddress
                formData={formData}
                updateFormData={updateFormData}
                handleFileUpload={handleFileUpload}
              />
            )}
            {currentStep === 5 && <Step5Review formData={formData} />}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="border-border hover:bg-accent"
            >
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-linear-to-r from-[#FFD700] to-[#FFC107] text-black hover:from-[#FFC107] hover:to-[#FFB800] font-semibold shadow-lg shadow-[#FFD700]/20"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-linear-to-r from-[#FFD700] to-[#FFC107] text-black hover:from-[#FFC107] hover:to-[#FFB800] font-semibold shadow-lg shadow-[#FFD700]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            )}
          </div>
        </div>
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}

function Step1PersonalInfo({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
          <User className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Please provide your legal name and date of birth
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Legal Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData("fullName", e.target.value)}
            placeholder="As shown on your ID"
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality *</Label>
            <Select
              value={formData.nationality}
              onValueChange={(v) => updateFormData("nationality", v)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation *</Label>
          <Input
            id="occupation"
            value={formData.occupation}
            onChange={(e) => updateFormData("occupation", e.target.value)}
            placeholder="e.g., Software Engineer"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sourceOfFunds">Source of Funds *</Label>
          <Select
            value={formData.sourceOfFunds}
            onValueChange={(v) => updateFormData("sourceOfFunds", v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OF_FUNDS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step2Address({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
          <MapPin className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold">Residential Address</h2>
        <p className="text-sm text-muted-foreground">
          Your current residential address
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="street">Street Address *</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => updateFormData("street", e.target.value)}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData("city", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateFormData("state", e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => updateFormData("postalCode", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={(v) => updateFormData("country", v)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3IDDocument({ formData, updateFormData, handleFileUpload }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold">Photo ID Document</h2>
        <p className="text-sm text-muted-foreground">
          Upload a government-issued photo ID
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select
            value={formData.idType}
            onValueChange={(v) => updateFormData("idType", v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Document Number *</Label>
            <Input
              value={formData.idNumber}
              onChange={(e) => updateFormData("idNumber", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Expiry Date *</Label>
            <Input
              type="date"
              value={formData.idExpiry}
              onChange={(e) => updateFormData("idExpiry", e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Front of Document *</Label>
            <div className="relative border-2 border-dashed border-border hover:border-[#FFD700] rounded-lg p-8 text-center transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload("idFrontFile", e)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-[#FFD700]" />
              <p className="text-sm">
                {formData.idFrontFile
                  ? formData.idFrontFile.name
                  : "Click to upload"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Back of Document *</Label>
            <div className="relative border-2 border-dashed border-border hover:border-[#FFD700] rounded-lg p-8 text-center transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload("idBackFile", e)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-[#FFD700]" />
              <p className="text-sm">
                {formData.idBackFile
                  ? formData.idBackFile.name
                  : "Click to upload"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4ProofOfAddress({
  formData,
  updateFormData,
  handleFileUpload,
}: any) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
          <FileText className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold">Proof of Address</h2>
        <p className="text-sm text-muted-foreground">
          Upload a recent utility bill or bank statement
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select
            value={formData.proofType}
            onValueChange={(v) => updateFormData("proofType", v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROOF_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Upload Document *</Label>
          <div className="relative border-2 border-dashed border-border hover:border-[#FFD700] rounded-lg p-12 text-center transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload("proofFile", e)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-[#FFD700]" />
            <p className="text-sm">
              {formData.proofFile ? formData.proofFile.name : "Click to upload"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5Review({ formData }: any) {
  const getCountryName = (code: string) =>
    COUNTRIES.find((c) => c.code === code)?.name || code;
  const getIDTypeName = (value: string) =>
    ID_TYPES.find((t) => t.value === value)?.label || value;
  const getProofTypeName = (value: string) =>
    PROOF_TYPES.find((t) => t.value === value)?.label || value;
  const getSourceName = (value: string) =>
    SOURCE_OF_FUNDS.find((s) => s.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-[#FFD700] to-[#FFC107] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Please review your information before submitting
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#FFD700]" />
            <h3 className="font-semibold text-lg">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{formData.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formData.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nationality</p>
              <p className="font-medium">
                {getCountryName(formData.nationality)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Occupation</p>
              <p className="font-medium">{formData.occupation}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Source of Funds</p>
              <p className="font-medium">
                {getSourceName(formData.sourceOfFunds)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#FFD700]" />
            <h3 className="font-semibold text-lg">Address</h3>
          </div>
          <p className="text-sm">
            {formData.street}
            <br />
            {formData.city}
            {formData.state && `, ${formData.state}`} {formData.postalCode}
            <br />
            {getCountryName(formData.country)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#FFD700]" />
            <h3 className="font-semibold text-lg">Documents</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">ID Document</p>
              <p className="font-medium">
                {getIDTypeName(formData.idType)} - {formData.idNumber}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Proof of Address</p>
              <p className="font-medium">
                {getProofTypeName(formData.proofType)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
