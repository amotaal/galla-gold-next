// /server/models/Price.ts
// Price Model for GALLA.GOLD Application
// Purpose: Store and track historical gold prices for charts, analytics, and trading decisions
// Provides time-series data for portfolio valuation and market analysis

import mongoose, { Schema, Document, Model } from "mongoose";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Price interval types
 */
export type PriceInterval =
  | "1m" // 1 minute
  | "5m" // 5 minutes
  | "15m" // 15 minutes
  | "1h" // 1 hour
  | "4h" // 4 hours
  | "1d" // 1 day
  | "1w"; // 1 week

/**
 * Metal types
 */
export type MetalType = "gold" | "silver" | "platinum" | "palladium";

/**
 * Price document interface
 */
export interface IPrice extends Document {
  // Metal information
  metal: MetalType;

  pricePerGram: number; // ✅ Add this

  // Price data (per gram in USD)
  price: number;
  open: number; // Opening price for interval
  high: number; // Highest price in interval
  low: number; // Lowest price in interval
  close: number; // Closing price for interval

  // Volume and market data
  volume?: number; // Trading volume
  marketCap?: number; // Market capitalization
  change: number; // Price change from previous interval
  changePercent: number; // Percentage change

  // Exchange rates (gold price in different currencies)
  priceUSD: number;
  priceEUR?: number;
  priceGBP?: number;
  priceEGP?: number;

  // Time information
  timestamp: Date;
  interval: PriceInterval;

  // Data source
  source: string; // API provider (e.g., 'metals-api', 'kitco', 'internal')

  // Metadata
  isRealtime: boolean; // True for live prices, false for historical
  isVerified: boolean; // True if data is verified/confirmed

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Price model interface with static methods
 */
export interface IPriceModel extends Model<IPrice> {
  getLatestPrice(metal?: MetalType): Promise<IPrice | null>;
  getPriceHistory(
    metal: MetalType,
    interval: PriceInterval,
    limit?: number
  ): Promise<IPrice[]>;
  getPriceRange(
    metal: MetalType,
    startDate: Date,
    endDate: Date
  ): Promise<IPrice[]>;
  getAveragePrice(metal: MetalType, days: number): Promise<number>;
  getPriceChange(
    metal: MetalType,
    hours: number
  ): Promise<{ change: number; changePercent: number }>;
}

// =============================================================================
// MAIN SCHEMA DEFINITION
// =============================================================================

const PriceSchema = new Schema<IPrice, IPriceModel>(
  {
    // -------------------------------------------------------------------------
    // METAL INFORMATION
    // -------------------------------------------------------------------------
    metal: {
      type: String,
      enum: ["gold", "silver", "platinum", "palladium"],
      default: "gold",
      required: true,
      index: true,
    },

    pricePerGram: {
      type: Number,
      required: true,
      min: 0,
    },

    // -------------------------------------------------------------------------
    // PRICE DATA (per gram in USD)
    // -------------------------------------------------------------------------
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be positive"],
    },

    open: {
      type: Number,
      required: true,
      min: 0,
    },

    high: {
      type: Number,
      required: true,
      min: 0,
    },

    low: {
      type: Number,
      required: true,
      min: 0,
    },

    close: {
      type: Number,
      required: true,
      min: 0,
    },

    // -------------------------------------------------------------------------
    // VOLUME AND MARKET DATA
    // -------------------------------------------------------------------------
    volume: {
      type: Number,
      min: 0,
    },

    marketCap: {
      type: Number,
      min: 0,
    },

    change: {
      type: Number,
      default: 0,
    },

    changePercent: {
      type: Number,
      default: 0,
    },

    // -------------------------------------------------------------------------
    // EXCHANGE RATES
    // -------------------------------------------------------------------------
    priceUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    priceEUR: {
      type: Number,
      min: 0,
    },

    priceGBP: {
      type: Number,
      min: 0,
    },

    priceEGP: {
      type: Number,
      min: 0,
    },

    // -------------------------------------------------------------------------
    // TIME INFORMATION
    // -------------------------------------------------------------------------
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    interval: {
      type: String,
      enum: ["1m", "5m", "15m", "1h", "4h", "1d", "1w"],
      required: true,
      index: true,
    },

    // -------------------------------------------------------------------------
    // DATA SOURCE
    // -------------------------------------------------------------------------
    source: {
      type: String,
      required: true,
      default: "internal",
    },

    // -------------------------------------------------------------------------
    // METADATA
    // -------------------------------------------------------------------------
    isRealtime: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES FOR TIME-SERIES QUERIES
// =============================================================================

// Compound indexes for efficient price queries
PriceSchema.index({ metal: 1, timestamp: -1 });
PriceSchema.index({ metal: 1, interval: 1, timestamp: -1 });
PriceSchema.index({ metal: 1, isRealtime: 1, timestamp: -1 });
PriceSchema.index({ timestamp: -1 });

// TTL index to automatically delete old data (optional)
// Uncomment to auto-delete prices older than 90 days
// PriceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Calculate change and changePercent before saving
 */
PriceSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Get previous price to calculate change
    const previousPrice = await (this.constructor as IPriceModel)
      .findOne({
        metal: this.metal,
        timestamp: { $lt: this.timestamp },
      })
      .sort({ timestamp: -1 });

    if (previousPrice) {
      this.change = this.price - previousPrice.price;
      this.changePercent = (this.change / previousPrice.price) * 100;
    }
  }
  next();
});

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get latest price for metal
 * @param metal - Metal type (default: gold)
 * @returns Promise<IPrice | null>
 */
