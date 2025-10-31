// /server/lib/crypto-extensions.ts
// Additional crypto utilities for GALLA.GOLD Application
// Purpose: Expiring token functions for email verification and password reset

import crypto from "crypto";

// =============================================================================
// EXPIRING TOKEN FUNCTIONS
// =============================================================================

/**
 * Create a token that expires after a given time
 * Returns token and expiration date
 * 
 * @param expiresInMs - Expiration time in milliseconds (default: 1 hour)
 * @returns Object with token and expiresAt date
 * 
 * @example
 * const { token, expiresAt } = createExpiringToken(3600000); // 1 hour
 */
export function createExpiringToken(expiresInMs: number = 3600000): {
  token: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMs);

  return {
    token,
    expiresAt,
  };
}

/**
 * Check if a token has expired
 * 
 * @param expiresAt - Expiration date of the token
 * @returns True if token has expired
 * 
 * @example
 * const hasExpired = isTokenExpired(user.emailVerificationExpires);
 */
export function isTokenExpired(expiresAt?: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}
