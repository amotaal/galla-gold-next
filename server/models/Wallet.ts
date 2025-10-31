// server/models/Wallet.ts
// Fixed Wallet model - REMOVED duplicate userId index
// Purpose: Wallet Model with multi-currency support and gold holdings

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { Balance } from '@/types/index';

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: Balance;
  
  gold: {
    grams: number;
    averagePurchasePrice: number;
    lastUpdated: Date;
  };
  
  totalValueUSD: number;
  lastValueUpdate: Date;
  
  dailyLimits: {
    deposit: number;
    withdrawal: number;
    goldPurchase: number;
    goldSale: number;
  };
  
  usedToday: {
    deposit: number;
    withdrawal: number;
    goldPurchase: number;
    goldSale: number;
  };
  
  lifetimeLimits: {
    deposit: number;
    withdrawal: number;
    goldPurchase: number;
    goldSale: number;
  };
  
  lastReset: Date;
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  getBalance(currency: string): number;
  setBalance(currency: string, amount: number): Promise<void>;
  addToBalance(currency: string, amount: number): Promise<void>;
  subtractFromBalance(currency: string, amount: number): Promise<void>;
  hasBalance(currency: string, amount: number): boolean;
  resetDailyLimits(): Promise<void>;
  checkDailyLimit(type: string, amount: number): boolean;
  updateDailyTotal(type: string, amount: number): Promise<void>;
}

export interface IWalletModel extends Model<IWallet> {
  findByUserId(userId: string | Types.ObjectId): Promise<IWallet | null>;
  createForUser(userId: string | Types.ObjectId): Promise<IWallet>;
}

const WalletSchema = new Schema<IWallet, IWalletModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      // ✅ FIX: Removed `index: true` here since we define it below with WalletSchema.index()
    },
    
    balance: {
      USD: { type: Number, default: 0 },
      EUR: { type: Number, default: 0 },
      GBP: { type: Number, default: 0 },
      EGP: { type: Number, default: 0 },
      AED: { type: Number, default: 0 },
      SAR: { type: Number, default: 0 },
    },
    
    gold: {
      grams: { type: Number, default: 0, min: 0 },
      averagePurchasePrice: { type: Number, default: 0, min: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    
    totalValueUSD: { type: Number, default: 0, min: 0 },
    lastValueUpdate: { type: Date, default: Date.now },
    
    dailyLimits: {
      deposit: { type: Number, default: 50000 },
      withdrawal: { type: Number, default: 25000 },
      goldPurchase: { type: Number, default: 100000 },
      goldSale: { type: Number, default: 100000 },
    },
    
    usedToday: {
      deposit: { type: Number, default: 0 },
      withdrawal: { type: Number, default: 0 },
      goldPurchase: { type: Number, default: 0 },
      goldSale: { type: Number, default: 0 },
    },
    
    lifetimeLimits: {
      deposit: { type: Number, default: 1000000 },
      withdrawal: { type: Number, default: 500000 },
      goldPurchase: { type: Number, default: 5000000 },
      goldSale: { type: Number, default: 5000000 },
    },
    
    lastReset: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isFrozen: { type: Boolean, default: false },
    frozenReason: String,
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes (defined here to avoid duplication)
WalletSchema.index({ userId: 1 });
WalletSchema.index({ isActive: 1, isFrozen: 1 });

// Instance Methods
WalletSchema.methods.getBalance = function (currency: string): number {
  return this.balance[currency as keyof Balance] || 0;
};

WalletSchema.methods.setBalance = async function (currency: string, amount: number): Promise<void> {
  this.balance[currency as keyof Balance] = amount;
  await this.save();
};

WalletSchema.methods.addToBalance = async function (currency: string, amount: number): Promise<void> {
  this.balance[currency as keyof Balance] = (this.balance[currency as keyof Balance] || 0) + amount;
  await this.save();
};

WalletSchema.methods.subtractFromBalance = async function (currency: string, amount: number): Promise<void> {
  this.balance[currency as keyof Balance] -= amount;
  await this.save();
};

WalletSchema.methods.hasBalance = function (currency: string, amount: number): boolean {
  return this.getBalance(currency) >= amount;
};

WalletSchema.methods.resetDailyLimits = async function (): Promise<void> {
  this.usedToday = {
    deposit: 0,
    withdrawal: 0,
    goldPurchase: 0,
    goldSale: 0,
  };
  this.lastReset = new Date();
  await this.save();
};

WalletSchema.methods.checkDailyLimit = function (type: string, amount: number): boolean {
  const used = this.usedToday[type as keyof typeof this.usedToday] || 0;
  const limit = this.dailyLimits[type as keyof typeof this.dailyLimits] || 0;
  return used + amount <= limit;
};

WalletSchema.methods.updateDailyTotal = async function (type: string, amount: number): Promise<void> {
  this.usedToday[type as keyof typeof this.usedToday] = (this.usedToday[type as keyof typeof this.usedToday] || 0) + amount;
  await this.save();
};

// Static Methods
WalletSchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

WalletSchema.statics.createForUser = function (userId: string | Types.ObjectId) {
  return this.create({ userId });
};

const Wallet = (mongoose.models.Wallet as IWalletModel) || mongoose.model<IWallet, IWalletModel>('Wallet', WalletSchema);

export default Wallet;
