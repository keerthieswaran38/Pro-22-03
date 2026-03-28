const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- CLOUDINARY CONFIG ---
const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name');

if (cloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('\x1b[36m%s\x1b[0m', '☁️  Cloudinary CDN: Configured & Ready');
} else {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Cloudinary CDN: Not configured. Image uploads will use URL-only mode. Set CLOUDINARY_* in .env to enable.');
}

const storage = cloudinaryConfigured
    ? new CloudinaryStorage({
        cloudinary,
        params: { folder: 'gagner_sports', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'], transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
    })
    : multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Fix DNS: use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

let isFallbackMode = false;
let fallbackData = {
    events: {},
    participants: [],
    coupons: [],
    content: [],
    leaderboard: {},
    audit: []
};

// Load fallback data from local JSON
function loadFallbackData() {
    try {
        const fs = require('fs');
        const path = require('path');
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'db_fallback.json'), 'utf8'));
        fallbackData = { ...fallbackData, ...data };
        console.log('\x1b[33m%s\x1b[0m', '📂 LOCAL DATA LOADED: Fallback data initialized from db_fallback.json');
    } catch (err) {
        console.error('⚠️ Could not load db_fallback.json:', err.message);
    }
}

// --- MONGODB CONNECTION (Production-Grade with Smart Fallback) ---
async function connectDB(retries = 3) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('\x1b[31m%s\x1b[0m', '❌ FATAL: MONGODB_URI not found in .env file. Server cannot start without a database.');
        process.exit(1);
    }

    for (let i = 1; i <= retries; i++) {
        try {
            console.log(`📡 [Attempt ${i}/${retries}] Connecting to MongoDB Atlas...`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
            console.log('\x1b[32m%s\x1b[0m', '────────────────────────────────────────────────');
            console.log('\x1b[32m%s\x1b[0m', '🚀 CONNECTED: MongoDB Atlas (Production)');
            console.log('\x1b[32m%s\x1b[0m', '✅ Status: Authenticated & Authorized');
            console.log('\x1b[32m%s\x1b[0m', `📦 Database: ${mongoose.connection.db.databaseName}`);
            console.log('\x1b[32m%s\x1b[0m', '────────────────────────────────────────────────');
            isFallbackMode = false;
            return;
        } catch (err) {
            console.error('\x1b[31m%s\x1b[0m', `❌ [Attempt ${i}/${retries}] ${err.message}`);
            if (i === retries) {
                console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: Could not connect to MongoDB Atlas after all retries.');
                console.warn('\x1b[33m%s\x1b[0m', '🚀 SWITCHING TO LOCAL FALLBACK MODE (Service limited to local data)');
                isFallbackMode = true;
                loadFallbackData();
                return;
            }
            console.log('⏳ Retrying in 3 seconds...');
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}

connectDB();

// --- Schemas & Models ---
const categorySchema = new mongoose.Schema(
    { name: String, price: String, details: [String], prizes: Map },
    { _id: false }
);

const eventSchema = new mongoose.Schema({
    slug: { type: String, unique: true },
    title: String, tag: String, date: String, time: String,
    venue: String, bgImg: String, desc: String,
    categories: [categorySchema], deliverables: [String],
    registrationOpen: { type: Boolean, default: true },
    registrationStart: String, registrationEnd: String,
    rules: String, prizes_desc: String,
    contact_email: String, contact_phone: String,
    archived: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: false },
    status: { type: String, enum: ['Open', 'Closed', 'Sold Out', 'Coming Soon'], default: 'Open' },
    registeredCount: { type: Number, default: 0 },
    latLng: { lat: Number, lng: Number },
    completedDate: String, capacity: Number,
    createdAt: { type: String, default: () => new Date().toISOString() }
});

const participantSchema = new mongoose.Schema({
    id: String, name: String, email: String, phone: String,
    city: String, gender: String, ageGroup: String, age: String, tshirtSize: String,
    eventSlug: String, eventName: String, category: String,
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
    registeredAt: { type: String, default: () => new Date().toISOString() }
});

const couponSchema = new mongoose.Schema({
    id: String,
    code: { type: String, unique: true },
    discountType: { type: String, enum: ['percent', 'fixed'] },
    discountValue: Number, discountPercent: Number,
    maxUses: Number, usedCount: { type: Number, default: 0 },
    expiryDate: String, active: { type: Boolean, default: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    eventId: String
});

const contentSchema = new mongoose.Schema({
    id: String,
    type: { type: String, enum: ['image', 'logo', 'sponsor', 'content', 'gallery', 'service', 'contact'] },
    title: String, imageUrl: String, description: String,
    link: String, buttonName: String, metadata: mongoose.Schema.Types.Mixed,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
});

const auditSchema = new mongoose.Schema({
    timestamp: { type: String, default: () => new Date().toISOString() },
    user: String, action: String, target: String, details: String
});

const leaderboardSchema = new mongoose.Schema({
    eventSlug: { type: String, unique: true },
    winners: [{ name: String, time: String }],
    expireAt: { type: Date, expires: 0 } // TTL index: autodeletes when current time matches expireAt
});

const Event = mongoose.model('Event', eventSchema);
const Participant = mongoose.model('Participant', participantSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Content = mongoose.model('Content', contentSchema);
const Audit = mongoose.model('Audit', auditSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// ========================
// API ROUTES (All MongoDB)
// ========================

// --- EVENTS ---
app.get('/api/events', async (req, res) => {
    try {
        if (isFallbackMode) return res.json(fallbackData.events || {});
        const events = await Event.find();
        const obj = {};
        events.forEach(e => obj[e.slug] = e);
        res.json(obj);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/events-batch', async (req, res) => {
    try {
        if (isFallbackMode) {
            fallbackData.events = req.body;
            return res.json({ success: true, warning: 'Saved to local memory only' });
        }
        await Event.deleteMany({});
        const events = Object.values(req.body);
        if (events.length > 0) await Event.insertMany(events);
        res.json({ success: true });
    } catch (e) { console.error('BATCH ERROR:', e.message); res.status(500).json({ error: e.message }); }
});

// --- PARTICIPANTS ---
app.get('/api/participants', async (req, res) => {
    try {
        if (isFallbackMode) return res.json(fallbackData.participants || []);
        res.json(await Participant.find());
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/participants', async (req, res) => {
    try {
        if (isFallbackMode) {
            fallbackData.participants.push({ ...req.body, registeredAt: new Date().toISOString() });
            return res.status(201).json({ success: true, warning: 'Saved to local memory only' });
        }
        await new Participant(req.body).save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Batch replace all participants (for bulk delete/update from admin)
app.post('/api/participants-batch', async (req, res) => {
    try {
        await Participant.deleteMany({});
        const data = Array.isArray(req.body) ? req.body : [];
        if (data.length > 0) await Participant.insertMany(data);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BULK EMAIL ---
app.post('/api/bulk-email', async (req, res) => {
    try {
        const { subject, body, recipients } = req.body;
        if (!subject || !body || !recipients || !recipients.length) {
            return res.status(400).json({ error: 'Missing subject, body, or recipients' });
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.in',
            port: 587,
            secure: false,
            auth: {
                user: 'info@gagnersports.com',
                pass: 'Rv1S3FRNssun'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify SMTP connection first
        try {
            await transporter.verify();
            console.log('\x1b[32m%s\x1b[0m', '✅ SMTP connection verified successfully');
        } catch (verifyErr) {
            console.error('\x1b[31m%s\x1b[0m', '❌ SMTP verification failed:', verifyErr.message);
            return res.status(500).json({ error: 'SMTP connection failed: ' + verifyErr.message });
        }

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const email of recipients) {
            try {
                await transporter.sendMail({
                    from: '"Gagner Sports" <info@gagnersports.com>',
                    to: email,
                    subject: subject,
                    html: body.replace(/\n/g, '<br/>')
                });
                console.log(`✅ Email sent to ${email}`);
                successCount++;
            } catch (err) {
                console.error(`❌ Failed to send email to ${email}:`, err.message);
                errors.push({ email, error: err.message });
                failCount++;
            }
        }

        res.json({ success: true, successCount, failCount, errors });
    } catch (e) {
        console.error('Email error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- COUPONS ---
app.get('/api/coupons', async (req, res) => {
    try {
        if (isFallbackMode) return res.json(fallbackData.coupons || []);
        res.json(await Coupon.find());
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coupons', async (req, res) => {
    try {
        await Coupon.deleteMany({});
        const data = Array.isArray(req.body) ? req.body : [req.body];
        if (data.length > 0) await Coupon.insertMany(data);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CONTENT (CMS - Sponsors/Logos/Images) ---
app.get('/api/content', async (req, res) => {
    try {
        if (isFallbackMode) return res.json(fallbackData.content || []);
        res.json(await Content.find().sort({ order: 1 }));
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/content', async (req, res) => {
    try {
        await Content.deleteMany({});
        const data = Array.isArray(req.body) ? req.body : [req.body];
        if (data.length > 0) await Content.insertMany(data);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (isFallbackMode) return res.json(fallbackData.leaderboard || {});
        const lb = await Leaderboard.find();
        const obj = {};
        lb.forEach(x => obj[x.eventSlug] = x.winners);
        res.json(obj);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaderboard', async (req, res) => {
    try {
        const { eventSlug, winners } = req.body;
        const event = await Event.findOne({ slug: eventSlug });
        let expireAt = null;
        if (event && event.date) {
            const eventDate = new Date(event.date);
            eventDate.setDate(eventDate.getDate() + 30);
            expireAt = eventDate;
        } else {
            // Fallback: 30 days from now if event.date is invalid or event missing
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 30);
            expireAt = fallbackDate;
        }
        await Leaderboard.findOneAndUpdate({ eventSlug }, { winners, expireAt }, { upsert: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/leaderboard/:slug', async (req, res) => {
    try {
        await Leaderboard.deleteOne({ eventSlug: req.params.slug });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- AUDIT ---
app.get('/api/audit', async (req, res) => {
    try { res.json(await Audit.find().sort({ timestamp: -1 }).limit(100)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/audit', async (req, res) => {
    try {
        await new Audit(req.body).save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/audit', async (req, res) => {
    try {
        await Audit.deleteMany({});
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ========================
// IMAGE UPLOAD ROUTE (Cloudinary CDN)
// ========================
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        let secureUrl;
        if (cloudinaryConfigured) {
            // Multer-storage-cloudinary auto-uploads; URL is in req.file.path
            secureUrl = req.file.path;
        } else {
            return res.status(503).json({ error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env' });
        }

        console.log('\x1b[32m%s\x1b[0m', `☁️  Uploaded to Cloudinary: ${secureUrl}`);
        res.json({ success: true, url: secureUrl });
    } catch (e) {
        console.error('Upload error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ========================
// DMS ROUTES (Individual CRUD by type)
// ========================

// Logo-specific: Replace the single master logo (upsert) — MUST be before :type/:id
app.post('/api/dms/logo/upsert', async (req, res) => {
    try {
        const result = await Content.findOneAndUpdate(
            { type: 'logo' },
            { ...req.body, type: 'logo', id: req.body.id || 'master_logo', active: true },
            { upsert: true, new: true }
        );
        await new Audit({ user: 'admin', action: 'UPSERT', target: 'DMS/logo', details: 'Master brand logo updated' }).save();
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Generic: get all content items of a specific type
app.get('/api/dms/:type', async (req, res) => {
    try {
        if (isFallbackMode) {
            return res.json(fallbackData.content.filter(i => i.type === req.params.type));
        }
        const items = await Content.find({ type: req.params.type }).sort({ order: 1 });
        res.json(items);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create a single content item
app.post('/api/dms/:type', async (req, res) => {
    try {
        const item = new Content({ ...req.body, type: req.params.type, id: req.body.id || `${req.params.type}_${Date.now()}` });
        await item.save();
        await new Audit({ user: 'admin', action: 'CREATE', target: `DMS/${req.params.type}`, details: item.title || item.id }).save();
        res.status(201).json(item);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update a single content item by MongoDB _id
app.put('/api/dms/:type/:id', async (req, res) => {
    try {
        const updated = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Item not found' });
        await new Audit({ user: 'admin', action: 'UPDATE', target: `DMS/${req.params.type}`, details: updated.title || updated.id }).save();
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete a single content item by MongoDB _id
app.delete('/api/dms/:type/:id', async (req, res) => {
    try {
        const deleted = await Content.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Item not found' });
        await new Audit({ user: 'admin', action: 'DELETE', target: `DMS/${req.params.type}`, details: deleted.title || deleted.id }).save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
    const dbState = isFallbackMode ? 0 : mongoose.connection.readyState;
    const states = { 0: 'FallBack Active (Offline)', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: (dbState === 1 || isFallbackMode) ? 'healthy' : 'unhealthy',
        database: states[dbState] || 'unknown',
        mode: isFallbackMode ? 'Local Fallback' : 'Production Atlas',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Gagner Sports Backend Running at http://localhost:${PORT}`);
    console.log('\x1b[33m%s\x1b[0m', '📋 SMART FALLBACK ENABLED: Will use local data if Atlas is unreachable.');
});
