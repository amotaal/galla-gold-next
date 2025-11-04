// /components/dialogs/mfa.tsx
// Premium MFA (Two-Factor Authentication) Dialog
// Purpose: Full-screen, multi-step 2FA setup with QR code, verification, and backup codes

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Smartphone,
  Key,
  CheckCircle2,
  Copy,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Loader2,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { setupMFAAction, verifyMFASetupAction } from "@/server/actions/mfa";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
} from "@/components/full-dialog";

interface MFADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// MFA Steps Configuration
const MFA_STEPS = [
  {
    id: 1,
    title: "Welcome",
    subtitle: "Secure Your Account",
    icon: Shield,
    color: "text-primary",
  },
  {
    id: 2,
    title: "Authenticator App",
    subtitle: "Scan QR Code",
    icon: QrCode,
    color: "text-blue-500",
  },
  {
    id: 3,
    title: "Verify",
    subtitle: "Enter Code",
    icon: ShieldCheck,
    color: "text-green-500",
  },
  {
    id: 4,
    title: "Backup Codes",
    subtitle: "Save Recovery Codes",
    icon: Key,
    color: "text-orange-500",
  },
];

// Popular authenticator apps
const AUTHENTICATOR_APPS = [
  {
    name: "Google Authenticator",
    ios: "https://apps.apple.com/app/google-authenticator/id388497605",
    android:
      "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
  },
  {
    name: "Microsoft Authenticator",
    ios: "https://apps.apple.com/app/microsoft-authenticator/id983156458",
    android:
      "https://play.google.com/store/apps/details?id=com.azure.authenticator",
  },
  {
    name: "Authy",
    ios: "https://apps.apple.com/app/authy/id494168017",
    android: "https://play.google.com/store/apps/details?id=com.authy.authy",
  },
];

