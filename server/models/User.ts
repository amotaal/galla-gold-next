// /server/models/User.ts
// FIXED User Model with all required fields

import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { KYCStatus } from "@/types/index";

export interface IUser extends Document {
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // ADD THESE TWO LINES:
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

  kycStatus: "pending" | "submitted" | "verified" | "rejected";
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
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ADD THESE TWO LINES:
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
      enum: ["none", "pending", "submitted", "verified", "rejected"], // ADD 'none' and 'submitted'
      default: "pending", // CHANGE from 'pending' to 'none'
    },
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,

    preferredCurrency: { type: String, default: "USD" },
    preferredLanguage: { type: String, default: "en" },
    locale: { type: String, default: "en" },
    currency: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    role: { type: String, enum: ["user", "admin"], default: "user" },

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

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generatePasswordResetToken = function (): string {
  const token = require("crypto").randomBytes(32).toString("hex");
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 3600000);
  return token;
};

UserSchema.methods.generateEmailVerificationToken = function (): string {
  const token = require("crypto").randomBytes(32).toString("hex");
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 86400000);
  return token;
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

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

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
