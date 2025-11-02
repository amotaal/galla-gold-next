// /app/page.tsx
// Premium Landing Page - Award-Winning Gold-Centric Design
// Purpose: Showcase GALLA.GOLD as a cutting-edge fintech solution

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  Globe,
  Lock,
  Zap,
  Package,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Award,
  BarChart3,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#0a0a0a] to-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-primary/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Logo />

          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#security"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors"
            >
              Security
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-400 hover:text-primary transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-primary hover:bg-primary/10"
              >
                Log In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] hover:from-[#FFC107] hover:to-[#FFD700] text-black font-bold shadow-gold-glow-strong bg-size-[200%_100%] animate-[gold-shine_3s_ease-in-out_infinite]">
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/3 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto max-w-7xl relative">
          {/* Trust badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 shadow-gold-glow">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold bg-linear-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
                Trusted by 100,000+ investors worldwide
              </span>
            </div>
          </div>

          <div className="text-center max-w-5xl mx-auto mb-16">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="text-white">Invest in</span>
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-linear-to-r from-primary via-yellow-400 to-primary blur-2xl opacity-50"></span>
                <span className="relative bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] bg-clip-text text-transparent animate-[gold-shine_3s_ease-in-out_infinite] bg-size-[200%_100%]">
                  Physical Gold
                </span>
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              The future of wealth preservation. Buy, sell, and store gold
              securely.
              <span className="text-primary font-semibold">
                {" "}
                Start with just $10.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="h-16 px-12 text-lg font-bold bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] hover:from-[#FFC107] hover:to-[#FFD700] text-black shadow-gold-glow-strong bg-size-[200%_100%] animate-[gold-shine_3s_ease-in-out_infinite]"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Investing Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 text-lg font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
                >
                  Learn More
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <Shield className="w-4 h-4 text-primary" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <Lock className="w-4 h-4 text-primary" />
                <span>Insured Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <Globe className="w-4 h-4 text-primary" />
                <span>150+ Countries</span>
              </div>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10"></div>
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-gold-glow-strong bg-linear-to-br from-primary/10 to-transparent backdrop-blur-xl">
              <div className="p-8">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="h-24 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="h-24 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <div className="h-24 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="h-48 rounded-xl bg-linear-to-br from-primary/10 to-transparent border border-primary/20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 border-y border-primary/10 bg-linear-to-r from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "$2.5B+", label: "Assets Under Management" },
              { value: "100K+", label: "Active Investors" },
              { value: "150+", label: "Countries Served" },
              { value: "99.9%", label: "Platform Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black bg-linear-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent mb-3">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-32 px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>

        <div className="container mx-auto max-w-7xl relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black mb-6">
              <span className="text-white">Why Choose </span>
              <span className="bg-linear-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                GALLA.GOLD
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The modern way to invest in physical gold with complete
              transparency and security
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Real-Time Trading",
                description:
                  "Buy and sell gold instantly at live market prices with no hidden fees",
                gradient: "from-green-500/20 to-emerald-500/5",
              },
              {
                icon: Shield,
                title: "Secure Storage",
                description:
                  "Your gold is stored in insured vaults with 24/7 monitoring and full insurance",
                gradient: "from-blue-500/20 to-cyan-500/5",
              },
              {
                icon: Globe,
                title: "Multi-Currency",
                description:
                  "Trade in USD, EUR, GBP, EGP, SAR with competitive exchange rates",
                gradient: "from-purple-500/20 to-pink-500/5",
              },
              {
                icon: Lock,
                title: "Bank-Grade Security",
                description:
                  "Two-factor authentication, encryption, and KYC verification for your safety",
                gradient: "from-red-500/20 to-orange-500/5",
              },
              {
                icon: Zap,
                title: "Instant Access",
                description:
                  "Start investing with just $10. No minimum balance or monthly fees",
                gradient: "from-yellow-500/20 to-amber-500/5",
              },
              {
                icon: Package,
                title: "Physical Delivery",
                description:
                  "Request physical delivery of your gold bars and coins anytime, anywhere",
                gradient: "from-primary/20 to-yellow-500/5",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className={`group p-8 bg-linear-to-br ${feature.gradient} border-primary/20 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-gold-glow cursor-pointer`}
              >
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-32 px-4 sm:px-6 bg-linear-to-b from-transparent via-primary/5 to-transparent"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-6 text-white">
              Start Investing in{" "}
              <span className="bg-linear-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Get started with GALLA.GOLD in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                description:
                  "Sign up in seconds. Complete KYC verification for full access.",
                icon: Users,
              },
              {
                step: "2",
                title: "Add Funds",
                description:
                  "Deposit via bank transfer or card. Start with as little as $10.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Buy Gold",
                description:
                  "Purchase gold at live prices. Track your portfolio in real-time.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-linear-to-r from-primary to-transparent -z-10"></div>
                )}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                    <div className="absolute inset-0 bg-linear-to-br from-primary to-yellow-500 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute inset-4 bg-linear-to-br from-primary to-yellow-500 rounded-full opacity-40"></div>
                    <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-[#FFD700] to-[#FFB800] flex items-center justify-center shadow-gold-glow-strong">
                      <item.icon className="w-10 h-10 text-black" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-black border-2 border-primary flex items-center justify-center">
                      <span className="text-2xl font-black text-primary">
                        {item.step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="h-16 px-12 text-lg font-bold bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] hover:from-[#FFC107] hover:to-[#FFD700] text-black shadow-gold-glow-strong"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Start with just $10
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-primary/10 to-primary/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)]"></div>
        </div>

        <div className="container mx-auto max-w-5xl text-center relative">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Star className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Join 100,000+ investors
            </span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-black mb-8 leading-tight">
            <span className="text-white">Ready to Build Your</span>
            <br />
            <span className="bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] bg-clip-text text-transparent">
              Gold Portfolio?
            </span>
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Start investing in physical gold today. Secure, simple, and trusted
            by investors worldwide.
          </p>

          <Link href="/auth/signup">
            <Button
              size="lg"
              className="h-16 px-12 text-lg font-bold bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] hover:from-[#FFC107] hover:to-[#FFD700] text-black shadow-gold-glow-strong"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-black/50 py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Logo />
              <p className="text-sm text-gray-500">
                The modern way to invest in physical gold.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "API"],
              },
              {
                title: "Company",
                links: ["About", "Careers", "Press", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Compliance", "Licenses"],
              },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-bold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-primary/10 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 GALLA.GOLD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
