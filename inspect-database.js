// inspect-database.js
// Check what's in your MongoDB database
// Run with: node inspect-database.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function inspectDatabase() {
  try {
    console.log('[*] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log('============================================================');
    console.log('DATABASE:', dbName);
    console.log('============================================================\n');

    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('[*] Collections found:', collections.length);
    collections.forEach(col => {
      console.log('  -', col.name);
    });
    console.log('');

    // Check users
    console.log('============================================================');
    console.log('USERS COLLECTION');
    console.log('============================================================');
    
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('[*] Total users:', userCount);
    
    if (userCount > 0) {
      const users = await usersCollection.find({}).limit(10).toArray();
      
      console.log('\n[*] User Details:\n');
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log('  Email:', user.email);
        console.log('  Name:', user.firstName, user.lastName);
        console.log('  Password hash length:', user.password ? user.password.length : 'NO PASSWORD!');
        console.log('  Password starts with:', user.password ? user.password.substring(0, 7) : 'N/A');
        console.log('  Email verified:', user.emailVerified);
        console.log('  Created:', user.createdAt);
        console.log('  Role:', user.role);
        console.log('');
      });

      // Check password format
      const firstUser = users[0];
      if (firstUser && firstUser.password) {
        const isBcrypt = firstUser.password.startsWith('$2a$') || 
                        firstUser.password.startsWith('$2b$');
        console.log('[INFO] Password format check:');
        console.log('  Bcrypt format:', isBcrypt ? 'YES' : 'NO - PROBLEM!');
        
        if (!isBcrypt) {
          console.log('  [WARNING] Passwords are NOT bcrypt hashed!');
          console.log('  [WARNING] This will cause login failures!');
          console.log('  [FIX] Delete all users and create new accounts');
        }
      }
    } else {
      console.log('[INFO] No users found in database');
      console.log('[INFO] This is why login fails with "Invalid credentials"');
      console.log('[FIX] Go to /signup and create a new account');
    }

    // Check wallets
    console.log('\n============================================================');
    console.log('WALLETS COLLECTION');
    console.log('============================================================');
    
    const walletsCollection = db.collection('wallets');
    const walletCount = await walletsCollection.countDocuments();
    console.log('[*] Total wallets:', walletCount);

    if (walletCount > 0) {
      const wallets = await walletsCollection.find({}).limit(5).toArray();
      console.log('\n[*] Sample wallets:');
      wallets.forEach((wallet, index) => {
        console.log(`  Wallet ${index + 1}: UserID ${wallet.userId}, Balance USD: $${wallet.balance?.USD || 0}`);
      });
    }

    // Check indexes
    console.log('\n============================================================');
    console.log('INDEX INFORMATION');
    console.log('============================================================');
    
    if (userCount > 0) {
      const userIndexes = await usersCollection.indexes();
      console.log('\n[*] User indexes:', userIndexes.length);
      userIndexes.forEach(idx => {
        console.log('  -', idx.name, ':', JSON.stringify(idx.key));
      });
      
      // Check for duplicates
      const emailIndexes = userIndexes.filter(idx => idx.key.email);
      if (emailIndexes.length > 1) {
        console.log('\n  [WARNING] Multiple email indexes found!');
        console.log('  [FIX] Run: node cleanup-mongodb-indexes.js');
      }
    }

    if (walletCount > 0) {
      const walletIndexes = await walletsCollection.indexes();
      console.log('\n[*] Wallet indexes:', walletIndexes.length);
      walletIndexes.forEach(idx => {
        console.log('  -', idx.name, ':', JSON.stringify(idx.key));
      });
    }

    console.log('\n============================================================');
    console.log('SUMMARY');
    console.log('============================================================');
    console.log('[*] Database name:', dbName);
    console.log('[*] Users:', userCount);
    console.log('[*] Wallets:', walletCount);
    console.log('[*] Collections:', collections.length);
    
    if (userCount === 0) {
      console.log('\n[ACTION REQUIRED]');
      console.log('1. No users found in database');
      console.log('2. Go to http://localhost:3000/signup');
      console.log('3. Create a new account');
      console.log('4. Then try login');
    } else {
      console.log('\n[NEXT STEPS]');
      console.log('1. Check if password format is bcrypt (should start with $2a$ or $2b$)');
      console.log('2. If not bcrypt, delete users and recreate accounts');
      console.log('3. If bcrypt is correct, check your .env.local for NEXTAUTH_SECRET');
    }

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n[*] Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run inspection
inspectDatabase();
