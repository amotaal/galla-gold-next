// components/modals/kyc-modal.tsx
// Purpose: 5-step KYC verification modal (Personal Info, ID Card, Proof of Address, Photo, Review)

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CreditCard, FileText, Camera, Shield, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KYCModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, name: 'Personal Information', icon: User },
  { id: 2, name: 'Identity Card', icon: CreditCard },
  { id: 3, name: 'Proof of Address', icon: FileText },
  { id: 4, name: 'Photo', icon: Camera },
  { id: 5, name: 'Review', icon: Shield },
];

export function KYCModal({ open, onClose }: KYCModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card/95 backdrop-blur-xl border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="text-center pb-4 border-b border-border">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Identity Verification</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete your identity verification to unlock all features
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-6 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div className={`flex-1 h-0.5 ${currentStep > index ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-2 transition-all ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : currentStep > step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
              <span className="text-xs mt-2 text-center hidden md:block">{step.name}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-6 min-h-[300px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Full Legal Name *</h3>
              <Input placeholder="As shown on your ID" className="bg-background/50" />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth *</Label>
                  <Input type="date" placeholder="dd/mm/yyyy" className="bg-background/50" />
                </div>
                <div>
                  <Label>Nationality *</Label>
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="eg">Egypt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  We are required by law to verify your identity to prevent fraud and comply with international regulations.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Upload Identity Document</h3>
              <p className="text-sm text-muted-foreground">
                Please upload a clear photo of your government-issued ID
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Front Side</p>
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Back Side</p>
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Proof of Address</h3>
              <p className="text-sm text-muted-foreground">
                Upload a recent utility bill or bank statement (less than 3 months old)
              </p>

              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload document</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (max 10MB)</p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Take a Selfie</h3>
              <p className="text-sm text-muted-foreground">
                Hold your ID next to your face and take a clear photo
              </p>

              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">Click to take photo</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure your face is clearly visible</p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Review & Submit</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please review your information before submitting
              </p>

              <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Full Name:</span>
                  <span className="text-sm font-medium">John Doe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date of Birth:</span>
                  <span className="text-sm font-medium">01/01/1990</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nationality:</span>
                  <span className="text-sm font-medium">United States</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Documents:</span>
                  <span className="text-sm font-medium">3 uploaded</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-4">
                Your data is encrypted and stored securely
              </p>
            </div>
          )}
        </div>

        {/* Footer with Step Indicator and Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 5
          </div>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={currentStep === 5 ? onClose : handleNext}
            >
              {currentStep === 5 ? 'Continue' : 'Next: Verify Code'}
              {currentStep < 5 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
