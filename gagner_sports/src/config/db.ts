import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found in .env. Attempting fallback if configured.');
}

const connectDB = async (retries = 3): Promise<void> => {
  if (!MONGODB_URI) return;

  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`📡 [Attempt ${i}/${retries}] Connecting to MongoDB Atlas...`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log('────────────────────────────────────────────────');
      console.log('🚀 PROD CONNECTION: MongoDB Atlas - Connected');
      console.log(`📦 DB Name: ${mongoose.connection.db?.databaseName}`);
      console.log('────────────────────────────────────────────────');
      return;
    } catch (err: any) {
      console.error(`❌ [Attempt ${i}/${retries}] FAILURE: ${err.message}`);
      if (i === retries) {
        console.error('⚠️ ALL RETRIES EXHAUSTED: Could not connect to Atlas.');
        throw err;
      }
      console.log('⏳ Retrying in 5 seconds...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

export default connectDB;
