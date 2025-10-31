// /server/lib/crypto.ts
// Cryptographic utilities for secure password hashing, token generation, and data encryption
// Uses bcrypt for passwords, crypto for tokens, and provides various security utilities

import bcrypt from "bcryptjs";
import crypto from "crypto";

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 * 
 * Uses bcrypt with salt rounds of 12 for optimal security/performance balance
 * Bcrypt automatically handles salt generation and storage within the hash
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Industry standard for bcrypt security
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 * 
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random token
 * @param length - Length of token in bytes (default 32)
 * @returns string - Hex-encoded random token
 * 
 * Used for email verification, password reset, magic links, etc.
 * Default 32 bytes = 64 hex characters = 256 bits of entropy
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a secure verification code (numeric)
 * @param length - Length of code in digits (default 6)
 * @returns string - Numeric verification code
 * 
 * Used for MFA codes, SMS verification, etc.
 * Generates random number with specified digit length
 */
export function generateVerificationCode(length: number = 6): string {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Generate MFA backup codes
 * @param count - Number of backup codes to generate (default 8)
 * @returns string[] - Array of backup codes
 * 
 * Each code is 12 characters (alphanumeric) for easy manual entry
 * Format: XXXX-XXXX-XXXX for readability
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 12 random alphanumeric characters
    const code = crypto
      .randomBytes(9)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 12);
    
    // Format as XXXX-XXXX-XXXX
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Generate a secure random password
 * @param length - Length of password (default 16)
 * @returns string - Random password with mixed characters
 * 
 * Includes uppercase, lowercase, numbers, and special characters
 * Used for temporary passwords or password suggestions
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const all = uppercase + lowercase + numbers + special;
  
  let password = "";
  
  // Ensure at least one of each character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password to randomize position of required characters
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// ============================================================================
// TOKEN EXPIRY & VALIDATION
// ============================================================================

/**
 * Create a token with expiry timestamp
 * @param expiryMinutes - Minutes until token expires (default 60)
 * @returns object - Token and expiry date
 * 
 * Used for time-sensitive tokens (email verification, password reset)
 */
export function createExpiringToken(expiryMinutes: number = 60) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Check if a token has expired
 * @param expiryDate - Token expiry date
 * @returns boolean - True if token is expired
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

// ============================================================================
// DATA ENCRYPTION (for sensitive data at rest)
// ============================================================================

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @param key - Encryption key (from environment)
 * @returns string - Encrypted text with IV (format: iv:encryptedData:authTag)
 * 
 * Uses authenticated encryption (GCM mode) to ensure data integrity
 * IV (Initialization Vector) is randomly generated for each encryption
 */
export function encrypt(text: string, key: string): string {
  // Derive a proper 32-byte key from the provided key using SHA-256
  const derivedKey = crypto.createHash("sha256").update(key).digest();
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);
  
  // Create cipher with AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return IV:encrypted:authTag (all hex encoded)
  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt encrypted data
 * @param encryptedText - Encrypted text (format: iv:encryptedData:authTag)
 * @param key - Decryption key (same as encryption key)
 * @returns string - Decrypted plain text
 * 
 * Verifies authentication tag to ensure data hasn't been tampered with
 */
export function decrypt(encryptedText: string, key: string): string {
  try {
    // Derive the same key
    const derivedKey = crypto.createHash("sha256").update(key).digest();
    
    // Split the encrypted text into components
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(":");
    
    if (!ivHex || !encryptedHex || !authTagHex) {
      throw new Error("Invalid encrypted data format");
    }
    
    // Convert from hex
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed - data may be corrupted or key is incorrect");
  }
}

// ============================================================================
// HASHING (for non-password data)
// ============================================================================

/**
 * Create SHA-256 hash of data
 * @param data - Data to hash
 * @returns string - Hex-encoded hash
 * 
 * Used for creating unique identifiers, checksums, etc.
 * NOT for passwords (use hashPassword instead)
 */
export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Create HMAC signature
 * @param data - Data to sign
 * @param secret - Secret key for HMAC
 * @returns string - Hex-encoded HMAC signature
 * 
 * Used for webhook verification, API request signing, etc.
 */
export function createHMAC(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify HMAC signature
 * @param data - Original data
 * @param signature - Signature to verify
 * @param secret - Secret key for HMAC
 * @returns boolean - True if signature is valid
 * 
 * Uses constant-time comparison to prevent timing attacks
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = createHMAC(data, secret);
  
  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Generate a unique identifier for rate limiting
 * @param userId - User ID
 * @param action - Action being rate limited
 * @returns string - Unique rate limit key
 * 
 * Used to create keys for rate limiting storage (Redis, memory, etc.)
 */
export function getRateLimitKey(userId: string, action: string): string {
  return `ratelimit:${userId}:${action}`;
}

/**
 * Create a rate limit bucket key with time window
 * @param userId - User ID
 * @param action - Action being rate limited
 * @param windowMinutes - Time window in minutes
 * @returns string - Time-bucketed rate limit key
 * 
 * Creates keys that expire automatically based on time window
 */
export function getTimedRateLimitKey(
  userId: string,
  action: string,
  windowMinutes: number
): string {
  const timestamp = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  return `ratelimit:${userId}:${action}:${timestamp}`;
}
