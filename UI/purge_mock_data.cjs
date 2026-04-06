const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// DNS Override for stability
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = "mongodb+srv://gagnersports:Gagner%40123@cluster0.pwjaof4.mongodb.net/gagnersports?appName=Cluster0&retryWrites=true&w=majority";

const mockKeywords = ['test', 'mock', 'dummy', 'antigravity', 'dojo', '123', 'abc'];
const mockRegex = new RegExp(mockKeywords.join('|'), 'i');

async function purgeData() {
    try {
        console.log('📡 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected to:', mongoose.connection.name);

        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        console.log('📦 Databases:', dbs.databases.map(d => d.name));

        const collectionsList = await mongoose.connection.db.listCollections().toArray();
        console.log('📦 Collections in current DB:', collectionsList.map(c => c.name));

        const collections = [
            { name: 'events', model: mongoose.model('Event', new mongoose.Schema({}, { strict: false })) },
            { name: 'participants', model: mongoose.model('Participant', new mongoose.Schema({}, { strict: false })) },
            { name: 'contents', model: mongoose.model('Content', new mongoose.Schema({}, { strict: false })) },
            { name: 'users', model: mongoose.model('User', new mongoose.Schema({}, { strict: false })) },
            { name: 'audit', model: mongoose.model('Audit', new mongoose.Schema({}, { strict: false })) },
            { name: 'coupons', model: mongoose.model('Coupon', new mongoose.Schema({}, { strict: false })) }
        ];

        let totalDeleted = 0;
        const report = {};

        const filter = {
            $or: [
                { title: { $regex: mockRegex } },
                { name: { $regex: mockRegex } },
                { slug: { $regex: mockRegex } },
                { email: { $regex: mockRegex } },
                { code: { $regex: mockRegex } }
            ]
        };

        for (const col of collections) {
            console.log(`🔍 Inspecting ${col.name}...`);
            const allItems = await col.model.find({}).limit(10);
            console.log(`Found ${allItems.length} items in ${col.name}.`);
            allItems.forEach(item => {
                console.log(` - [${col.name}] ${JSON.stringify(item)}`);
            });

            const toDelete = await col.model.find(filter);
            if (toDelete.length > 0) {
                console.log(`⚠️ Found ${toDelete.length} mock records in ${col.name}:`);
                toDelete.forEach(item => {
                    console.log(`   - [DELETE] ${item.title || item.name || item.slug || item.email || item.code || item._id}`);
                });
            }

            const result = await col.model.deleteMany(filter);
            
            report[col.name] = result.deletedCount;
            totalDeleted += result.deletedCount;
            if (result.deletedCount > 0) {
                console.log(`🗑️  Permanently deleted ${result.deletedCount} records from ${col.name}.`);
            } else {
                console.log(`✅ No mock data found in ${col.name}.`);
            }
        }

        console.log('\n────────────────────────────────────────────────');
        console.log('🚀 PURGE COMPLETE: Final Report');
        console.log('────────────────────────────────────────────────');
        Object.entries(report).forEach(([name, count]) => {
            if (count > 0) console.log(`${name.padEnd(15)}: ${count} deleted`);
        });
        console.log(`✅ Total Mock Records Removed: ${totalDeleted}`);
        console.log('────────────────────────────────────────────────');

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ PURGE FAILURE:', err.message);
        process.exit(1);
    }
}

purgeData();
