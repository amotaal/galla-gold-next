// server/models/User.ts
// User Model - FIXED: Removed duplicate email index
// Purpose: User model with authentication, KYC, and MFA functionality
// ✅ FIXED: unique: true already creates index, removed manual Schema.index({ email: 1 })

import mongoose, { Schema, Document, Model, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: Types.ObjectId;

  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  magicLinkToken?: string;
  magicLinkExpires?: Date;

  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];

  kycStatus: "none" | "pending" | "submitted" | "verified" | "rejected";
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
  kycRejectionReason?: string;

  preferredCurrency: string;
  preferredLanguage: string;
  locale: string;
  currency: string;
  timezone: string;
  role: "user" | "admin";

  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockUntil?: Date;

  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;

  deletionRequestedAt?: Date;
  deletionScheduledFor?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByVerificationToken(token: string): Promise<IUser | null>;
  findByResetToken(token: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true, // ✅ This creates an index automatically
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    magicLinkToken: String,
    magicLinkExpires: Date,

    fullName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    avatar: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    mfaBackupCodes: [String],

    kycStatus: {
      type: String,
      enum: ["none", "pending", "submitted", "verified", "rejected"],
      default: "none",
    },
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,

    preferredCurrency: { type: String, default: "USD" },
    preferredLanguage: { type: String, default: "en" },
    locale: { type: String, default: "en" },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    lastLoginAt: Date,
    lastLoginIp: String,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,

    deletionRequestedAt: Date,
    deletionScheduledFor: Date,
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES - Only for fields WITHOUT unique constraint
// ============================================================================
// ❌ REMOVED: UserSchema.index({ email: 1 }); - Already indexed via unique: true
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ isActive: 1, isSuspended: 1 });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });

// ============================================================================
// PRE-SAVE HOOK - Hash password before saving
// ============================================================================
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

UserSchema.methods.generatePasswordResetToken = function (): string {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
  return token;
};

UserSchema.methods.generateEmailVerificationToken = function (): string {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 86400000); // 24 hours
  return token;
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  } else {
    const updates: any = { $inc: { loginAttempts: 1 } };

    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
      updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
    }

    await this.updateOne(updates);
  }
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// ============================================================================
// STATIC METHODS
// ============================================================================

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByVerificationToken = function (token: string) {
  return this.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });
};

UserSchema.statics.findByResetToken = function (token: string) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
};

// ============================================================================
// EXPORT MODEL
// ============================================================================

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
