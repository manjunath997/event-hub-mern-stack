/**
 * Creates a default admin user if it does not exist.
 * Usage: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const DEFAULT_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@events.local';
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const DEFAULT_NAME = process.env.SEED_ADMIN_NAME || 'Admin User';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log('Updated existing user to admin:', DEFAULT_EMAIL);
    } else {
      console.log('Admin already exists:', DEFAULT_EMAIL);
    }
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: DEFAULT_NAME,
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    role: 'admin',
  });

  console.log('Admin created:', DEFAULT_EMAIL, '| password:', DEFAULT_PASSWORD);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
