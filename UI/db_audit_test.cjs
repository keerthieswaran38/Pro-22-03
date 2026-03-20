const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

// Testing /test database (default for missing db in URI)
const uri = "mongodb+srv://gagner_sports:Gagner2026@gagnersports.nxw3p4l.mongodb.net/test?appName=gagnersports&retryWrites=true&w=majority";

async function runAudit() {
    try {
        console.log('📡 AUDIT: Connecting to Atlas Cluster (DB: test)...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        
        const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
        const Participant = mongoose.model('Participant', new mongoose.Schema({}, { strict: false }));
        const Coupon = mongoose.model('Coupon', new mongoose.Schema({}, { strict: false }));

        const counts = {
            Events: await Event.countDocuments(),
            Participants: await Participant.countDocuments(),
            Coupons: await Coupon.countDocuments()
        };

        console.log('📊 DATA AUDIT: Current Counts (test db)', JSON.stringify(counts));

        // Preview
        const preview = {
            Events: await Event.find().limit(2),
            Participants: await Participant.find().limit(2),
            Coupons: await Coupon.find().limit(2)
        };
        
        console.log('📦 PREVIEW:');
        console.log(JSON.stringify(preview, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ AUDIT FAILURE:', err.message);
        process.exit(1);
    }
}

runAudit();
