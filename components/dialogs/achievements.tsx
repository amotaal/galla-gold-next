// /components/dialogs/achievements.tsx
// Achievements Dialog - Gamified & Animated
// Purpose: Show user progress with immersive animations and rewards

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FullScreenDialog,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
} from "@/components/full-dialog";
import {
  Trophy,
  Lock,
  CheckCircle,
  TrendingUp,
  Coins,
  User,
  Star,
  Zap,
  Award,
} from "lucide-react";

interface Achievement {
  id: string;
  icon: typeof Trophy;
  title: string;
  description: string;
  progress: number;
  total: number;
  locked: boolean;
  category: "Trading" | "Holding" | "Account";
  reward?: string;
}

interface AchievementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    icon: Star,
    title: "First Steps",
    description: "Make your first gold purchase",
    progress: 0,
    total: 1,
    locked: true,
    category: "Trading",
    reward: "10 points",
  },
  {
    id: "active-trader",
    icon: TrendingUp,
    title: "Active Trader",
    description: "Complete 10 transactions",
    progress: 0,
    total: 10,
    locked: true,
    category: "Trading",
    reward: "50 points",
  },
  {
    id: "gold-master",
    icon: Trophy,
    title: "Gold Master",
    description: "Complete 50 transactions",
    progress: 0,
    total: 50,
    locked: true,
    category: "Trading",
    reward: "100 points",
  },
  {
    id: "collector",
    icon: Coins,
    title: "Collector",
    description: "Hold at least 1 gram of gold",
    progress: 0,
    total: 1,
    locked: true,
    category: "Holding",
    reward: "25 points",
  },
  {
    id: "investor",
    icon: Award,
    title: "Investor",
    description: "Hold at least 10 grams of gold",
    progress: 0,
    total: 10,
    locked: true,
    category: "Holding",
    reward: "75 points",
  },
  {
    id: "gold-baron",
    icon: Trophy,
    title: "Gold Baron",
    description: "Hold at least 100 grams of gold",
    progress: 0,
    total: 100,
    locked: true,
    category: "Holding",
    reward: "200 points",
  },
  {
    id: "verified",
    icon: CheckCircle,
    title: "Verified",
    description: "Complete KYC verification",
    progress: 1,
    total: 1,
    locked: false,
    category: "Account",
    reward: "50 points",
  },
  {
    id: "secure",
    icon: Zap,
    title: "Secure",
    description: "Enable two-factor authentication",
    progress: 0,
    total: 1,
    locked: true,
    category: "Account",
    reward: "30 points",
  },
  {
    id: "profile-complete",
    icon: User,
    title: "Profile Complete",
    description: "Complete your profile information",
    progress: 0,
    total: 1,
    locked: true,
    category: "Account",
    reward: "20 points",
  },
];

export function AchievementsDialog({
  open,
  onOpenChange,
}: AchievementsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const unlockedCount = ACHIEVEMENTS.filter((a) => !a.locked).length;
  const totalCount = ACHIEVEMENTS.length;
  const overallProgress = Math.round((unlockedCount / totalCount) * 100);

  const categories = ["All", "Trading", "Holding", "Account"];

  const filteredAchievements =
    selectedCategory === "All"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent className="p-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 border-b border-border bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 animate-pulse">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <FullScreenDialogTitle className="text-3xl mb-1">
                  Achievements
                </FullScreenDialogTitle>
                <FullScreenDialogDescription className="text-base">
                  Track your progress and unlock rewards
                </FullScreenDialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-background">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Overall Progress Card */}
            <Card className="p-8 border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-5xl font-bold text-primary">
                      {overallProgress}%
                    </div>
                    <div>
                      <p className="font-semibold text-xl">Your Progress</p>
                      <p className="text-muted-foreground">
                        {unlockedCount} of {totalCount} achievements unlocked
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary via-yellow-400 to-primary bg-size-[200%_100%] animate-[gold-shine_3s_ease-in-out_infinite] transition-all duration-1000"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-6 rounded-xl bg-primary/10 border-2 border-primary/30">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {unlockedCount * 50}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
              </div>
            </Card>

            {/* Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category ? "gold-shine text-black" : ""
                  }
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  {category}
                </Button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => {
                const AchievementIcon = achievement.icon;
                const progressPercent = Math.round(
                  (achievement.progress / achievement.total) * 100
                );

                return (
                  <Card
                    key={achievement.id}
                    className={`p-6 transition-all duration-300 ${
                      achievement.locked
                        ? "border-border/50 bg-card/30 opacity-75"
                        : "border-primary/30 bg-linear-to-br from-primary/10 to-transparent hover:shadow-gold-glow-strong hover:scale-105"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        achievement.locked
                          ? "bg-muted"
                          : "bg-linear-to-br from-primary/20 to-primary/10 animate-pulse"
                      }`}
                    >
                      {achievement.locked ? (
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <AchievementIcon className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        {achievement.title}
                        {!achievement.locked && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>

                      {achievement.locked && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">
                          {achievement.progress} / {achievement.total}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            achievement.locked
                              ? "bg-muted-foreground"
                              : "bg-linear-to-r from-primary to-yellow-400"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {achievement.reward && (
                        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                          <Star className="w-3 h-3" />
                          <span>Reward: {achievement.reward}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Call to Action */}
            {overallProgress < 100 && (
              <Card className="p-8 text-center border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Keep Going!</h3>
                <p className="text-muted-foreground mb-6">
                  Complete more achievements to earn rewards and level up your
                  account
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="gold-shine text-black font-semibold"
                >
                  Start Trading
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 border-t border-border bg-card/50 p-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-sm text-muted-foreground">
              <p>
                Unlock achievements by trading gold and completing account setup
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </div>
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