PriceSchema.statics.getLatestPrice = function (metal: MetalType = "gold") {
  return this.findOne({ metal }).sort({ timestamp: -1 }).exec();
};

/**
 * Get price history for specific interval
 * @param metal - Metal type
 * @param interval - Price interval
 * @param limit - Number of records (default: 100)
 * @returns Promise<IPrice[]>
 */
PriceSchema.statics.getPriceHistory = function (
  metal: MetalType,
  interval: PriceInterval,
  limit: number = 100
) {
  return this.find({ metal, interval })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

/**
 * Get price range between dates
 * @param metal - Metal type
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Promise<IPrice[]>
 */
PriceSchema.statics.getPriceRange = function (
  metal: MetalType,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    metal,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: 1 })
    .exec();
};

/**
 * Get average price over number of days
 * @param metal - Metal type
 * @param days - Number of days to average
 * @returns Promise<number>
 */
PriceSchema.statics.getAveragePrice = async function (
  metal: MetalType,
  days: number
): Promise<number> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await this.aggregate([
    {
      $match: {
        metal,
        timestamp: { $gte: startDate },
        interval: "1d", // Use daily prices for average
      },
    },
    {
      $group: {
        _id: null,
        averagePrice: { $avg: "$price" },
      },
    },
  ]);

  return result[0]?.averagePrice || 0;
};

/**
 * Get price change over hours
 * @param metal - Metal type
 * @param hours - Number of hours
 * @returns Promise<{ change: number; changePercent: number }>
 */
PriceSchema.statics.getPriceChange = async function (
  metal: MetalType,
  hours: number
): Promise<{ change: number; changePercent: number }> {
  const currentPrice = await this.getLatestPrice(metal);
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const historicalPrice = await this.findOne({
    metal,
    timestamp: { $lte: startTime },
  })
    .sort({ timestamp: -1 })
    .exec();

  if (!currentPrice || !historicalPrice) {
    return { change: 0, changePercent: 0 };
  }

  const change = currentPrice.price - historicalPrice.price;
  const changePercent = (change / historicalPrice.price) * 100;

  return { change, changePercent };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Price =
  (mongoose.models.Price as IPriceModel) ||
  mongoose.model<IPrice, IPriceModel>("Price", PriceSchema);

export default Price;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * SAVE NEW PRICE:
 *
 * await Price.create({
 *   metal: 'gold',
 *   price: 65.50,
 *   open: 65.00,
 *   high: 66.00,
 *   low: 64.50,
 *   close: 65.50,
 *   priceUSD: 65.50,
 *   timestamp: new Date(),
 *   interval: '1h',
 *   source: 'metals-api',
 *   isRealtime: true,
 * });
 *
 *
 * GET LATEST PRICE:
 *
 * const latestPrice = await Price.getLatestPrice('gold');
 * console.log(`Current gold price: $${latestPrice.price}/g`);
 *
 *
 * GET PRICE HISTORY:
 *
 * const history = await Price.getPriceHistory('gold', '1h', 24); // Last 24 hours
 *
 *
 * GET PRICE CHANGE:
 *
 * const change24h = await Price.getPriceChange('gold', 24);
 * console.log(`24h change: ${change24h.changePercent.toFixed(2)}%`);
 *
 *
 * GET AVERAGE PRICE:
 *
 * const avg30days = await Price.getAveragePrice('gold', 30);
 * console.log(`30-day average: $${avg30days.toFixed(2)}/g`);
 *
 *
 * GET DATE RANGE:
 *
 * const prices = await Price.getPriceRange(
 *   'gold',
 *   new Date('2025-01-01'),
 *   new Date('2025-01-31')
 * );
 */
