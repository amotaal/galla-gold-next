// components/password-toggle.tsx
// Purpose: Password visibility toggle button (extracted to fix event handler error)
// This component is used in login/signup forms to show/hide password text

"use client";

import { Eye, EyeOff } from "lucide-react";

interface PasswordToggleButtonProps {
  show: boolean;
  onToggle: () => void;
}

/**
 * PasswordToggleButton - Toggle button for password visibility
 * 
 * Features:
 * - Shows Eye icon when password is hidden
 * - Shows EyeOff icon when password is visible
 * - Proper accessibility with type="button" to prevent form submission
 * - Hover states for better UX
 * 
 * Usage:
 * ```tsx
 * const [showPassword, setShowPassword] = useState(false);
 * 
 * <PasswordToggleButton 
 *   show={showPassword} 
 *   onToggle={() => setShowPassword(!showPassword)} 
 * />
 * ```
 */
export function PasswordToggleButton({ show, onToggle }: PasswordToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm p-1"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  );
}
