const { MongoClient } = require('mongodb');
require('dotenv').config();

async function test() {
  const uri = process.env.MONGODB_URI;
  console.log(`📡 testing MongoClient with: ${uri.replace(/:.+@/, ':****@')}`);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ MongoClient: Connected successfully!');
    await client.close();
  } catch (err) {
    console.error('❌ MongoClient Error Object:', err);
  }
}
test();
