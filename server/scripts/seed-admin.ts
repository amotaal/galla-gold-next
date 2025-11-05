// server/scripts/seed-admin.ts
// Purpose: Seed Initial Super Admin Account
// Run: npx ts-node server/scripts/seed-admin.ts

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gallagold.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedSuperAdmin() {
  console.log("🌱 Seeding Super Admin...\n");
  
  if (!ADMIN_PASSWORD) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable required");
    process.exit(1);
  }

  // Connect to MongoDB (adjust connection string as needed)
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✅ Connected to MongoDB\n");

  const User = mongoose.model("User");
  
  // Check if super admin exists
  const existing = await User.findOne({ role: "superadmin" });
  if (existing) {
    console.log("⚠️  Super admin already exists. Exiting.");
    process.exit(0);
  }

  // Create super admin
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await User.create({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    firstName: "Super",
    lastName: "Administrator",
    fullName: "Super Administrator",
    role: "superadmin",
    emailVerified: true,
    isActive: true,
    preferredCurrency: "USD",
    preferredLanguage: "en",
    locale: "en",
  });

  console.log("✅ Super Admin Created!");
  console.log(`Email: ${admin.email}`);
  console.log(`ID: ${admin._id}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seedSuperAdmin().catch(console.error);
