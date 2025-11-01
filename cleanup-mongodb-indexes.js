// cleanup-mongodb-indexes.js
// Node.js script to clean up duplicate MongoDB indexes
// Run this with: node cleanup-mongodb-indexes.js

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function cleanupIndexes() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // ========================================================================
    // 1. USER COLLECTION - Remove duplicate email index
    // ========================================================================
    console.log("📋 Checking User collection indexes...");
    const userIndexes = await db.collection("users").indexes();
    console.log(
      "Current User indexes:",
      userIndexes.map((i) => i.name).join(", ")
    );

    // Drop the manual email_1 index (keep the one from unique constraint)
    try {
      await db.collection("users").dropIndex("email_1");
      console.log("✅ Dropped duplicate email_1 index from users");
    } catch (err) {
      if (err.code === 27) {
        console.log("ℹ️  email_1 index already removed or doesn't exist");
      } else {
        throw err;
      }
    }

    // ========================================================================
    // 2. WALLET COLLECTION - Remove duplicate userId index
    // ========================================================================
    console.log("\n📋 Checking Wallet collection indexes...");
    const walletIndexes = await db.collection("wallets").indexes();
    console.log(
      "Current Wallet indexes:",
      walletIndexes.map((i) => i.name).join(", ")
    );

    // Drop the manual userId_1 index (keep the one from unique constraint)
    try {
      await db.collection("wallets").dropIndex("userId_1");
      console.log("✅ Dropped duplicate userId_1 index from wallets");
    } catch (err) {
      if (err.code === 27) {
        console.log("ℹ️  userId_1 index already removed or doesn't exist");
      } else {
        throw err;
      }
    }

    // ========================================================================
    // 3. MFA COLLECTION - Remove duplicate userId index
    // ========================================================================
    console.log("\n📋 Checking MFA collection indexes...");
    try {
      const mfaIndexes = await db.collection("mfas").indexes();
      console.log(
        "Current MFA indexes:",
        mfaIndexes.map((i) => i.name).join(", ")
      );

      // Drop the manual userId_1 index (keep the one from unique constraint)
      try {
        await db.collection("mfas").dropIndex("userId_1");
        console.log("✅ Dropped duplicate userId_1 index from mfas");
      } catch (err) {
        if (err.code === 27) {
          console.log("ℹ️  userId_1 index already removed or doesn't exist");
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.log("ℹ️  MFA collection not found (might not exist yet)");
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ Index cleanup complete!");
    console.log("=".repeat(60));

    console.log("\n📊 Final index counts:");
    console.log(
      "Users:",
      (await db.collection("users").indexes()).length,
      "indexes"
    );
    console.log(
      "Wallets:",
      (await db.collection("wallets").indexes()).length,
      "indexes"
    );
    try {
      console.log(
        "MFAs:",
        (await db.collection("mfas").indexes()).length,
        "indexes"
      );
    } catch (err) {
      console.log("MFAs: Collection not found");
    }

    console.log(
      "\n✨ You can now restart your Next.js dev server without index warnings!"
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the cleanup
cleanupIndexes();
