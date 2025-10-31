// /server/models/Wallet.ts
// Wallet Model for GALLA.GOLD Application
// Purpose: Manage user balances in multiple currencies and gold holdings
// Each user has one wallet with multiple currency balances

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Currency balance subdocument interface
 */
export interface ICurrencyBalance {
  currency: 'USD' | 'EUR' | 'GBP' | 'EGP' | 'AED' | 'SAR';
  amount: number;
  lastUpdated: Date;
}

/**
 * Wallet document interface
 */
export interface IWallet extends Document {
  userId: Types.ObjectId; // Reference to User model
  
  // Currency balances (cash)
  balances: ICurrencyBalance[];
  
  // Gold holdings (in grams)
  goldBalance: number;
  goldLastUpdated: Date;
  
  // Average purchase price for gold (for profit/loss calculation)
  goldAveragePurchasePrice: number;
  
  // Total value cache (for performance)
  totalValueUSD: number; // Total value in USD
  lastValueUpdate: Date;
  
  // Account limits and restrictions
  dailyDepositLimit: number;
  dailyWithdrawalLimit: number;
  dailyTradingLimit: number;
  
  // Daily totals (reset at midnight UTC)
  dailyDepositTotal: number;
  dailyWithdrawalTotal: number;
  dailyTradingTotal: number;
  dailyResetDate: Date;
  
  // Status flags
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  getBalance(currency: string): number;
  setBalance(currency: string, amount: number): Promise<void>;
  addToBalance(currency: string, amount: number): Promise<void>;
  subtractFromBalance(currency: string, amount: number): Promise<void>;
  hasBalance(currency: string, amount: number): boolean;
  resetDailyLimits(): Promise<void>;
  checkDailyLimit(type: 'deposit' | 'withdrawal' | 'trading', amount: number): boolean;
  updateDailyTotal(type: 'deposit' | 'withdrawal' | 'trading', amount: number): Promise<void>;
}

/**
 * Wallet model interface with static methods
 */
export interface IWalletModel extends Model<IWallet> {
  findByUserId(userId: string | Types.ObjectId): Promise<IWallet | null>;
  createForUser(userId: string | Types.ObjectId): Promise<IWallet>;
}

// =============================================================================
// SUBDOCUMENT SCHEMA
// =============================================================================

/**
 * Currency balance subdocument schema
 */
const CurrencyBalanceSchema = new Schema<ICurrencyBalance>(
  {
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'EGP', 'AED', 'SAR'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Don't create _id for subdocuments
);

// =============================================================================
// MAIN SCHEMA DEFINITION
// =============================================================================

const WalletSchema = new Schema<IWallet, IWalletModel>(
  {
    // -------------------------------------------------------------------------
    // USER REFERENCE
    // -------------------------------------------------------------------------
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One wallet per user
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // CURRENCY BALANCES
    // -------------------------------------------------------------------------
    balances: {
      type: [CurrencyBalanceSchema],
      default: [
        { currency: 'USD', amount: 0 },
        { currency: 'EUR', amount: 0 },
        { currency: 'GBP', amount: 0 },
        { currency: 'EGP', amount: 0 },
      ],
    },
    
    // -------------------------------------------------------------------------
    // GOLD HOLDINGS
    // -------------------------------------------------------------------------
    goldBalance: {
      type: Number,
      default: 0,
      min: [0, 'Gold balance cannot be negative'],
    },
    
    goldLastUpdated: {
      type: Date,
      default: Date.now,
    },
    
    goldAveragePurchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    
    // -------------------------------------------------------------------------
    // TOTAL VALUE CACHE (for dashboard performance)
    // -------------------------------------------------------------------------
    totalValueUSD: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    lastValueUpdate: {
      type: Date,
      default: Date.now,
    },
    
    // -------------------------------------------------------------------------
    // ACCOUNT LIMITS (in USD)
    // -------------------------------------------------------------------------
    dailyDepositLimit: {
      type: Number,
      default: 50000, // $50,000 per day
      min: 0,
    },
    
    dailyWithdrawalLimit: {
      type: Number,
      default: 50000, // $50,000 per day
      min: 0,
    },
    
    dailyTradingLimit: {
      type: Number,
      default: 100000, // $100,000 per day
      min: 0,
    },
    
    // -------------------------------------------------------------------------
    // DAILY TOTALS (reset at midnight UTC)
    // -------------------------------------------------------------------------
    dailyDepositTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    dailyWithdrawalTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    dailyTradingTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    dailyResetDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        return date;
      },
    },
    
    // -------------------------------------------------------------------------
    // STATUS FLAGS
    // -------------------------------------------------------------------------
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    isFrozen: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    frozenReason: String,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES
// =============================================================================

WalletSchema.index({ userId: 1 });
WalletSchema.index({ isActive: 1, isFrozen: 1 });

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Get balance for a specific currency
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns number - Balance amount
 */
WalletSchema.methods.getBalance = function (currency: string): number {
  const balance = this.balances.find((b: ICurrencyBalance) => b.currency === currency);
  return balance ? balance.amount : 0;
};

/**
 * Set balance for a specific currency
 * @param currency - Currency code
 * @param amount - New balance amount
 */
WalletSchema.methods.setBalance = async function (
  currency: string,
  amount: number
): Promise<void> {
  const balance = this.balances.find((b: ICurrencyBalance) => b.currency === currency);
  
  if (balance) {
    balance.amount = amount;
    balance.lastUpdated = new Date();
  } else {
    this.balances.push({
      currency,
      amount,
      lastUpdated: new Date(),
    });
  }
  
  await this.save();
};

/**
 * Add to existing balance
 * @param currency - Currency code
 * @param amount - Amount to add
 */
WalletSchema.methods.addToBalance = async function (
  currency: string,
  amount: number
): Promise<void> {
  const currentBalance = this.getBalance(currency);
  await this.setBalance(currency, currentBalance + amount);
};

/**
 * Subtract from existing balance
 * @param currency - Currency code
 * @param amount - Amount to subtract
 */
WalletSchema.methods.subtractFromBalance = async function (
  currency: string,
  amount: number
): Promise<void> {
  const currentBalance = this.getBalance(currency);
  
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  await this.setBalance(currency, currentBalance - amount);
};

/**
 * Check if wallet has sufficient balance
 * @param currency - Currency code
 * @param amount - Required amount
 * @returns boolean - True if sufficient balance
 */
WalletSchema.methods.hasBalance = function (
  currency: string,
  amount: number
): boolean {
  return this.getBalance(currency) >= amount;
};

/**
 * Reset daily limits if date has changed
 */
WalletSchema.methods.resetDailyLimits = async function (): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  if (this.dailyResetDate < today) {
    this.dailyDepositTotal = 0;
    this.dailyWithdrawalTotal = 0;
    this.dailyTradingTotal = 0;
    this.dailyResetDate = today;
    await this.save();
  }
};

