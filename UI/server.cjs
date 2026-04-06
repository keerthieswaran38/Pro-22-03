const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
require('dotenv').config();
const ccav = require('./ccavUtils.cjs');
const { generateInvoice } = require('./invoiceGenerator.cjs');

const app = express();
const PORT = process.env.PORT || 3012;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`========================================\n`);
});

// --- MANUAL CORS HEADERS (Nuke Fix) ---
app.use((req, res, next) => {
    const origin = req.header('Origin');
    const frontendUrl = process.env.FRONTEND_URL || 'https://gagnersports.com';
    const allowedOrigins = [
        frontendUrl,
        frontendUrl.replace('https://', 'https://www.'),
        'http://localhost:3008',
        'http://localhost:3009'
    ];
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', frontendUrl);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(express.json({ limit: '10mb' }));

// --- HEALTH CHECK (verify server is alive) ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'alive',
        db: isFallbackMode ? 'fallback' : 'mongodb',
        timestamp: new Date().toISOString(),
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? '✅ SET' : '❌ MISSING',
            CLOUDINARY: process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ MISSING',
            CCAV: process.env.CCAV_MERCHANT_ID ? '✅ SET' : '❌ MISSING'
        }
    });
});

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
        console.error('\x1b[31m%s\x1b[0m', '❌ WARNING: MONGODB_URI not found in environment variables.');
        console.warn('\x1b[33m%s\x1b[0m', '⚠️  Server will start in FALLBACK MODE with local data.');
        console.warn('\x1b[33m%s\x1b[0m', '💡 Add MONGODB_URI to Render Environment Variables to connect to Atlas.');
        isFallbackMode = true;
        loadFallbackData();
        return;
    }

    for (let i = 1; i <= retries; i++) {
        try {
            console.log(`📡 [Attempt ${i}/${retries}] Connecting to MongoDB Atlas or Primary DB...`);
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log('\x1b[32m%s\x1b[0m', '────────────────────────────────────────────────');
            console.log('\x1b[32m%s\x1b[0m', '🚀 CONNECTED: MongoDB Dashboard');
            console.log('\x1b[32m%s\x1b[0m', '✅ Status: Authenticated & Authorized');
            console.log('\x1b[32m%s\x1b[0m', `📦 Database: ${mongoose.connection.db.databaseName}`);
            console.log('\x1b[32m%s\x1b[0m', '────────────────────────────────────────────────');
            isFallbackMode = false;
            return;
        } catch (err) {
            console.error('\x1b[31m%s\x1b[0m', `❌ [Attempt ${i}/${retries}] ${err.message}`);
            if (i === retries) {
                console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: Primary DB failed. Trying localhost MongoDB...');
                try {
                    await mongoose.connect('mongodb://127.0.0.1:27017/gagner_sports', { serverSelectionTimeoutMS: 5000 });
                    console.log('\x1b[32m%s\x1b[0m', '🚀 CONNECTED: Localhost MongoDB on Hostinger');
                    isFallbackMode = false;
                    return;
                } catch(localErr) {
                    console.error('❌ Localhost MongoDB also failed. Falling back to JSON data source.');
                    isFallbackMode = true;
                    loadFallbackData();
                    return;
                }
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
    isPaid: { type: Boolean, default: false },
    orderId: String,
    invoiceOrderId: String,
    transactionId: String,
    tracking_id: String,
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

// ── Order Counter Schema for dynamic 5-digit Order IDs ──
const orderCounterSchema = new mongoose.Schema({
    prefix: { type: String, unique: true },  // e.g. 'JT', 'MR', 'GS'
    counter: { type: Number, default: 10000 } // starts at 10000, first ID = 10001
});

const Event = mongoose.model('Event', eventSchema);
const Participant = mongoose.model('Participant', participantSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Content = mongoose.model('Content', contentSchema, 'contents');
const Audit = mongoose.model('Audit', auditSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);

// ═══════════════════════════════════════════════════════
// DYNAMIC ORDER ID GENERATION
// ═══════════════════════════════════════════════════════

/** Map event names/slugs to a 2-letter prefix */
function getEventPrefix(eventNameOrSlug) {
    const s = String(eventNameOrSlug || '').toLowerCase();
    if (s.includes('juniorthon'))  return 'JT';
    if (s.includes('marathon'))    return 'MR';
    if (s.includes('sprint'))      return 'SP';
    if (s.includes('run'))         return 'RN';
    if (s.includes('walk'))        return 'WK';
    if (s.includes('cyclothon'))   return 'CT';
    if (s.includes('triathlon'))   return 'TR';
    return 'GS'; // default: Gagner Sports
}

/**
 * Generate a unique 5-digit Order ID for a participant.
 * Format: {PREFIX}{COUNTER}  e.g. JT10001, MR10003
 * Uses MongoDB atomic findOneAndUpdate to prevent duplicates.
 */
async function generateUniqueOrderId(eventNameOrSlug) {
    const prefix = getEventPrefix(eventNameOrSlug);
    // First, ensure the counter document exists with base value 10000
    await OrderCounter.updateOne(
        { prefix },
        { $setOnInsert: { prefix, counter: 10000 } },
        { upsert: true }
    );
    // Then atomically increment and return the new value
    const result = await OrderCounter.findOneAndUpdate(
        { prefix },
        { $inc: { counter: 1 } },
        { returnDocument: 'after' }
    );
    return `${prefix}${result.counter}`;
}

// ═══════════════════════════════════════════════════════
// INVOICE + EMAIL PIPELINE
// ═══════════════════════════════════════════════════════

/** Create the Zoho SMTP transporter (reusable) */
function createSmtpTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.zoho.in',
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'info@gagnersports.com',
            pass: process.env.SMTP_PASSWORD
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });
}

/**
 * Generate a PDF invoice and send it via email for ONE participant.
 * @param {Object} participant - The participant document from MongoDB
 * @param {Object} event - The event document (for date/venue info)
 * @param {string} transactionId - CCAvenue tracking ID
 * @param {number} retries - Number of retry attempts
 */
async function sendInvoiceEmail(participant, event, transactionId, retries = 2) {
    const invoiceOrderId = participant.invoiceOrderId;
    console.log(`[INVOICE] Generating PDF for ${participant.name} (${invoiceOrderId})...`);

    let pdfBuffer;
    try {
        // Determine per-participant amount from category
        let amount = '';
        if (event && event.categories) {
            const cat = event.categories.find(c => c.name === participant.category);
            if (cat && cat.price) amount = String(cat.price).replace(/[^0-9.]/g, '');
        }

        pdfBuffer = await generateInvoice({
            invoiceOrderId,
            participantName: participant.name,
            email: participant.email,
            phone: participant.phone,
            gender: participant.gender,
            tshirtSize: participant.tshirtSize,
            eventName: participant.eventName || (event ? event.title : 'N/A'),
            category: participant.category,
            orderId: participant.orderId,
            transactionId: transactionId || participant.tracking_id || '',
            date: event ? event.date : '',
            venue: event ? event.venue : '',
            amount,
            bloodGroup: participant.bloodGroup || '',
            age: participant.ageGroup || participant.age || '',
            dob: participant.dob || ''
        });
        console.log(`[INVOICE] PDF generated: ${pdfBuffer.length} bytes for ${invoiceOrderId}`);
    } catch (pdfErr) {
        console.error(`[INVOICE] ❌ PDF generation failed for ${invoiceOrderId}:`, pdfErr.message);
        if (retries > 0) {
            console.log(`[INVOICE] Retrying PDF generation... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 1000));
            return sendInvoiceEmail(participant, event, transactionId, retries - 1);
        }
        throw pdfErr;
    }

    // Send email with PDF attachment
    const transporter = createSmtpTransporter();
    try {
        await transporter.verify();
        console.log(`[EMAIL] SMTP verified, sending to ${participant.email}...`);
    } catch (verifyErr) {
        console.error(`[EMAIL] ❌ SMTP verification failed:`, verifyErr.message);
        if (retries > 0) {
            console.log(`[EMAIL] Retrying SMTP... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 2000));
            return sendInvoiceEmail(participant, event, transactionId, retries - 1);
        }
        throw verifyErr;
    }

    const mailOptions = {
        from: '"Gagner Sports" <info@gagnersports.com>',
        to: participant.email,
        subject: `🎉 Registration Confirmed — ${participant.eventName || 'Event'} | Order #${invoiceOrderId}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #FF5F00, #FF8C00); padding: 30px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">🎉 Registration Confirmed!</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333;">Hi <strong>${participant.name}</strong>,</p>
                    <p style="color: #555;">Your registration for <strong>${participant.eventName}</strong> has been confirmed!</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #fff;">
                            <td style="padding: 12px; border: 1px solid #eee; font-weight: bold; color: #666; width: 40%;">Order ID</td>
                            <td style="padding: 12px; border: 1px solid #eee; color: #FF5F00; font-weight: bold; font-size: 18px;">${invoiceOrderId}</td>
                        </tr>
                        <tr style="background: #fafafa;">
                            <td style="padding: 12px; border: 1px solid #eee; font-weight: bold; color: #666;">Category</td>
                            <td style="padding: 12px; border: 1px solid #eee;">${participant.category}</td>
                        </tr>
                        <tr style="background: #fff;">
                            <td style="padding: 12px; border: 1px solid #eee; font-weight: bold; color: #666;">T-Shirt Size</td>
                            <td style="padding: 12px; border: 1px solid #eee;">${participant.tshirtSize || 'N/A'}</td>
                        </tr>
                    </table>
                    <p style="color: #555;">Please find your invoice attached as a PDF.</p>
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="https://gagnersports.com" style="display: inline-block; background: #FF5F00; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px;">Visit Gagner Sports</a>
                    </div>
                </div>
                <div style="background: #333; padding: 20px; text-align: center;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">© 2026 Gagner Sports | info@gagnersports.com</p>
                </div>
            </div>
        `,
        attachments: [{
            filename: `Invoice_${invoiceOrderId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ Invoice sent to ${participant.email} (messageId: ${info.messageId})`);
    } catch (sendErr) {
        console.error(`[EMAIL] ❌ Failed to send invoice to ${participant.email}:`, sendErr.message);
        if (retries > 0) {
            console.log(`[EMAIL] Retrying send... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 2000));
            return sendInvoiceEmail(participant, event, transactionId, retries - 1);
        }
        // Don't throw — we don't want email failure to block the user redirect
        console.error(`[EMAIL] ❌ All retries exhausted for ${participant.email}. Invoice NOT sent.`);
    }
}

/**
 * Process all participants for a given orderId after successful payment.
 * Each participant gets a unique invoiceOrderId, a PDF invoice, and a separate email.
 */
async function processPostPaymentInvoices(orderId, trackingId) {
    try {
        const participants = await Participant.find({ orderId });
        if (!participants || participants.length === 0) {
            console.warn(`[INVOICE] No participants found for orderId: ${orderId}`);
            return;
        }

        // Get the event for metadata
        const firstP = participants[0];
        const event = await Event.findOne({ slug: firstP.eventSlug });

        console.log(`[INVOICE] Processing ${participants.length} participant(s) for order ${orderId}...`);

        for (const participant of participants) {
            try {
                // Generate unique 5-digit invoiceOrderId
                const invoiceOrderId = await generateUniqueOrderId(
                    participant.eventName || participant.eventSlug
                );

                // Save it to the participant document
                await Participant.updateOne(
                    { _id: participant._id },
                    { $set: { invoiceOrderId } }
                );
                participant.invoiceOrderId = invoiceOrderId;

                // Generate PDF + Send Email (fire-and-forget for each participant)
                await sendInvoiceEmail(participant, event, trackingId);

            } catch (pErr) {
                console.error(`[INVOICE] ❌ Failed for participant ${participant.name}:`, pErr.message);
                // Continue to next participant — don't let one failure block others
            }
        }

        console.log(`[INVOICE] ✅ All invoices processed for order ${orderId}`);
    } catch (err) {
        console.error(`[INVOICE] ❌ Critical error processing invoices for ${orderId}:`, err.message);
    }
}

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
                user: process.env.SMTP_USER || 'info@gagnersports.com',
                pass: process.env.SMTP_PASSWORD
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

// Unified payment initiation handler (supports both GET and POST)
const handlePaymentInitiate = async (req, res) => {
    try {
        // Support both GET (query params) and POST (JSON body)
        const amount = req.body?.amount || req.query?.amount;
        const orderId = req.body?.orderId || req.query?.orderId;
        const participants = req.body?.participants;

        if (!amount || !orderId) return res.status(400).json({ error: 'Missing amount or orderId' });

        // DATA-FIRST: Save participants as 'Pending' before payment
        if (participants && Array.isArray(participants)) {
            for (const p of participants) {
                await Participant.updateOne(
                    { orderId, email: p.email, category: p.category },
                    { $set: { ...p, orderId, paymentStatus: 'Pending', isPaid: false, registeredAt: p.registeredAt || new Date().toISOString() } },
                    { upsert: true }
                );
            }
            console.log(`[PAYMENT] Data-first: ${participants.length} participants saved as Pending for ${orderId}`);
        }

        // ── LIVE CREDENTIALS (from environment) ──
        const host = req.get('host') || 'gagnersports.com';
        const isWWW = host.includes('www.');
        const merchant_id = process.env.CCAV_MERCHANT_ID;
        const access_code = isWWW ? process.env.CCAV_ACCESS_CODE_WWW : process.env.CCAV_ACCESS_CODE;
        const working_key = isWWW ? process.env.CCAV_WORKING_KEY_WWW : process.env.CCAV_WORKING_KEY;

        const finalAmount = Number(amount) > 0 ? Number(amount).toFixed(2) : '1.00';

        const parts = [
            `merchant_id=${String(merchant_id)}`,
            `order_id=${String(orderId)}`,
            `currency=INR`,
            `amount=${String(finalAmount)}`,
            `redirect_url=https://${host}/api/payment/response`,
            `cancel_url=https://${host}/payment-failed`,
            `language=EN`
        ];
        const requestParams = parts.join('&');
        const encRequest = ccav.encrypt(requestParams, working_key);

        // Sanitized: only log non-sensitive metadata
        console.log(`[AUTH] HOST: ${host} | ENC LENGTH: ${encRequest.length}`);

        res.json({
            success: true,
            encRequest: String(encRequest),
            access_code: String(access_code),
            merchant_id: String(merchant_id),
            gateway_url: 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
        });

    } catch (e) {
        console.error('PAYMENT INITIATE ERROR:', e.message);
        res.status(500).json({ error: e.message });
    }
};
app.get('/api/payment/initiate', handlePaymentInitiate);
app.post('/api/payment/initiate', handlePaymentInitiate);

// --- DIAGNOSTIC ENDPOINT (redacted) ---
app.get('/api/debug-config', (req, res) => {
    res.json({
        merchant_id_loaded: !!process.env.CCAV_MERCHANT_ID,
        access_code_loaded: !!process.env.CCAV_ACCESS_CODE,
        working_key_loaded: !!process.env.CCAV_WORKING_KEY,
        working_key_www_loaded: !!process.env.CCAV_WORKING_KEY_WWW,
        smtp_loaded: !!process.env.SMTP_PASSWORD,
        node_version: process.version
    });
});

// --- 4. HANDSHAKE TEST ENDPOINT ---
app.get('/api/test-ccav', async (req, res) => {
    try {
        const working_key = process.env.CCAV_WORKING_KEY;
        const access_code = process.env.CCAV_ACCESS_CODE;
        const merchant_id = process.env.CCAV_MERCHANT_ID;
        
        const frontendUrl = process.env.FRONTEND_URL || 'https://gagnersports.com';
        const testParams = `merchant_id=${merchant_id}&order_id=TEST_${Date.now()}&currency=INR&amount=1.00&redirect_url=${frontendUrl}/api/payment/response&cancel_url=${frontendUrl}/payment-failed&language=EN`;
        const encRequest = ccav.encrypt(testParams, working_key);

        // This simulates what the browser does, but from the server IP
        // This helps verify if the IP is whitelisted at CC Avenue
        const fetch = (await import('node-fetch')).default;
        const body = new URLSearchParams();
        body.append('encRequest', encRequest);
        body.append('access_code', access_code);
        body.append('merchant_id', merchant_id);
        body.append('command', 'initiateTransaction');

        const response = await fetch('https://secure.ccavenue.com/transaction/transaction.do', {
            method: 'POST',
            body: body,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const text = await response.text();
        res.json({
            success: true,
            server_ip: req.ip,
            ccavenue_status: response.status,
            ccavenue_response_preview: text.substring(0, 500)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * 2. Response Webhook: CC Avenue posts data here after transaction
 * Note: Body-parser must handle urlencoded for this to work as form data
 */
// Payment Response Handler — CC Avenue posts encrypted result here
const handlePaymentResponse = async (req, res) => {
    try {
        const { encResp } = req.body;
        if (!encResp) return res.status(400).send('No response received');

        const host = req.get('host') || 'gagnersports.com';
        const isWWW = host.includes('www.');
        const working_key = isWWW ? process.env.CCAV_WORKING_KEY_WWW : process.env.CCAV_WORKING_KEY;

        const decryptedResp = ccav.decrypt(encResp, working_key);
        
        const result = {};
        decryptedResp.split('&').forEach(item => {
            const [key, val] = item.split('=');
            result[key] = val;
        });
        
        const order_id = result['order_id'];
        const order_status = result['order_status'];
        const tracking_id = result['tracking_id'];

        console.log(`[PAYMENT RESPONSE] Order: ${order_id} | Status: ${order_status} | Tracking: ${tracking_id}`);

        let redirectUrl = `https://${host}`;

        if (order_status === 'Success') {
            // 1. Update all participants for this order as Paid
            await Participant.updateMany(
                { orderId: order_id },
                { paymentStatus: 'Paid', isPaid: true, transactionId: tracking_id, tracking_id: tracking_id }
            );
            redirectUrl += '/registration-success?orderId=' + order_id;

            // 2. Fire invoice generation + email pipeline (non-blocking)
            //    This runs asynchronously so the user gets redirected immediately
            processPostPaymentInvoices(order_id, tracking_id).catch(err => {
                console.error(`[INVOICE PIPELINE] Background error for ${order_id}:`, err.message);
            });

        } else {
            await Participant.updateMany(
                { orderId: order_id },
                { paymentStatus: 'Failed', isPaid: false, transactionId: tracking_id, tracking_id: tracking_id }
            );
            redirectUrl += '/payment-failed?orderId=' + order_id + '&reason=' + (order_status || 'Unknown');
        }

        res.redirect(redirectUrl);
    } catch (e) {
        console.error('PAYMENT STATUS ERROR:', e.message);
        res.status(500).send('An error occurred during payment processing.');
    }
};
// Register on BOTH routes so CCAvenue callback always works
app.post('/api/payment/response', express.urlencoded({ extended: true }), handlePaymentResponse);
app.post('/api/ccavResponseHandler', express.urlencoded({ extended: true }), handlePaymentResponse);

// --- CCAV ORIGIN DEBUG ---
app.get('/api/ccav-who-am-i', (req, res) => {
    res.json({
        msg: 'Origin Debug Endpoint',
        origin: req.header('Origin'),
        referer: req.header('Referer'),
        host: req.header('Host'),
        forwarded: req.header('X-Forwarded-For'),
        f_host: req.header('X-Forwarded-Host')
    });
});

// ── PAYMENT DEBUG ENDPOINT (redacted credentials) ──
app.get('/api/payment/debug', (req, res) => {
    try {
        const working_key = process.env.CCAV_WORKING_KEY;
        const access_code = process.env.CCAV_ACCESS_CODE;
        const merchant_id = process.env.CCAV_MERCHANT_ID;
        const frontendUrl = process.env.FRONTEND_URL || 'https://gagnersports.com';

        const testParams = `merchant_id=${merchant_id}&order_id=DEBUG_TEST&currency=INR&amount=1.00&redirect_url=${frontendUrl}/api/payment/response&cancel_url=${frontendUrl}/payment-failed&language=EN`;
        const testEnc = ccav.encrypt(testParams, working_key);

        res.json({
            status: 'ok',
            env_key_loaded:    !!process.env.CCAV_WORKING_KEY,
            env_access_loaded: !!process.env.CCAV_ACCESS_CODE,
            env_merchant_loaded: !!process.env.CCAV_MERCHANT_ID,
            env_smtp_loaded:   !!process.env.SMTP_PASSWORD,
            test_encryption_ok: testEnc && testEnc.length > 10
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

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


