const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// DNS Override for stability
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://gagner_sports:Gagner2026@gagnersports.nxw3p4l.mongodb.net/gagnersports?appName=gagnersports&retryWrites=true&w=majority";

async function runAudit() {
    try {
        console.log('📡 AUDIT: Connecting to Atlas Cluster (DNS Patch active)...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        
        // Ping
        const ping = await mongoose.connection.db.admin().command({ ping: 1 });
        console.log('✅ HEALTH CHECK: PING SUCCESSFUL', JSON.stringify(ping));

        // Define models only for count and preview
        const Event = mongoose.model('Event', new mongoose.Schema({ slug: String, title: String, tag: String, date: String, time: String, venue: String, bgImg: String, desc: String, categories: [Object], deliverables: [String], registrationOpen: Boolean, archived: Boolean, isDraft: Boolean, latLng: Object, capacity: Number, createdAt: String }, { strict: false }));
        const Participant = mongoose.model('Participant', new mongoose.Schema({ id: String, name: String, email: String, phone: String, city: String, gender: String, ageGroup: String, eventSlug: String, eventName: String, category: String, paymentStatus: String, registeredAt: String }, { strict: false }));
        const Coupon = mongoose.model('Coupon', new mongoose.Schema({ id: String, code: String, discountType: String, discountValue: Number, discountPercent: Number, maxUses: Number, usedCount: Number, expiryDate: String, active: Boolean, createdAt: String, eventId: String }, { strict: false }));

        const counts = {
            Events: await Event.countDocuments(),
            Participants: await Participant.countDocuments(),
            Coupons: await Coupon.countDocuments()
        };

        console.log('📊 DATA AUDIT: Current Counts', JSON.stringify(counts));

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
