// /server/lib/crypto.ts
// Cryptography Utilities for GALLA.GOLD Application - UPDATED
// Purpose: Password hashing, token generation, encryption, and expiring tokens

import bcrypt from "bcryptjs";
import crypto from "crypto";

// =============================================================================
// PASSWORD HASHING
// =============================================================================

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password
 * @param rounds - Salt rounds (default: 12)
 * @returns Hashed password
 * 
 * @example
 * const hashed = await hashPassword('mypassword');
 */
export async function hashPassword(
  password: string,
  rounds: number = 12
): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches
 * 
 * @example
 * const isValid = await verifyPassword('mypassword', hashedPassword);
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Generate a random token
 * Used for email verification, password reset, etc.
 * 
 * @param length - Token length in bytes (default: 32)
 * @returns Random hex string
 * 
 * @example
 * const token = generateToken(32);
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a numeric OTP code
 * 
 * @param length - Number of digits (default: 6)
 * @returns Numeric string
 * 
 * @example
 * const otp = generateOTP(6); // => "123456"
 */
export function generateOTP(length: number = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

/**
 * Generate backup codes for MFA
 * 
 * @param count - Number of codes to generate (default: 10)
 * @returns Array of backup codes
 * 
 * @example
 * const codes = generateBackupCodes(10);
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

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

// =============================================================================
// ENCRYPTION/DECRYPTION
// =============================================================================

/**
 * Encrypt a string using AES-256-CBC
 * 
 * @param text - Text to encrypt
 * @param secret - Encryption secret
 * @returns Encrypted text with IV
 * 
 * @example
 * const encrypted = encrypt('sensitive data', process.env.ENCRYPTION_SECRET);
 */
export function encrypt(text: string, secret: string): string {
  const key = crypto
    .createHash("sha256")
    .update(String(secret))
    .digest("base64")
    .substr(0, 32);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt a string encrypted with encrypt()
 * 
 * @param text - Encrypted text with IV
 * @param secret - Decryption secret
 * @returns Decrypted text
 * 
 * @example
 * const decrypted = decrypt(encrypted, process.env.ENCRYPTION_SECRET);
 */
export function decrypt(text: string, secret: string): string {
  const key = crypto
    .createHash("sha256")
    .update(String(secret))
    .digest("base64")
    .substr(0, 32);
  
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}

// =============================================================================
// HASHING
// =============================================================================

/**
 * Create SHA-256 hash of a string
 * 
 * @param text - Text to hash
 * @returns Hex hash string
 * 
 * @example
 * const hash = sha256('hello world');
 */
export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Create HMAC signature
 * 
 * @param data - Data to sign
 * @param secret - Secret key
 * @returns HMAC signature
 * 
 * @example
 * const signature = hmacSignature(data, process.env.HMAC_SECRET);
 */
export function hmacSignature(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify HMAC signature
 * 
 * @param data - Original data
 * @param signature - Signature to verify
 * @param secret - Secret key
 * @returns True if signature is valid
 * 
 * @example
 * const isValid = verifyHmacSignature(data, signature, process.env.HMAC_SECRET);
 */
export function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = hmacSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// =============================================================================
// UUID GENERATION
// =============================================================================

/**
 * Generate a UUID v4
 * 
 * @returns UUID string
 * 
 * @example
 * const id = generateUUID(); // => "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// =============================================================================
// SECURE COMPARISON
// =============================================================================

/**
 * Compare two strings in constant time to prevent timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 * 
 * @example
 * const isEqual = secureCompare(token1, token2);
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    // If lengths don't match, timingSafeEqual throws
    return false;
  }
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Check if password meets strength requirements
 * 
 * @param password - Password to validate
 * @returns Object with validation result and messages
 * 
 * @example
 * const result = validatePasswordStrength('Test123!');
 * if (!result.isValid) {
 *   console.log(result.messages);
 * }
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  messages: string[];
} {
  const messages: string[] = [];
  let score = 0;

  // Check length
  if (password.length < 8) {
    messages.push("Password must be at least 8 characters long");
  } else {
    score++;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    messages.push("Password must contain at least one uppercase letter");
  } else {
    score++;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    messages.push("Password must contain at least one lowercase letter");
  } else {
    score++;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    messages.push("Password must contain at least one number");
  } else {
    score++;
  }

  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push("Password must contain at least one special character");
  } else {
    score++;
  }

  // Check for common patterns
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^letmein/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      messages.push("Password contains a common pattern");
      score = Math.max(0, score - 2);
      break;
    }
  }

  return {
    isValid: score >= 4 && messages.length === 0,
    score,
    messages,
  };
}

// =============================================================================
// RATE LIMITING TOKENS
// =============================================================================

/**
 * Generate a rate limiting token based on identifier and timestamp
 * Used for preventing brute force attacks
 * 
 * @param identifier - User identifier (email, IP, etc.)
 * @param window - Time window in seconds
 * @returns Rate limiting token
 * 
 * @example
 * const token = generateRateLimitToken('user@example.com', 3600);
 */
export function generateRateLimitToken(
  identifier: string,
  window: number
): string {
  const timestamp = Math.floor(Date.now() / 1000 / window);
  return sha256(`${identifier}:${timestamp}`);
}
