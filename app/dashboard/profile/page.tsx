// app/dashboard/profile/page.tsx
// Purpose: Account settings with Profile, Security, Notifications, and Appearance tabs

"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Shield, Bell, Palette, Loader2 } from "lucide-react";
import { KYCModal } from "@/components/modals/kyc-modal";
import { MFAModal } from "@/components/modals/mfa-modal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-md border border-border p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-card/60 backdrop-blur-md border-border p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-bold text-primary mb-4">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <h3 className="text-xl font-bold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge
                    variant="outline"
                    className="mt-3 bg-primary/10 text-primary border-primary/20"
                  >
                    {user.kycStatus === "verified" ? "Verified" : "Pending"}
                    {user.kycStatus === "verified" && " 2FA"}
                  </Badge>
                  <Button variant="outline" className="mt-4 w-full">
                    Change Avatar
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  <div
                    onClick={() => setShowKYCModal(true)}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Complete KYC</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Verify identity
                    </span>
                  </div>

                  <div
                    onClick={() => setShowMFAModal(true)}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 ring-1 ring-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Enable 2FA</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Secure account
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md border-border p-6">
                <h3 className="text-lg font-bold mb-6">Personal Information</h3>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        defaultValue={`${user.firstName} ${user.lastName}`}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        defaultValue={user.email}
                        disabled
                        className="bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        defaultValue={user.phone || "+1 (555) 123-4567"}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Street Address</Label>
                      <Input
                        placeholder="123 Main Street"
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        placeholder="New York"
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        placeholder="United States"
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Postal Code</Label>
                    <Input placeholder="10001" className="bg-background/50" />
                  </div>

                  <Button className="bg-primary hover:bg-primary/90">
                    <Shield className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </form>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" className="bg-background/50" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" className="bg-background/50" />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" className="bg-background/50" />
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  Update Password
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-6">
                Notification Preferences
              </h3>
              <p className="text-muted-foreground">
                Configure your notification settings
              </p>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="bg-card/60 backdrop-blur-md border-border p-6">
              <h3 className="text-lg font-bold mb-6">Appearance Settings</h3>
              <p className="text-muted-foreground">
                Customize your app appearance
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <KYCModal open={showKYCModal} onClose={() => setShowKYCModal(false)} />
      <MFAModal open={showMFAModal} onClose={() => setShowMFAModal(false)} />
    </div>
  );
}
