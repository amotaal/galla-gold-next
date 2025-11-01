// cleanup-mongodb-indexes.js
// Node.js script to clean up duplicate MongoDB indexes
// Run this with: node cleanup-mongodb-indexes.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function cleanupIndexes() {
  try {
    console.log('[*] Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get the actual database name from connection
    const dbName = db.databaseName;
    console.log('[INFO] Database name:', dbName);

    // ========================================================================
    // 1. USER COLLECTION - Remove duplicate email index
    // ========================================================================
    console.log('\n[*] Checking User collection indexes...');
    try {
      const userIndexes = await db.collection('users').indexes();
      console.log('Current User indexes:', userIndexes.map(i => i.name).join(', '));

      // Drop the manual email_1 index (keep the one from unique constraint)
      try {
        await db.collection('users').dropIndex('email_1');
        console.log('[OK] Dropped duplicate email_1 index from users');
      } catch (err) {
        if (err.code === 27) {
          console.log('[INFO] email_1 index already removed or does not exist');
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err.codeName === 'NamespaceNotFound') {
        console.log('[INFO] Users collection not found yet - no indexes to clean');
      } else {
        throw err;
      }
    }

    // ========================================================================
    // 2. WALLET COLLECTION - Remove duplicate userId index
    // ========================================================================
    console.log('\n[*] Checking Wallet collection indexes...');
    try {
      const walletIndexes = await db.collection('wallets').indexes();
      console.log('Current Wallet indexes:', walletIndexes.map(i => i.name).join(', '));

      // Drop the manual userId_1 index (keep the one from unique constraint)
      try {
        await db.collection('wallets').dropIndex('userId_1');
        console.log('[OK] Dropped duplicate userId_1 index from wallets');
      } catch (err) {
        if (err.code === 27) {
          console.log('[INFO] userId_1 index already removed or does not exist');
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err.codeName === 'NamespaceNotFound') {
        console.log('[INFO] Wallets collection not found yet - no indexes to clean');
      } else {
        throw err;
      }
    }

    // ========================================================================
    // 3. MFA COLLECTION - Remove duplicate userId index
    // ========================================================================
    console.log('\n[*] Checking MFA collection indexes...');
    try {
      const mfaIndexes = await db.collection('mfas').indexes();
      console.log('Current MFA indexes:', mfaIndexes.map(i => i.name).join(', '));

      // Drop the manual userId_1 index (keep the one from unique constraint)
      try {
        await db.collection('mfas').dropIndex('userId_1');
        console.log('[OK] Dropped duplicate userId_1 index from mfas');
      } catch (err) {
        if (err.code === 27) {
          console.log('[INFO] userId_1 index already removed or does not exist');
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err.codeName === 'NamespaceNotFound') {
        console.log('[INFO] MFA collection not found yet - no indexes to clean');
      } else {
        throw err;
      }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('[OK] Index cleanup complete!');
    console.log('='.repeat(60));
    
    console.log('\n[*] Final index counts:');
    try {
      console.log('Users:', (await db.collection('users').indexes()).length, 'indexes');
    } catch (err) {
      console.log('Users: Collection not found');
    }
    try {
      console.log('Wallets:', (await db.collection('wallets').indexes()).length, 'indexes');
    } catch (err) {
      console.log('Wallets: Collection not found');
    }
    try {
      console.log('MFAs:', (await db.collection('mfas').indexes()).length, 'indexes');
    } catch (err) {
      console.log('MFAs: Collection not found');
    }

    console.log('\n[OK] You can now restart your Next.js dev server without index warnings!');

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n[*] Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupIndexes();
