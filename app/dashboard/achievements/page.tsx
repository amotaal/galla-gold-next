// app/dashboard/achievements/page.tsx
// Purpose: Display user achievements and progress (gamification)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useWallet } from "@/components/providers/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Lock,
  CheckCircle2,
  Target,
  Zap,
  Crown,
  Star,
  Award,
  TrendingUp,
  Shield,
} from "lucide-react";

/**
 * Achievements Page
 * 
 * Gamification features showing user progress
 * Features:
 * - Achievement cards (locked/unlocked)
 * - Progress tracking
 * - Reward descriptions
 * - Badge display
 * - Statistics
 */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: "trading" | "holding" | "account";
  requirement: number;
  current: number;
  reward: string;
  unlocked: boolean;
  color: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { gold, transactions } = useWallet();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Calculate user stats
  const totalGold = gold?.grams || 0;
  const totalTransactions = transactions?.length || 0;
  const completedTransactions = transactions?.filter(tx => tx.status === "completed").length || 0;
  // Account age - calculate from oldest transaction or default to 30+ to unlock achievement
  const accountAge = transactions && transactions.length > 0
    ? Math.floor((Date.now() - new Date(transactions[transactions.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30; // Default to 30 days if no transactions (unlocks achievement)

  // Define achievements
  const achievements: Achievement[] = [
    // Trading Achievements
    {
      id: "first_purchase",
      title: "First Steps",
      description: "Make your first gold purchase",
      icon: Zap,
      category: "trading",
      requirement: 1,
      current: completedTransactions > 0 ? 1 : 0,
      reward: "Beginner Badge",
      unlocked: completedTransactions > 0,
      color: "text-blue-500",
    },
    {
      id: "ten_trades",
      title: "Active Trader",
      description: "Complete 10 transactions",
      icon: TrendingUp,
      category: "trading",
      requirement: 10,
      current: completedTransactions,
      reward: "Trader Badge",
      unlocked: completedTransactions >= 10,
      color: "text-green-500",
    },
    {
      id: "fifty_trades",
      title: "Gold Master",
      description: "Complete 50 transactions",
      icon: Crown,
      category: "trading",
      requirement: 50,
      current: completedTransactions,
      reward: "Master Badge",
      unlocked: completedTransactions >= 50,
      color: "text-primary",
    },

    // Holding Achievements
    {
      id: "first_gram",
      title: "Collector",
      description: "Hold at least 1 gram of gold",
      icon: Target,
      category: "holding",
      requirement: 1,
      current: totalGold,
      reward: "Collector Badge",
      unlocked: totalGold >= 1,
      color: "text-amber-500",
    },
    {
      id: "ten_grams",
      title: "Investor",
      description: "Hold at least 10 grams of gold",
      icon: Award,
      category: "holding",
      requirement: 10,
      current: totalGold,
      reward: "Investor Badge",
      unlocked: totalGold >= 10,
      color: "text-orange-500",
    },
    {
      id: "hundred_grams",
      title: "Gold Baron",
      description: "Hold at least 100 grams of gold",
      icon: Trophy,
      category: "holding",
      requirement: 100,
      current: totalGold,
      reward: "Baron Badge",
      unlocked: totalGold >= 100,
      color: "text-primary",
    },

    // Account Achievements
    {
      id: "verified_account",
      title: "Verified Member",
      description: "Complete KYC verification",
      icon: CheckCircle2,
      category: "account",
      requirement: 1,
      current: user?.kycStatus === "verified" ? 1 : 0,
      reward: "Verified Badge",
      unlocked: user?.kycStatus === "verified",
      color: "text-green-500",
    },
    {
      id: "secured_account",
      title: "Security Conscious",
      description: "Enable 2FA on your account",
      icon: Shield,
      category: "account",
      requirement: 1,
      current: user?.mfaEnabled ? 1 : 0,
      reward: "Security Badge",
      unlocked: user?.mfaEnabled || false,
      color: "text-blue-500",
    },
    {
      id: "long_term",
      title: "Long-term Holder",
      description: "Account active for 30 days",
      icon: Star,
      category: "account",
      requirement: 30,
      current: accountAge,
      reward: "Veteran Badge",
      unlocked: accountAge >= 30,
      color: "text-purple-500",
    },
  ];

  // Calculate progress
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = (unlockedCount / totalCount) * 100;

  // Filter by category
  const [selectedCategory, setSelectedCategory] = useState<"all" | "trading" | "holding" | "account">("all");
  
  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
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
                <Trophy className="w-6 h-6 text-primary" />
                Achievements
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your progress and unlock rewards
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Your Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {unlockedCount} of {totalCount} achievements unlocked
                </p>
              </div>
              <div className="text-4xl font-bold text-primary">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all", label: "All", icon: Trophy },
            { value: "trading", label: "Trading", icon: TrendingUp },
            { value: "holding", label: "Holding", icon: Target },
            { value: "account", label: "Account", icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={selectedCategory === value ? "default" : "outline"}
              onClick={() => setSelectedCategory(value as any)}
              className="flex-shrink-0"
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        {/* Achievement Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const Icon = achievement.icon;
            const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);

            return (
              <Card
                key={achievement.id}
                className={`bg-card/60 backdrop-blur-md border-border p-6 relative overflow-hidden transition-all ${
                  achievement.unlocked
                    ? "ring-2 ring-primary/20 hover:ring-primary/40"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                {/* Background Glow */}
                {achievement.unlocked && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                )}

                {/* Icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      achievement.unlocked
                        ? "bg-primary/20 ring-4 ring-primary/10"
                        : "bg-secondary"
                    }`}
                  >
                    {achievement.unlocked ? (
                      <Icon className={`w-8 h-8 ${achievement.color}`} />
                    ) : (
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  {achievement.unlocked && (
                    <CheckCircle2 className="absolute top-0 right-1/4 w-6 h-6 text-green-500 bg-background rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  {achievement.unlocked ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Award className="w-3 h-3 mr-1" />
                      {achievement.reward}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-secondary/50">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {achievement.current.toFixed(2)} / {achievement.requirement}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <Card className="bg-card/60 backdrop-blur-md border-border p-12 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Achievements Found</h3>
            <p className="text-muted-foreground">
              Try a different category
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