/**
 * Check if amount is within daily limit
 * @param type - Transaction type
 * @param amount - Transaction amount (in USD)
 * @returns boolean - True if within limit
 */
WalletSchema.methods.checkDailyLimit = function (
  type: 'deposit' | 'withdrawal' | 'trading',
  amount: number
): boolean {
  switch (type) {
    case 'deposit':
      return this.dailyDepositTotal + amount <= this.dailyDepositLimit;
    case 'withdrawal':
      return this.dailyWithdrawalTotal + amount <= this.dailyWithdrawalLimit;
    case 'trading':
      return this.dailyTradingTotal + amount <= this.dailyTradingLimit;
    default:
      return false;
  }
};

/**
 * Update daily total for transaction type
 * @param type - Transaction type
 * @param amount - Transaction amount (in USD)
 */
WalletSchema.methods.updateDailyTotal = async function (
  type: 'deposit' | 'withdrawal' | 'trading',
  amount: number
): Promise<void> {
  await this.resetDailyLimits();
  
  switch (type) {
    case 'deposit':
      this.dailyDepositTotal += amount;
      break;
    case 'withdrawal':
      this.dailyWithdrawalTotal += amount;
      break;
    case 'trading':
      this.dailyTradingTotal += amount;
      break;
  }
  
  await this.save();
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find wallet by user ID
 * @param userId - User ID (string or ObjectId)
 * @returns Promise<IWallet | null>
 */
WalletSchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Create wallet for new user
 * @param userId - User ID
 * @returns Promise<IWallet>
 */
WalletSchema.statics.createForUser = function (userId: string | Types.ObjectId) {
  return this.create({ userId });
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Wallet = (mongoose.models.Wallet as IWalletModel) ||
               mongoose.model<IWallet, IWalletModel>('Wallet', WalletSchema);

export default Wallet;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * CREATE WALLET FOR NEW USER:
 * 
 * const wallet = await Wallet.createForUser(userId);
 * 
 * 
 * GET USER WALLET:
 * 
 * const wallet = await Wallet.findByUserId(userId);
 * 
 * 
 * CHECK BALANCE:
 * 
 * const usdBalance = wallet.getBalance('USD');
 * const hasEnough = wallet.hasBalance('USD', 100);
 * 
 * 
 * UPDATE BALANCE:
 * 
 * await wallet.addToBalance('USD', 500); // Add $500
 * await wallet.subtractFromBalance('EUR', 100); // Subtract €100
 * 
 * 
 * CHECK DAILY LIMITS:
 * 
 * await wallet.resetDailyLimits();
 * const canDeposit = wallet.checkDailyLimit('deposit', 1000);
 * if (canDeposit) {
 *   await wallet.updateDailyTotal('deposit', 1000);
 * }
 * 
 * 
 * BUY GOLD:
 * 
 * const goldGrams = 10;
 * const pricePerGram = 65;
 * const totalCost = goldGrams * pricePerGram;
 * 
 * await wallet.subtractFromBalance('USD', totalCost);
 * wallet.goldBalance += goldGrams;
 * await wallet.save();
 */