export function MFADialog({ open, onOpenChange }: MFADialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // MFA Setup Data
  const [mfaSecret, setMfaSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");

  // Initialize MFA Setup on dialog open
  useEffect(() => {
    if (open && currentStep === 1) {
      initializeMFASetup();
    }
  }, [open]);

  // Initialize MFA Setup (Generate QR Code)
  const initializeMFASetup = async () => {
    setIsLoading(true);
    try {
      const result = await setupMFAAction();

      if (result.success && result.data) {
        setMfaSecret(result.data.secret);
        setQrCodeUrl(result.data.qrCode);
        setBackupCodes(result.data.backupCodes);

        // Format secret for manual entry (XXXX-XXXX-XXXX-XXXX)
        const formatted =
          result.data.secret.match(/.{1,4}/g)?.join("-") || result.data.secret;
        setManualEntryKey(formatted);
      } else {
        toast.error("Setup Failed", {
          description: result.error || "Unable to initialize 2FA setup",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("MFA initialization error:", error);
      toast.error("Setup Failed", {
        description: "An unexpected error occurred",
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate steps
  const goToNextStep = () => {
    if (currentStep < MFA_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Verify 2FA Code
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Invalid Code", {
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("secret", mfaSecret);
      formData.append("token", verificationCode);
      formData.append("backupCodes", JSON.stringify(backupCodes));

      const result = await verifyMFASetupAction(formData);

      if (result.success) {
        toast.success("2FA Enabled!", {
          description: "Two-factor authentication is now active",
        });
        goToNextStep();
      } else {
        toast.error("Verification Failed", {
          description: result.error || "Invalid code. Please try again.",
        });
        setVerificationCode("");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification Failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", {
      description: `${label} copied to clipboard`,
    });
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = `GALLA GOLD - BACKUP CODES
Generated: ${new Date().toLocaleDateString()}

⚠️ IMPORTANT: Keep these codes in a safe place!
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

If you lose access to your authenticator app, you can use these codes to sign in.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `galla-gold-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Downloaded", {
      description: "Backup codes saved to file",
    });
  };

  // Complete setup
  const handleComplete = () => {
    onOpenChange(false);
    // Reset state
    setTimeout(() => {
      setCurrentStep(1);
      setVerificationCode("");
      setMfaSecret("");
      setQrCodeUrl("");
      setBackupCodes([]);
    }, 300);
  };

  // Can proceed check
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !isLoading && mfaSecret && qrCodeUrl;
      case 2:
        return true; // Can always proceed from QR code step
      case 3:
        return verificationCode.length === 6;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent className="p-0">
        {/* Header with Progress */}
        <FullScreenDialogHeader>
          <FullScreenDialogTitle>
            Multi-Factor Authentication
          </FullScreenDialogTitle>
          <FullScreenDialogDescription>
            Step {currentStep} of {MFA_STEPS.length}
          </FullScreenDialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of {MFA_STEPS.length}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1">
              {MFA_STEPS.map((step, index) => (
                <div key={step.id} className="flex-1 flex items-center gap-1">
                  {/* Step Bar */}
                  <div
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      currentStep >= step.id ? "bg-primary" : "bg-border"
                    )}
                  />

                  {/* Step Dot */}
                  {index < MFA_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-500",
                        currentStep > step.id
                          ? "bg-primary scale-100"
                          : "bg-border scale-75"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex items-start justify-between mt-2">
              {MFA_STEPS.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center gap-1 flex-1",
                      "transition-opacity duration-300",
                      currentStep === step.id ? "opacity-100" : "opacity-50"
                    )}
                  >
                    <StepIcon
                      className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        currentStep >= step.id
                          ? step.color
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-[10px] text-center font-medium hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </FullScreenDialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-2xl mx-auto">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoading ? (
                  <div className="py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Generating secure keys...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Shield className="w-10 h-10 text-primary" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">
                        Secure Your Account with 2FA
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Add an extra layer of security to protect your gold
                        holdings and transactions
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 mt-8">
                      <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                        <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">
                          Enhanced Security
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Protect against unauthorized access
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                        <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">Always Available</h4>
                        <p className="text-xs text-muted-foreground">
                          Works offline on your device
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                        <Key className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">Backup Codes</h4>
                        <p className="text-xs text-muted-foreground">
                          Recovery options included
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-left">
                          <h4 className="font-semibold text-sm mb-1">
                            What You'll Need:
                          </h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>
                              • An authenticator app (Google Authenticator,
                              Authy, or similar)
                            </li>
                            <li>• Your smartphone to scan a QR code</li>
                            <li>• About 2-3 minutes to complete setup</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Scan QR Code */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold">
                    Scan QR Code with Your Authenticator App
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use your authenticator app to scan this code
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="flex flex-col items-center gap-6">
                  {qrCodeUrl && (
                    <div className="p-6 bg-white rounded-xl border-4 border-primary/20 shadow-lg">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for 2FA"
                        className="w-64 h-64"
                      />
                    </div>
                  )}

                  {/* Manual Entry Option */}
                  <div className="w-full max-w-md">
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Can't scan? Enter manually:
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(mfaSecret, "Setup key")
                          }
                          className="gap-2"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                      </div>
                      <code className="block text-xs font-mono bg-background/50 p-3 rounded border border-border/50 break-all">
                        {manualEntryKey}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Authenticator App Recommendations */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">
                    Recommended Authenticator Apps:
                  </h4>
                  <div className="space-y-2">
                    {AUTHENTICATOR_APPS.map((app) => (
                      <div
                        key={app.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{app.name}</span>
                        <div className="flex gap-2">
                          <a
                            href={app.ios}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            iOS
                          </a>
                          <span className="text-muted-foreground">•</span>
                          <a
                            href={app.android}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Android
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Verify Code */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold">Enter Verification Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {/* OTP Input */}
                  <div className="space-y-4">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>

                    <p className="text-xs text-muted-foreground text-center">
                      Codes refresh every 30 seconds
                    </p>
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || isSubmitting}
                    className="w-full max-w-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify & Continue
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Verification Tips:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>
                          • Make sure your device's time is synced correctly
                        </li>
                        <li>• Codes are case-sensitive (numbers only)</li>
                        <li>
                          • If a code doesn't work, wait for the next one to
                          generate
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Backup Codes */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold">
                    2FA Enabled Successfully! 🎉
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Save these backup codes in a secure location
                  </p>
                </div>

                {/* Backup Codes Grid */}
                <div className="bg-card/50 border border-border/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Key className="w-4 h-4 text-orange-500" />
                      Your Backup Codes
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            backupCodes.join("\n"),
                            "Backup codes"
                          )
                        }
                        className="gap-2"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadBackupCodes}
                        className="gap-2"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-background/50 rounded border border-border/50"
                      >
                        <span className="text-xs text-muted-foreground font-medium">
                          {index + 1}.
                        </span>
                        <code className="text-sm font-mono flex-1">{code}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Warning */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1 text-orange-500">
                        Important: Save These Codes!
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>
                          • Each code can only be used <strong>once</strong>
                        </li>
                        <li>
                          • Use them to sign in if you lose access to your
                          authenticator app
                        </li>
                        <li>
                          • Store them in a password manager or safe location
                        </li>
                        <li>
                          • You won't be able to see these codes again after
                          closing this dialog
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Success Info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">What Happens Next?</p>
                      <p className="text-xs text-muted-foreground">
                        From now on, you'll need to enter a code from your
                        authenticator app every time you sign in to Galla Gold.
                        This adds an extra layer of security to protect your
                        account and gold holdings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {currentStep === 4 ? (
              // Final step - only show Complete button
              <div className="w-full flex justify-center">
                <Button
                  onClick={handleComplete}
                  className="gap-2 min-w-[200px] bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Complete Setup
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1 || isLoading}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                {currentStep < 3 && (
                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceed()}
                    className="gap-2 min-w-[120px]"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
