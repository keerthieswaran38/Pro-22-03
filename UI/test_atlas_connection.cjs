const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;

console.log('📡 Testing connection to Atlas...');
console.log('🔗 Database URI has been identified in .env');

async function test() {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('\x1b[32m%s\x1b[0m', '✅ SUCCESS: Successfully connected to MongoDB Atlas!');
        console.log('📦 Database:', mongoose.connection.db.databaseName);
        console.log('🚦 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', '❌ FAILURE: Could not connect to Atlas.');
        console.error('\x1b[31m%s\x1b[0m', `❌ Error Message: ${err.message}`);
        if (err.message.includes('white-list') || err.message.includes('IP address')) {
            console.warn('\x1b[33m%s\x1b[0m', '💡 TIP: Your current IP address is not whitelisted on Atlas.');
        }
        process.exit(1);
    }
}
test();
