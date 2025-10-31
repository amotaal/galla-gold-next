// /server/models/MFA.ts
// MFA (Multi-Factor Authentication) Model for GALLA.GOLD Application
// Purpose: Store and manage 2FA secrets, backup codes, and authentication history
// Provides enhanced security for user accounts

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * MFA method types
 */
export type MFAMethod = 'totp' | 'sms' | 'email';

/**
 * Backup code interface
 */
export interface IBackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
  usedIp?: string;
}

/**
 * MFA verification attempt interface
 */
export interface IVerificationAttempt {
  method: MFAMethod;
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * MFA document interface
 */
export interface IMFA extends Document {
  userId: Types.ObjectId; // Reference to User model
  
  // MFA configuration
  enabled: boolean;
  method: MFAMethod;
  
  // TOTP (Time-based One-Time Password) settings
  secret: string; // Encrypted secret
  qrCodeUrl?: string;
  
  // Backup codes
  backupCodes: IBackupCode[];
  
  // Verification history
  verificationAttempts: IVerificationAttempt[];
  lastVerifiedAt?: Date;
  
  // Recovery information
  recoveryEmail?: string;
  recoveryPhone?: string;
  
  // Security settings
  requireForLogin: boolean;
  requireForTransactions: boolean;
  requireForWithdrawals: boolean;
  
  // Failed attempts tracking
  failedAttempts: number;
  lockUntil?: Date;
  
