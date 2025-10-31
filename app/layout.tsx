// app/layout.tsx
// Root Layout for GALLA.GOLD Next.js Application
// Purpose: Main layout wrapper with all providers, fonts, and global configuration

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth";
import { WalletProvider } from "@/components/providers/wallet";
import { ThemeProvider } from "@/components/providers/theme";
import { I18nProvider } from "@/components/providers/i18n";
import "./globals.css";

// =============================================================================
// FONT CONFIGURATION
// =============================================================================

/**
 * Geist Sans - Modern sans-serif font for body text
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Geist Mono - Monospace font for code and numbers
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

/**
 * Application metadata for SEO and social sharing
 */
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "GALLA.GOLD - Invest in Physical Gold",
    template: "%s | GALLA.GOLD",
  },
  description:
    "Invest in physical gold with ease. Buy, sell, and store gold securely. Track your portfolio in real-time. Multi-currency support and physical delivery available.",
  
  // Keywords for SEO
  keywords: [
    "gold investment",
    "physical gold",
    "buy gold online",
    "gold trading",
    "precious metals",
    "gold portfolio",
    "gold storage",
    "invest in gold",
  ],
  
  // Authors
  authors: [
    {
      name: "GALLA.GOLD",
      url: "https://gallagold.com",
    },
  ],
  
  // Creator
  creator: "GALLA.GOLD",
  
  // Publisher
  publisher: "GALLA.GOLD",
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Open Graph metadata (for social sharing)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gallagold.com",
    siteName: "GALLA.GOLD",
    title: "GALLA.GOLD - Invest in Physical Gold",
    description:
      "Invest in physical gold with ease. Buy, sell, and store gold securely.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GALLA.GOLD - Gold Investment Platform",
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "GALLA.GOLD - Invest in Physical Gold",
    description:
      "Invest in physical gold with ease. Buy, sell, and store gold securely.",
    images: ["/twitter-image.jpg"],
    creator: "@gallagold",
  },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Viewport (in Next.js 14+, this is set separately)
  // viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  
  // Theme color
  // themeColor: [
  //   { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
  //   { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  // ],
  
  // Verification (add your verification codes here)
  verification: {
    google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  
  // Category
  category: "finance",
};

// =============================================================================
// VIEWPORT CONFIGURATION (Next.js 14+)
// =============================================================================

/**
 * Viewport configuration for responsive design
 */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  ],
};

// =============================================================================
// ROOT LAYOUT COMPONENT
// =============================================================================

/**
 * RootLayout - Main layout component that wraps the entire application
 * 
 * This layout component:
 * 1. Sets up HTML structure with proper lang attribute
 * 2. Applies custom fonts (Geist Sans and Geist Mono)
 * 3. Wraps the app with all necessary providers:
 *    - SessionProvider (NextAuth)
 *    - ThemeProvider (Dark/Light mode)
 *    - I18nProvider (Internationalization)
 *    - AuthProvider (Authentication state)
 *    - WalletProvider (Wallet data)
 *    - TooltipProvider (shadcn tooltips)
 * 4. Includes global UI components (Toasters)
 * 
 * Provider Order (important for dependencies):
 * 1. SessionProvider - Base authentication
 * 2. ThemeProvider - Theme management
 * 3. I18nProvider - Language management
 * 4. AuthProvider - Uses session from SessionProvider
 * 5. WalletProvider - Uses auth from AuthProvider
 * 6. TooltipProvider - UI utilities
 * 
 * @param children - Page content to render
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* NextAuth Session Provider */}
        <SessionProvider>
          {/* Theme Provider - Dark/Light mode */}
          <ThemeProvider>
            {/* Internationalization Provider */}
            <I18nProvider>
              {/* Authentication Provider */}
              <AuthProvider>
                {/* Wallet Provider */}
                <WalletProvider>
                  {/* Tooltip Provider for shadcn components */}
                  <TooltipProvider>
                    {/* Main Application Content */}
                    {children}
                    
                    {/* Toast Notifications */}
                    <Toaster />
                    <Sonner />
                  </TooltipProvider>
                </WalletProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * PROVIDER HIERARCHY:
 * 
 * SessionProvider (NextAuth)
 *   └─ ThemeProvider (next-themes)
 *       └─ I18nProvider (custom)
 *           └─ AuthProvider (custom, uses session)
 *               └─ WalletProvider (custom, uses auth)
 *                   └─ TooltipProvider (shadcn)
 *                       └─ Page Content
 * 
 * This hierarchy ensures each provider has access to the providers it depends on.
 * 
 * 
 * ACCESSING PROVIDERS IN COMPONENTS:
 * 
 * // Authentication
 * import { useAuth } from '@/components/providers/auth';
 * const { user, isAuthenticated } = useAuth();
 * 
 * // Wallet
 * import { useWallet } from '@/components/providers/wallet';
 * const { balance, gold, transactions } = useWallet();
 * 
 * // Theme
 * import { useTheme } from 'next-themes';
 * const { theme, setTheme } = useTheme();
 * 
 * // i18n
 * import { useI18n } from '@/components/providers/i18n';
 * const { t, locale, setLocale } = useI18n();
 * 
 * 
 * METADATA:
 * 
 * To override metadata in specific pages:
 * 
 * // app/dashboard/page.tsx
 * export const metadata: Metadata = {
 *   title: "Dashboard",
 *   description: "Your gold portfolio dashboard",
 * };
 * 
 * 
 * FONTS:
 * 
 * Fonts are available as CSS variables:
 * - var(--font-geist-sans) - Sans-serif font
 * - var(--font-geist-mono) - Monospace font
 * 
 * Applied globally via Tailwind's fontFamily config.
 */
