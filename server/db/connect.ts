// /server/db/connect.ts
// MongoDB Connection Utility for GALLA.GOLD Application
// Purpose: Establish and manage MongoDB connection with proper error handling and connection pooling
// Uses Mongoose ODM for schema validation and type safety

import mongoose from "mongoose";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "gallagold";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// =============================================================================
// CONNECTION CACHING FOR SERVERLESS ENVIRONMENTS
// =============================================================================

/**
 * In serverless environments like Vercel/AWS Lambda, functions are stateless.
 * We cache the MongoDB connection in the global scope to reuse across function invocations.
 * This prevents creating a new connection for every request, which is slow and inefficient.
 */

// Extend the global object to include our cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize cache
let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

// =============================================================================
// CONNECTION OPTIONS
// =============================================================================

/**
 * Mongoose connection options
 * These options optimize connection pooling and error handling
 */
const options: mongoose.ConnectOptions = {
  // Database name
  dbName: MONGODB_DB,

  // Buffer commands when disconnected (useful during connection issues)
  bufferCommands: false,

  // Maximum number of connections in the pool
  maxPoolSize: 10,

  // Minimum number of connections in the pool
  minPoolSize: 2,

  // Close connections after this many milliseconds of inactivity
  socketTimeoutMS: 45000,

  // Number of retries for failed operations
  serverSelectionTimeoutMS: 5000,

  // Automatically create indexes for better performance
  autoIndex: process.env.NODE_ENV !== "production",
};

// =============================================================================
// MAIN CONNECTION FUNCTION
// =============================================================================

/**
 * Connect to MongoDB database
 * Reuses existing connection if available, otherwise creates a new one
 * @returns Promise<typeof mongoose> - Mongoose instance
 */
export async function connectDB(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cached.conn) {
    console.log("📦 Using cached MongoDB connection");
    return cached.conn;
  }

  // If we don't have a connection promise, create one
  if (!cached.promise) {
    console.log("🔌 Creating new MongoDB connection...");

    cached.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        throw error;
      });
  }

  // Wait for the connection promise to resolve
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise if connection fails
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

// =============================================================================
// CONNECTION EVENT HANDLERS
// =============================================================================

/**
 * Set up event listeners for MongoDB connection
 * These help with debugging and monitoring
 */
if (process.env.NODE_ENV === "development") {
  mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Mongoose connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ Mongoose disconnected from MongoDB");
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("🛑 Mongoose connection closed due to app termination");
    process.exit(0);
  });
}

// =============================================================================
// DATABASE STATUS UTILITY
// =============================================================================

/**
 * Check if MongoDB is connected
 * @returns boolean - True if connected, false otherwise
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get current connection status
 * @returns string - Connection status description
 */
export function getConnectionStatus(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}

/**
 * Disconnect from MongoDB
 * Useful for cleaning up in tests or scripts
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    console.log("🔌 MongoDB disconnected");
  }
}

// =============================================================================
// EXPORT FOR USE IN APPLICATION
// =============================================================================

export default connectDB;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * BASIC USAGE:
 *
 * import { connectDB } from '@/server/db/connect';
 *
 * export async function GET() {
 *   await connectDB();
 *   const users = await User.find();
 *   return Response.json(users);
 * }
 *
 *
 * WITH ERROR HANDLING:
 *
 * try {
 *   await connectDB();
 *   const user = await User.findById(id);
 * } catch (error) {
 *   console.error('Database error:', error);
 *   return Response.json({ error: 'Database error' }, { status: 500 });
 * }
 *
 *
 * CHECK CONNECTION STATUS:
 *
 * import { isConnected, getConnectionStatus } from '@/server/db/connect';
 *
 * if (!isConnected()) {
 *   console.log('Status:', getConnectionStatus());
 *   await connectDB();
 * }
 *
 *
 * NOTES:
 * - Connection is automatically reused across serverless function invocations
 * - No need to manually close connections (handled by serverless platform)
 * - Connection pooling is configured for optimal performance
 * - In development, connection events are logged for debugging
 */
