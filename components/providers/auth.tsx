// components/providers/auth.tsx
// Authentication Provider for GALLA.GOLD Next.js Application
// Purpose: Provide authentication state throughout the app using Auth.js session
// Replaces the localStorage-based AuthContext from the Vite app

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * User type matching the Auth.js session user
 */
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  kycStatus: 'none' | 'pending' | 'submitted' | 'verified' | 'rejected';
  mfaEnabled: boolean;
  avatar?: string;
  phone?: string;
}

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Utility functions
  refetch: () => void;
  
  // Status checks
  hasVerifiedEmail: boolean;
  hasKYC: boolean;
  hasMFA: boolean;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

/**
 * AuthProvider - Wraps the app and provides authentication state
 * 
 * This provider uses Auth.js (NextAuth) session under the hood.
 * It transforms the session data into a user-friendly format.
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 * 
 * @param children - Child components to wrap
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Get session from Auth.js
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // Local state
  const [isReady, setIsReady] = useState(false);
  
  // Determine loading state
  const isLoading = status === 'loading' || !isReady;
  
  // Transform session into user object
  const user: User | null = session?.user
    ? {
        id: session.user.id!,
        email: session.user.email!,
        firstName: session.user.firstName!,
        lastName: session.user.lastName!,
        emailVerified: session.user.emailVerified || false,
        kycStatus: session.user.kycStatus || 'none',
        mfaEnabled: session.user.mfaEnabled || false,
        avatar: session.user.avatar,
        phone: session.user.phone,
      }
    : null;
  
  // Mark as ready after initial render
  useEffect(() => {
    if (status !== 'loading') {
      setIsReady(true);
    }
  }, [status]);
  
  // Utility functions
  const refetch = () => {
    update();
  };
  
  // Status checks
  const hasVerifiedEmail = user?.emailVerified || false;
  const hasKYC = user?.kycStatus === 'verified';
  const hasMFA = user?.mfaEnabled || false;
  
  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
    hasVerifiedEmail,
    hasKYC,
    hasMFA,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * useAuth - Custom hook to access authentication context
 * 
 * Usage:
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useAuth();
 * 
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 * 
 * return <div>Welcome {user.firstName}!</div>;
 * ```
 * 
 * @returns AuthContextType - Authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// =============================================================================
// PROTECTED ROUTE HOC (Optional)
// =============================================================================

/**
 * withAuth - Higher-order component to protect routes
 * 
 * Usage:
 * ```tsx
 * export default withAuth(DashboardPage);
 * ```
 * 
 * @param Component - Component to protect
 * @returns Protected component that redirects if not authenticated
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="spinner w-12 h-12" />
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return null; // Will redirect
    }
    
    return <Component {...props} />;
  };
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * BASIC USAGE:
 * 
 * import { useAuth } from '@/components/providers/auth';
 * 
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *   
 *   return <div>Hello {user.firstName}!</div>;
 * }
 * 
 * 
 * STATUS CHECKS:
 * 
 * const { hasVerifiedEmail, hasKYC, hasMFA } = useAuth();
 * 
 * if (!hasVerifiedEmail) {
 *   return <EmailVerificationBanner />;
 * }
 * 
 * if (!hasKYC) {
 *   return <KYCPrompt />;
 * }
 * 
 * 
 * REFETCH SESSION:
 * 
 * const { refetch } = useAuth();
 * 
 * const handleProfileUpdate = async () => {
 *   await updateProfileAction(data);
 *   refetch(); // Refresh session with updated data
 * };
 * 
 * 
 * PROTECTED ROUTE:
 * 
 * export default withAuth(DashboardPage);
 */
