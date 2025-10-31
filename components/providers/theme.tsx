// components/providers/theme.tsx
// Theme Provider for GALLA.GOLD Next.js Application
// Purpose: Manage dark/light mode theme across the application
// Uses next-themes library for seamless theme switching

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider - Wraps the app and provides theme management
 * 
 * This provider uses next-themes under the hood to manage dark/light mode.
 * GALLA.GOLD defaults to dark mode for a premium look.
 * 
 * Features:
 * - Automatic theme detection from system preferences
 * - Persistent theme choice in localStorage
 * - No flash of wrong theme on page load
 * - Smooth transitions between themes
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <ThemeProvider>
 *   {children}
 * </ThemeProvider>
 * 
 * // In any component
 * import { useTheme } from 'next-themes';
 * 
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 * 
 * @param props - Theme provider props
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

// =============================================================================
// THEME TOGGLE COMPONENT (Utility)
// =============================================================================

/**
 * ThemeToggleButton - Pre-built theme toggle button
 * 
 * Usage:
 * ```tsx
 * import { ThemeToggleButton } from '@/components/providers/theme';
 * 
 * <ThemeToggleButton />
 * ```
 */
export { ThemeToggle } from '@/components/theme-toggle';

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * BASIC USAGE IN COMPONENT:
 * 
 * import { useTheme } from 'next-themes';
 * 
 * function MyComponent() {
 *   const { theme, setTheme } = useTheme();
 *   
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('system')}>System</button>
 *     </div>
 *   );
 * }
 * 
 * 
 * THEME TOGGLE WITH ICON:
 * 
 * import { useTheme } from 'next-themes';
 * import { Moon, Sun } from 'lucide-react';
 * 
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *   
 *   return (
 *     <button
 *       onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
 *       className="p-2 rounded-full hover:bg-secondary"
 *     >
 *       {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
 *     </button>
 *   );
 * }
 * 
 * 
 * CONDITIONAL RENDERING BASED ON THEME:
 * 
 * import { useTheme } from 'next-themes';
 * 
 * function Logo() {
 *   const { theme } = useTheme();
 *   
 *   return (
 *     <img
 *       src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
 *       alt="GALLA.GOLD"
 *     />
 *   );
 * }
 * 
 * 
 * FORCE SPECIFIC THEME FOR A SECTION:
 * 
 * function DarkSection() {
 *   return (
 *     <div className="dark"> {/* Force dark mode for this section *\/}
 *       <div className="bg-background text-foreground p-8">
 *         This section is always dark
 *       </div>
 *     </div>
 *   );
 * }
 */
