const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'db_fallback.json');

app.use(cors());
app.use(express.json());

let USE_LOCAL_DB = false;
let localState = { events: {}, participants: [], coupons: [], leaderboard: {}, audit: [] };

// Load initial local state
if (fs.existsSync(DB_PATH)) {
    try { localState = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch(e) { console.error("Error loading local DB:", e.message); }
}

const saveLocal = () => fs.writeFileSync(DB_PATH, JSON.stringify(localState, null, 2));

dns.setDefaultResultOrder('ipv4first');

// --- MONGODB_URI (SRV with IPv4 Preference) ---
async function connectDB(retries = 1) {
    const uri = process.env.MONGODB_URI || "mongodb+srv://gagner_sports:gagner2026sports@gagnersports.nxw3p4l.mongodb.net/gagnersports";

    for (let i = 1; i <= retries; i++) {
        try {
            console.log(`📡 [Attempt ${i}/1] Connecting to Atlas (Database: gagnersports)...`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
            console.log('\x1b[32m%s\x1b[0m', '------------------------------------------------');
            console.log('\x1b[32m%s\x1b[0m', '🚀 GREEN: Connection 100% stable (Atlas SRV)');
            console.log('\x1b[32m%s\x1b[0m', '✅ Status: Authentication Successful');
            console.log('\x1b[32m%s\x1b[0m', '------------------------------------------------');
            
            await injectEliteData();
            return;
        } catch (err) {
            console.error('\x1b[31m%s\x1b[0m', `❌ [Failed] ${err.message}`);
            if (i === retries) {
                console.warn('\x1b[33m%s\x1b[0m', '⚠️  NOTICE: Persistent DNS/Atlas block. Pivoting to LOCAL SYNC mode (db_fallback.json).');
                USE_LOCAL_DB = true;
                await injectEliteData(); // Inject data into localState if DB connection fails
                return;
            }
            console.log('⏳ Retrying in 2 seconds...');
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

connectDB();

// --- Schemas & Models ---
const categorySchema = new mongoose.Schema({ name: String, price: String, details: [String], prizes: Map }, { _id: false });
const eventSchema = new mongoose.Schema({ slug: { type: String, unique: true }, title: String, tag: String, date: String, time: String, venue: String, bgImg: String, desc: String, categories: [categorySchema], deliverables: [String], registrationOpen: { type: Boolean, default: true }, archived: { type: Boolean, default: false }, isDraft: { type: Boolean, default: false }, status: { type: String, enum: ['Open', 'Closed', 'Sold Out', 'Coming Soon'], default: 'Open' }, registeredCount: { type: Number, default: 0 }, latLng: { lat: Number, lng: Number }, completedDate: String, capacity: Number, createdAt: { type: String, default: () => new Date().toISOString() } });
const Event = mongoose.model('Event', eventSchema);
const Participant = mongoose.model('Participant', new mongoose.Schema({ id: String, name: String, email: String, phone: String, city: String, gender: String, ageGroup: String, eventSlug: String, eventName: String, category: String, paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' }, registeredAt: { type: String, default: () => new Date().toISOString() } }));
const Coupon = mongoose.model('Coupon', new mongoose.Schema({ id: String, code: { type: String, unique: true }, discountType: { type: String, enum: ['percent', 'fixed'] }, discountValue: Number, discountPercent: Number, maxUses: Number, usedCount: { type: Number, default: 0 }, expiryDate: String, active: { type: Boolean, default: true }, createdAt: { type: String, default: () => new Date().toISOString() }, eventId: String }));
const Audit = mongoose.model('Audit', new mongoose.Schema({ timestamp: { type: String, default: () => new Date().toISOString() }, user: String, action: String, target: String, details: String }));
const Leaderboard = mongoose.model('Leaderboard', new mongoose.Schema({ eventSlug: { type: String, unique: true }, winners: [{ name: String, time: String }] }));

async function injectEliteData() {
    try {
        let eventsCount = 0;
        let pCount = 0;
        let cCount = 0;

        if (!USE_LOCAL_DB) {
            eventsCount = await Event.countDocuments();
            pCount = await Participant.countDocuments();
            cCount = await Coupon.countDocuments();
        } else {
            eventsCount = Object.keys(localState.events).length;
            pCount = localState.participants.length;
            cCount = localState.coupons.length;
        }

        if (eventsCount === 0) {
            console.log('🚢 DATA: Injecting elite events...');
            const realEvents = [
                { slug: 'chennai-juniorthon-2026', title: 'Chennai Juniorthon 2026', tag: 'KIDS', date: '2026-06-15', time: '06:00 AM', venue: 'Island Grounds, Chennai', bgImg: '/src/assets/images/chennai_juniorthon.png', desc: 'India’s largest junior run.', registrationOpen: true, status: 'Open', deliverables: ['Finisher Medal', 'Breakfast'], categories: [{ name: 'Kid (1-4km)', price: '650' }] },
                { slug: 'womens-day-run-2026', title: 'Women\'s Day Run 2026', tag: 'FITNESS', date: '2026-03-08', time: '05:30 AM', venue: 'Marina Beach, Chennai', bgImg: '/src/assets/images/womens_day_run.png', desc: 'Fitness celebration.', registrationOpen: true, status: 'Open', categories: [{ name: '5K Run', price: '499' }] },
                { slug: 'health-day-run-2026', title: 'Health Day Run 2026', tag: 'FAMILY', date: '2026-04-07', time: '05:45 AM', venue: 'Besant Nagar, Chennai', bgImg: '/src/assets/images/health_day_run.png', desc: 'Community run.', registrationOpen: true, status: 'Open' },
                { slug: 'fathers-day-marathon-2026', title: 'Father\'s Day Marathon 2026', tag: 'CORPORATE', date: '2026-06-21', time: '06:15 AM', venue: 'VGP Universal Kingdom', bgImg: '/src/assets/images/fathers_day_marathon.png', desc: 'Bonding marathon.', registrationOpen: true, status: 'Open' }
            ];
            if (!USE_LOCAL_DB) await Event.insertMany(realEvents);
            else { realEvents.forEach(e => localState.events[e.slug] = e); }
        }

        if (pCount === 0) {
            console.log('🚢 DATA: Injecting initial participants...');
            const parts = [
                { id: 'P001', name: 'Rahul Subramanian', email: 'rahul.s@gmail.com', phone: '9840512345', city: 'Chennai', gender: 'Male', ageGroup: '18-35', eventSlug: 'chennai-juniorthon-2026', eventName: 'Chennai Juniorthon 2026', category: 'Kid (1-4km)', paymentStatus: 'Paid', registeredAt: new Date().toISOString() },
                { id: 'P002', name: 'Ananya Iyer', email: 'ananya.iyer@outlook.com', phone: '9600154321', city: 'Chennai', gender: 'Female', ageGroup: '18-35', eventSlug: 'womens-day-run-2026', eventName: 'Women\'s Day Run 2026', category: '5K Run', paymentStatus: 'Paid', registeredAt: new Date().toISOString() }
            ];
            if (!USE_LOCAL_DB) await Participant.insertMany(parts);
            else { localState.participants = parts; }
        }

        if (cCount === 0) {
            console.log('🚢 DATA: Injecting initial coupons...');
            const coupons = [
                { id: 'C01', code: 'GAGNER10', discountType: 'percent', discountPercent: 10, maxUses: 100, usedCount: 5, active: true, expiryDate: '2026-12-31', createdAt: new Date().toISOString() },
                { id: 'C02', code: 'PROMO20', discountType: 'percent', discountPercent: 20, maxUses: 50, usedCount: 10, active: true, expiryDate: '2026-11-30', createdAt: new Date().toISOString() }
            ];
            if (!USE_LOCAL_DB) await Coupon.insertMany(coupons);
            else { localState.coupons = coupons; }
        }

        if (USE_LOCAL_DB) saveLocal();
        
        console.log('\x1b[32m%s\x1b[0m', `✅ INJECTION: Data Sync complete (${USE_LOCAL_DB ? 'LOCAL' : 'ATLAS'}).`);
    } catch (e) { console.error('❌ INJECTION ERROR:', e.message); }
}

// API
app.get('/api/events', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) return res.json(localState.events);
        const e = await Event.find(); 
        const o = {}; e.forEach(x => o[x.slug] = x); 
        res.json(o); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.post('/api/events-batch', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) { localState.events = req.body; saveLocal(); return res.json({ success: true }); }
        await Event.deleteMany({}); 
        await Event.insertMany(Object.values(req.body)); 
        res.status(200).json({ success: true }); 
    } catch (e) { console.error('BATCH ERROR:', e.message); res.status(500).json({ error: e.message }); } 
});

app.get('/api/participants', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) return res.json(localState.participants);
        res.json(await Participant.find()); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.post('/api/participants', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) { localState.participants.push(req.body); saveLocal(); return res.status(201).json({ success: true }); }
        await new Participant(req.body).save(); 
        res.status(201).json({ success: true }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.get('/api/coupons', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) return res.json(localState.coupons);
        res.json(await Coupon.find()); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.post('/api/coupons', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) { localState.coupons = Array.isArray(req.body) ? req.body : [req.body]; saveLocal(); return res.json({ success: true }); }
        await Coupon.deleteMany({}); 
        await Coupon.insertMany(Array.isArray(req.body) ? req.body : [req.body]); 
        res.status(200).json({ success: true }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.get('/api/leaderboard', async (req, res) => { 
    try { 
        if (USE_LOCAL_DB) return res.json(localState.leaderboard);
        const lb = await Leaderboard.find(); 
        const o = {}; lb.forEach(x => o[x.eventSlug] = x.winners); 
        res.json(o); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.post('/api/leaderboard', async (req, res) => { 
    try { 
        const { eventSlug, winners } = req.body;
        if (USE_LOCAL_DB) { localState.leaderboard[eventSlug] = winners; saveLocal(); return res.json({ success: true }); }
        await Leaderboard.findOneAndUpdate({ eventSlug }, { winners }, { upsert: true }); 
        res.status(200).json({ success: true }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.listen(PORT, () => { console.log(`🚀 Gagner Sports Backend Running at http://localhost:${PORT}`); });