  // Timestamps
  enabledAt?: Date;
  disabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  generateBackupCodes(count?: number): Promise<string[]>;
  useBackupCode(code: string, ipAddress?: string): Promise<boolean>;
  verifyCode(code: string, method?: MFAMethod): boolean;
  logVerificationAttempt(success: boolean, method: MFAMethod, ipAddress?: string, userAgent?: string): Promise<void>;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
  isLocked(): boolean;
  encryptSecret(secret: string): string;
  decryptSecret(): string;
}

/**
 * MFA model interface with static methods
 */
export interface IMFAModel extends Model<IMFA> {
  findByUserId(userId: string | Types.ObjectId): Promise<IMFA | null>;
  createForUser(userId: string | Types.ObjectId, secret: string): Promise<IMFA>;
}

// =============================================================================
// SUBDOCUMENT SCHEMAS
// =============================================================================

/**
 * Backup code subdocument schema
 */
const BackupCodeSchema = new Schema<IBackupCode>(
  {
    code: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,
    usedIp: String,
  },
  { _id: false }
);

/**
 * Verification attempt subdocument schema
 */
const VerificationAttemptSchema = new Schema<IVerificationAttempt>(
  {
    method: {
      type: String,
      enum: ['totp', 'sms', 'email'],
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    userAgent: String,
  },
  { _id: false }
);

// =============================================================================
// MAIN SCHEMA DEFINITION
// =============================================================================

const MFASchema = new Schema<IMFA, IMFAModel>(
  {
    // -------------------------------------------------------------------------
    // USER REFERENCE
    // -------------------------------------------------------------------------
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One MFA config per user
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // MFA CONFIGURATION
    // -------------------------------------------------------------------------
    enabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    method: {
      type: String,
      enum: ['totp', 'sms', 'email'],
      default: 'totp',
    },
    
    // -------------------------------------------------------------------------
    // TOTP SETTINGS
    // -------------------------------------------------------------------------
    secret: {
      type: String,
      required: true,
      select: false, // Never include in queries by default
    },
    
    qrCodeUrl: {
      type: String,
      select: false,
    },
    
    // -------------------------------------------------------------------------
    // BACKUP CODES
    // -------------------------------------------------------------------------
    backupCodes: {
      type: [BackupCodeSchema],
      default: [],
      select: false,
    },
    
    // -------------------------------------------------------------------------
    // VERIFICATION HISTORY
    // -------------------------------------------------------------------------
    verificationAttempts: {
      type: [VerificationAttemptSchema],
      default: [],
    },
    
    lastVerifiedAt: Date,
    
    // -------------------------------------------------------------------------
    // RECOVERY INFORMATION
    // -------------------------------------------------------------------------
    recoveryEmail: String,
    recoveryPhone: String,
    
    // -------------------------------------------------------------------------
    // SECURITY SETTINGS
    // -------------------------------------------------------------------------
    requireForLogin: {
      type: Boolean,
      default: true,
    },
    
    requireForTransactions: {
      type: Boolean,
      default: false,
    },
    
    requireForWithdrawals: {
      type: Boolean,
      default: true,
    },
    
    // -------------------------------------------------------------------------
    // FAILED ATTEMPTS TRACKING
    // -------------------------------------------------------------------------
    failedAttempts: {
      type: Number,
      default: 0,
    },
    
    lockUntil: Date,
    
    // -------------------------------------------------------------------------
    // STATUS TIMESTAMPS
    // -------------------------------------------------------------------------
    enabledAt: Date,
    disabledAt: Date,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES FOR PERFORMANCE
// =============================================================================

MFASchema.index({ userId: 1 });
MFASchema.index({ enabled: 1 });

// =============================================================================
// ENCRYPTION HELPERS
// =============================================================================

const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt data using AES-256-CBC
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Generate backup codes
 * @param count - Number of codes to generate (default: 10)
 * @returns Promise<string[]> - Array of backup codes
 */
MFASchema.methods.generateBackupCodes = async function (count: number = 10): Promise<string[]> {
  const codes: string[] = [];
  this.backupCodes = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
    this.backupCodes.push({
      code,
      used: false,
    });
  }
  
  await this.save();
  return codes;
};

/**
 * Use a backup code
 * @param code - Backup code to use
 * @param ipAddress - Optional IP address
 * @returns Promise<boolean> - True if code is valid and used
 */
MFASchema.methods.useBackupCode = async function (
  code: string,
  ipAddress?: string
): Promise<boolean> {
  const backupCode = this.backupCodes.find(
    (bc: IBackupCode) => bc.code === code.toUpperCase() && !bc.used
  );
  
  if (!backupCode) {
    return false;
  }
  
  backupCode.used = true;
  backupCode.usedAt = new Date();
  backupCode.usedIp = ipAddress;
  
  await this.save();
  return true;
};

/**
 * Verify TOTP code
 * @param code - 6-digit TOTP code
 * @param method - MFA method (default: totp)
 * @returns boolean - True if code is valid
 */
MFASchema.methods.verifyCode = function (code: string, method: MFAMethod = 'totp'): boolean {
  // In production, use a library like 'speakeasy' to verify TOTP codes
  // For now, we'll simulate verification
  
  if (method === 'totp') {
    // TODO: Implement actual TOTP verification with speakeasy
    return code.length === 6 && /^\d+$/.test(code);
  }
  
  return false;
};

/**
 * Log verification attempt
 * @param success - Whether verification was successful
 * @param method - MFA method used
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent
 */
MFASchema.methods.logVerificationAttempt = async function (
  success: boolean,
  method: MFAMethod,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  this.verificationAttempts.push({
    method,
    success,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });
  
  if (success) {
    this.lastVerifiedAt = new Date();
    await this.resetFailedAttempts();
  } else {
    await this.incrementFailedAttempts();
  }
  
  // Keep only last 50 attempts
  if (this.verificationAttempts.length > 50) {
    this.verificationAttempts = this.verificationAttempts.slice(-50);
  }
  
  await this.save();
};

/**
 * Increment failed attempts counter
 * Lock MFA after 5 failed attempts
 */
MFASchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedAttempts += 1;
  
  // Lock for 15 minutes after 5 failed attempts
  if (this.failedAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await this.save();
};

/**
 * Reset failed attempts counter
 */
MFASchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

/**
 * Check if MFA is locked due to failed attempts
 * @returns boolean - True if locked
 */
MFASchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Encrypt MFA secret
 * @param secret - Plain secret
 * @returns string - Encrypted secret
 */
MFASchema.methods.encryptSecret = function (secret: string): string {
  return encrypt(secret);
};

/**
 * Decrypt MFA secret
 * @returns string - Decrypted secret
 */
MFASchema.methods.decryptSecret = function (): string {
  return decrypt(this.secret);
};

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Encrypt secret before saving
 */
MFASchema.pre('save', function (next) {
  if (this.isModified('secret') && !this.secret.includes(':')) {
    this.secret = encrypt(this.secret);
  }
  next();
});

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find MFA by user ID
 * @param userId - User ID
 * @returns Promise<IMFA | null>
 */
MFASchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Create MFA for user
 * @param userId - User ID
 * @param secret - TOTP secret
 * @returns Promise<IMFA>
 */
MFASchema.statics.createForUser = async function (
  userId: string | Types.ObjectId,
  secret: string
) {
  return this.create({
    userId,
    secret,
    enabled: false,
  });
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

const MFA = (mongoose.models.MFA as IMFAModel) ||
            mongoose.model<IMFA, IMFAModel>('MFA', MFASchema);

export default MFA;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * CREATE MFA FOR USER:
 * 
 * import * as speakeasy from 'speakeasy';
 * 
 * const secret = speakeasy.generateSecret({ name: 'GALLA.GOLD' });
 * const mfa = await MFA.createForUser(userId, secret.base32);
 * 
 * 
 * GENERATE QR CODE:
 * 
 * import * as QRCode from 'qrcode';
 * 
 * mfa.qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
 * await mfa.save();
 * 
 * 
 * GENERATE BACKUP CODES:
 * 
 * const backupCodes = await mfa.generateBackupCodes();
 * // Show these to user ONCE for them to save
 * 
 * 
 * VERIFY CODE:
 * 
 * const isValid = speakeasy.totp.verify({
 *   secret: mfa.decryptSecret(),
 *   encoding: 'base32',
 *   token: userProvidedCode,
 * });
 * 
 * await mfa.logVerificationAttempt(isValid, 'totp', req.ip, req.headers['user-agent']);
 * 
 * 
 * USE BACKUP CODE:
 * 
 * const isValid = await mfa.useBackupCode(code, req.ip);
 * 
 * 
 * ENABLE MFA:
 * 
 * mfa.enabled = true;
 * mfa.enabledAt = new Date();
 * await mfa.save();
 */
