// /server/models/User.ts
// User Model for GALLA.GOLD Application
// Purpose: Define user schema with authentication, profile, verification, and security fields
// Includes methods for password hashing, email verification, and session management

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * User document interface extending Mongoose Document
 * This provides TypeScript type safety for User operations
 */
export interface IUser extends Document {
  // Authentication fields
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // Profile fields
  fullName: string;
  phone?: string;
  avatar?: string;
  
  // Verification fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  
  // Security fields
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  
  // KYC fields
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;
  kycRejectionReason?: string;
  
  // Preferences
  locale: string;
  currency: string;
  timezone: string;
  
  // Session management
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Account status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods (defined below)
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

/**
 * User model interface with static methods
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByVerificationToken(token: string): Promise<IUser | null>;
  findByResetToken(token: string): Promise<IUser | null>;
}

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

const UserSchema = new Schema<IUser, IUserModel>(
  {
    // -------------------------------------------------------------------------
    // AUTHENTICATION FIELDS
    // -------------------------------------------------------------------------
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true, // Index for faster lookups
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    
    passwordResetToken: {
      type: String,
      select: false,
    },
    
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    
    // -------------------------------------------------------------------------
    // PROFILE FIELDS
    // -------------------------------------------------------------------------
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number'],
    },
    
    avatar: {
      type: String, // URL to avatar image
    },
    
    // -------------------------------------------------------------------------
    // VERIFICATION FIELDS
    // -------------------------------------------------------------------------
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    emailVerificationToken: {
      type: String,
      select: false,
    },
    
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    
    // -------------------------------------------------------------------------
    // SECURITY FIELDS (MFA)
    // -------------------------------------------------------------------------
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    
    mfaSecret: {
      type: String,
      select: false, // Never include in queries
    },
    
    mfaBackupCodes: {
      type: [String],
      select: false,
    },
    
    // -------------------------------------------------------------------------
    // KYC VERIFICATION FIELDS
    // -------------------------------------------------------------------------
    kycStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    
    kycSubmittedAt: Date,
    kycVerifiedAt: Date,
    kycRejectionReason: String,
    
    // -------------------------------------------------------------------------
    // USER PREFERENCES
    // -------------------------------------------------------------------------
    locale: {
      type: String,
      enum: ['en', 'es', 'fr', 'ru', 'ar'],
      default: 'en',
    },
    
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'EGP', 'AED', 'SAR'],
      default: 'USD',
    },
    
    timezone: {
      type: String,
      default: 'UTC',
    },
    
    // -------------------------------------------------------------------------
    // SESSION MANAGEMENT
    // -------------------------------------------------------------------------
    lastLoginAt: Date,
    lastLoginIp: String,
    
    loginAttempts: {
      type: Number,
      default: 0,
    },
    
    lockUntil: Date,
    
    // -------------------------------------------------------------------------
    // ACCOUNT STATUS
    // -------------------------------------------------------------------------
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    suspensionReason: String,
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
    
    // Create indexes for better query performance
    indexes: [
      { email: 1 },
      { emailVerified: 1 },
      { kycStatus: 1 },
      { isActive: 1, isSuspended: 1 },
    ],
  }
);

// =============================================================================
// MIDDLEWARE (PRE-SAVE HOOK)
// =============================================================================

/**
 * Hash password before saving to database
 * Only hash if password is modified
 */
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Compare provided password with hashed password in database
 * @param candidatePassword - Plain text password to compare
 * @returns Promise<boolean> - True if passwords match
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Generate password reset token
 * @returns string - Reset token
 */
UserSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
  
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return resetToken;
};

/**
 * Generate email verification token
 * @returns string - Verification token
 */
UserSchema.methods.generateEmailVerificationToken = function (): string {
  const verificationToken = Math.random().toString(36).substring(2, 15) +
                           Math.random().toString(36).substring(2, 15);
  
  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken;
};

/**
 * Check if account is locked due to failed login attempts
 * @returns boolean - True if account is locked
 */
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Increment failed login attempts
 * Lock account after 5 failed attempts
 */
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  
  // Increment attempts
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts (15 minute lock)
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 */
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find user by email
 * @param email - User email address
 * @returns Promise<IUser | null>
 */
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by email verification token
 * @param token - Verification token
 * @returns Promise<IUser | null>
 */
UserSchema.statics.findByVerificationToken = function (token: string) {
  return this.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });
};

/**
 * Find user by password reset token
 * @param token - Reset token
 * @returns Promise<IUser | null>
 */
UserSchema.statics.findByResetToken = function (token: string) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

// Prevent model recompilation in development (Next.js hot reload)
const User = (mongoose.models.User as IUserModel) ||
             mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * CREATE NEW USER:
 * 
 * const user = await User.create({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   fullName: 'John Doe',
 * });
 * 
 * 
 * FIND USER AND VERIFY PASSWORD:
 * 
 * const user = await User.findByEmail('user@example.com').select('+password');
 * const isMatch = await user.comparePassword('candidatePassword');
 * 
 * 
 * GENERATE VERIFICATION TOKEN:
 * 
 * const token = user.generateEmailVerificationToken();
 * await user.save();
 * // Send token via email
 * 
 * 
 * VERIFY EMAIL:
 * 
 * const user = await User.findByVerificationToken(token);
 * if (user) {
 *   user.emailVerified = true;
 *   user.emailVerificationToken = undefined;
 *   await user.save();
 * }
 * 
 * 
 * HANDLE FAILED LOGIN:
 * 
 * if (user.isLocked()) {
 *   throw new Error('Account is locked. Try again later.');
 * }
 * await user.incrementLoginAttempts();
 * 
 * 
 * SUCCESSFUL LOGIN:
 * 
 * await user.resetLoginAttempts();
 * user.lastLoginAt = new Date();
 * user.lastLoginIp = req.ip;
 * await user.save();
 */
