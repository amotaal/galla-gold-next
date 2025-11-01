// app/page.tsx
// Landing Page for GALLA.GOLD
// Purpose: Main homepage with hero section, features, and call-to-action

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Globe,
  Lock,
  Zap,
  Award,
} from "lucide-react";

/**
 * HomePage - Landing page with hero and key features
 *
 * This is a server component that renders the main landing page.
 * It includes:
 * - Hero section with main CTA
 * - Key features grid
 * - Social proof
 * - Final CTA
 *
 * Later, this will be expanded with more sections from the Vite app.
 */
export default function HomePage() {
  return (
    <div className="dark min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/50 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/gold-bars.gif"
                  alt="GALLA.GOLD"
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <h1 className="text-3xl font-extrabold text-gold-gradient group-hover:scale-105 transition-transform">
                GALLA.GOLD
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-secondary">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold-glow">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Trusted by 100,000+ investors worldwide</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Invest in{" "}
              <span className="text-gold-gradient">Physical Gold</span>
              <br />
              With Confidence
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Buy, sell, and store gold securely. Track your portfolio in
              real-time. Multi-currency support and physical delivery available.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold-glow hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 group"
                >
                  Start Investing Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10 text-lg px-8 py-6"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 justify-center items-center pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Insured Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>Regulated Platform</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-card/30">
          <div className="max-w-7xl mx-auto px-6">
            {/* Section Header */}
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold">
                Why Choose{" "}
                <span className="text-gold-gradient">GALLA.GOLD</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The modern way to invest in physical gold with complete
                transparency and security
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Trading</h3>
                <p className="text-muted-foreground">
                  Buy and sell gold instantly at live market prices with no
                  hidden fees
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Storage</h3>
                <p className="text-muted-foreground">
                  Your gold is stored in insured vaults with 24/7 monitoring and
                  full insurance
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Currency</h3>
                <p className="text-muted-foreground">
                  Trade in USD, EUR, GBP, EGP, SAR with competitive exchange
                  rates
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Bank-Grade Security</h3>
                <p className="text-muted-foreground">
                  Two-factor authentication, encryption, and KYC verification
                  for your safety
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Instant Access</h3>
                <p className="text-muted-foreground">
                  Start investing with just $10. No minimum balance or monthly
                  fees
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass-card p-8 rounded-xl hover-lift space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Physical Delivery</h3>
                <p className="text-muted-foreground">
                  Request physical delivery of your gold bars and coins anytime,
                  anywhere
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold">
              Ready to Start{" "}
              <span className="text-gold-gradient">Building Wealth?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Join 100,000+ investors who trust GALLA.GOLD for their precious
              metals portfolio
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold-glow hover:shadow-xl transition-all duration-300 text-xl px-12 py-8 rounded-full group"
              >
                Create Free Account
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground animate-pulse">
              No credit card required • Start with just $10
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <Image
                    src="/gold-bars.gif"
                    alt="GALLA.GOLD"
                    width={32}
                    height={32}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-xl font-bold text-primary">
                  GALLA.GOLD
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The modern way to invest in physical gold. Secure, simple, and
                accessible to everyone.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-primary transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="hover:text-primary transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} GALLA.GOLD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
