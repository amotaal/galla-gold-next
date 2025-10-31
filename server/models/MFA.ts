// server/models/MFA.ts
// ============================================================================
// MFA Model - FIXED
// ============================================================================
// Purpose: Multi-Factor Authentication management
// ✅ FIXED: failedAttempts is number, backupCodes is IBackupCode[]
// ✅ FIXED: Added _id typing, verifiedAt property

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import crypto from 'crypto';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MFAMethod = 'totp' | 'sms' | 'email';

export interface IBackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
  usedIp?: string;
}

export interface IVerificationAttempt {
  method: MFAMethod;
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IMFA extends Document {
  _id: Types.ObjectId;              // ✅ FIXED: Explicit _id typing
  userId: Types.ObjectId;
  
  enabled: boolean;
  method: MFAMethod;
  secret: string;
  qrCodeUrl?: string;
  
  backupCodes: IBackupCode[];       // ✅ FIXED: IBackupCode[], not string[]
  verified: boolean;
  verifiedAt?: Date;                // ✅ FIXED: Added verifiedAt
  
  verificationHistory: IVerificationAttempt[];
  lastVerifiedAt?: Date;
  
  recoveryEmail?: string;
  recoveryPhone?: string;
  
  requireForLogin: boolean;
  requireForTransactions: boolean;
  requireForWithdrawals: boolean;
  
  failedAttempts: number;           // ✅ FIXED: number, not Date
  lockedUntil?: Date;
  
  enabledAt?: Date;
  disabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  generateBackupCodes(count?: number): Promise<string[]>;
  useBackupCode(code: string, ipAddress?: string): Promise<boolean>;
  verifyCode(code: string, method?: MFAMethod): boolean;
  logVerificationAttempt(success: boolean, method: MFAMethod, ipAddress?: string, userAgent?: string): Promise<void>;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
  isLocked(): boolean;
}

export interface IMFAModel extends Model<IMFA> {
  findByUserId(userId: string | Types.ObjectId): Promise<IMFA | null>;
  createForUser(userId: string | Types.ObjectId, secret: string): Promise<IMFA>;
}

// =============================================================================
// SUBDOCUMENT SCHEMAS
// =============================================================================

const BackupCodeSchema = new Schema<IBackupCode>(
  {
    code: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: Date,
    usedIp: String,
  },
  { _id: false }
);

const VerificationAttemptSchema = new Schema<IVerificationAttempt>(
  {
    method: { type: String, enum: ['totp', 'sms', 'email'], required: true },
    success: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
  },
  { _id: false }
);

// =============================================================================
// MAIN SCHEMA
// =============================================================================

const MFASchema = new Schema<IMFA, IMFAModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ['totp', 'sms', 'email'], default: 'totp' },
    secret: { type: String, required: true },
    qrCodeUrl: String,
    
    backupCodes: [BackupCodeSchema],        // ✅ FIXED: Array of BackupCodeSchema
    verified: { type: Boolean, default: false },
    verifiedAt: Date,                       // ✅ FIXED: Added verifiedAt
    
    verificationHistory: [VerificationAttemptSchema],
    lastVerifiedAt: Date,
    
    recoveryEmail: String,
    recoveryPhone: String,
    
    requireForLogin: { type: Boolean, default: false },
    requireForTransactions: { type: Boolean, default: true },
    requireForWithdrawals: { type: Boolean, default: true },
    
    failedAttempts: { type: Number, default: 0 },  // ✅ FIXED: Number, not Date
    lockedUntil: Date,
    
    enabledAt: Date,
    disabledAt: Date,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INSTANCE METHODS
// =============================================================================

MFASchema.methods.generateBackupCodes = async function (count: number = 10): Promise<string[]> {
  const codes: string[] = [];
  this.backupCodes = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
    this.backupCodes.push({ code, used: false });
  }
  
  await this.save();
  return codes;
};

MFASchema.methods.useBackupCode = async function (
  code: string,
  ipAddress?: string
): Promise<boolean> {
  const backupCode = this.backupCodes.find(
    (bc: IBackupCode) => bc.code === code.toUpperCase() && !bc.used
  );
  
  if (!backupCode) return false;
  
  backupCode.used = true;
  backupCode.usedAt = new Date();
  backupCode.usedIp = ipAddress;
  
  await this.save();
  return true;
};

MFASchema.methods.verifyCode = function (code: string, method: MFAMethod = 'totp'): boolean {
  if (method === 'totp') {
    return code.length === 6 && /^\d+$/.test(code);
  }
  return false;
};

MFASchema.methods.logVerificationAttempt = async function (
  success: boolean,
  method: MFAMethod,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  this.verificationHistory.push({
    method,
    success,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });
  
  if (success) {
    this.lastVerifiedAt = new Date();
    this.failedAttempts = 0;        // ✅ FIXED: Reset to 0, not undefined
    this.lockedUntil = undefined;
  }
  
  await this.save();
};

MFASchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedAttempts += 1;         // ✅ FIXED: Increment number
  
  if (this.failedAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  await this.save();
};

MFASchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedAttempts = 0;          // ✅ FIXED: Reset to 0
  this.lockedUntil = undefined;
  await this.save();
};

MFASchema.methods.isLocked = function (): boolean {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

// =============================================================================
// STATIC METHODS
// =============================================================================

MFASchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

MFASchema.statics.createForUser = async function (
  userId: string | Types.ObjectId,
  secret: string
): Promise<IMFA> {
  return this.create({
    userId,
    secret,
    enabled: false,
    method: 'totp',
    backupCodes: [],
    verificationHistory: [],
    failedAttempts: 0,
    requireForLogin: false,
    requireForTransactions: true,
    requireForWithdrawals: true,
  });
};

// =============================================================================
// EXPORT
// =============================================================================

const MFA = (mongoose.models.MFA as IMFAModel) || mongoose.model<IMFA, IMFAModel>('MFA', MFASchema);
export default MFA;
