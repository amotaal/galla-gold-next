// components/modals/mfa-modal.tsx
// Purpose: 4-step 2FA setup modal (Welcome, Connect App, Verify Code, Backup Codes)

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smile, Smartphone, ShieldCheck, Key, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface MFAModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: 'Welcome', icon: Smile },
  { id: 2, name: 'Connect App', icon: Smartphone },
  { id: 3, name: 'Verify Code', icon: ShieldCheck },
  { id: 4, name: 'Backup Codes', icon: Key },
];

export function MFAModal({ open, onClose }: MFAModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [code, setCode] = useState('');

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleComplete = () => {
    // Submit 2FA setup
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : currentStep > step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Label */}
        <div className="text-center mt-2">
          {steps.map((step) =>
            currentStep === step.id ? (
              <div key={step.id} className="flex items-center justify-center gap-2">
                <span className="text-xs font-medium text-primary">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            ) : null
          )}
        </div>

        {/* Step Content */}
        <div className="py-8 min-h-[350px]">
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Smile className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h3>
                <p className="text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>

              <Alert className="bg-primary/10 border-primary/20 text-left">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  2FA protects your account even if your password is compromised. You'll need your phone to log in.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>✓ Protect your investments</p>
                <p>✓ Prevent unauthorized access</p>
                <p>✓ Required for large transactions</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Connect Authenticator App</h3>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code or enter the secret key manually to add your account.
                </p>
              </div>

              {/* Tab Buttons */}
              <div className="flex gap-2 justify-center bg-secondary/30 p-1 rounded-lg max-w-md mx-auto">
                <Button variant="ghost" className="flex-1 bg-background text-xs h-8">
                  <Smartphone className="w-3 h-3 mr-1" />
                  QR Code
                </Button>
                <Button variant="ghost" className="flex-1 text-xs h-8">
                  Manual Entry
                </Button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-lg p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-muted/20 rounded flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-2 grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-foreground/80 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>

              {/* Instructions */}
              <Alert className="bg-amber-500/10 border-amber-500/20">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs space-y-1">
                  <p className="font-medium">How to Scan</p>
                  <p>1. Open your authenticator app</p>
                  <p>2. Tap the '+' or 'Add Account' button</p>
                  <p>3. Choose 'Scan QR Code'</p>
                  <p>4. Point your camera at the code above</p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verify Authentication Code</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-lg bg-background/50" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-lg bg-background/50" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-lg bg-background/50" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-lg bg-background/50" />
                    <InputOTPSlot index={4} className="w-12 h-12 text-lg bg-background/50" />
                    <InputOTPSlot index={5} className="w-12 h-12 text-lg bg-background/50" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                The code changes every 30 seconds
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Save Your Backup Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Store these codes in a safe place. You can use them to access your account if you lose your phone.
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                  {['A1B2-C3D4-E5F6', 'G7H8-I9J0-K1L2', 'M3N4-O5P6-Q7R8', 'S9T0-U1V2-W3X4'].map((code, i) => (
                    <div key={i} className="bg-background/50 rounded p-2 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <Alert className="bg-red-500/10 border-red-500/20">
                <Info className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-xs">
                  <p className="font-medium mb-1">Important!</p>
                  <p>Each code can only be used once. Download or write them down now.</p>
                </AlertDescription>
              </Alert>

              <Button variant="outline" className="w-full">
                <Key className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
          {currentStep < 4 ? (
            <Button className="bg-primary hover:bg-primary/90 min-w-[200px]" onClick={handleNext}>
              Next: {steps[currentStep]?.name}
            </Button>
          ) : (
            <Button className="bg-green-500 hover:bg-green-600 min-w-[200px]" onClick={handleComplete}>
              Complete Setup
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Your security is our top priority
        </p>
      </DialogContent>
    </Dialog>
  );
}
