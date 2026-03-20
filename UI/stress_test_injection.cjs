const axios = require('axios');

const API_URL = 'http://localhost:5000/api/events-batch';

const venues = [
    'Marina Beach, Chennai', 'Besant Nagar, Chennai', 'OMR, Navalur', 
    'Anna University Grounds', 'Island Grounds, Chennai', 'Phoenix Marketcity, Chennai'
];

const categories = [
    { name: '5K Run', price: '499' },
    { name: '10K Run', price: '799' },
    { name: 'Half Marathon', price: '1200' },
    { name: 'Kids Fun Run', price: '300' },
    { name: 'Elite Cycling', price: '1500' }
];

const statuses = ['Open', 'Closed', 'Sold Out', 'Coming Soon'];
const tags = ['FITNESS', 'KIDS', 'MARATHON', 'FAMILY', 'CORPORATE'];

const eventsBatch = {};

for (let i = 1; i <= 20; i++) {
    const slug = `stress-event-${i}`;
    const status = statuses[i % statuses.length];
    const tag = tags[i % tags.length];
    
    eventsBatch[slug] = {
        slug,
        title: `Stress Test Event #${i}`,
        tag: tag,
        date: `2026-0${(i % 9) + 1}-15`,
        time: '06:00 AM',
        venue: venues[i % venues.length],
        bgImg: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
        desc: `Stress test variation #${i}. High-load sync validation.`,
        status: status,
        registrationOpen: status === 'Open',
        categories: [categories[i % categories.length]],
        deliverables: ['T-Shirt', 'Medal', 'Refreshments'],
        capacity: 100 * i,
        registeredCount: status === 'Sold Out' ? 100 * i : 10,
        createdAt: new Date().toISOString()
    };
}

async function runInjection() {
    console.log('🚀 Initiating Bulk Sync (20 Data Variations)...');
    try {
        const res = await axios.post(API_URL, eventsBatch);
        if (res.status === 200) {
            console.log('✅ Bulk Sync Successful. 20 events injected into gagnersports.');
        } else {
            console.log('❌ Sync Failed:', res.statusText);
        }
    } catch (err) {
        console.error('❌ FATAL Injection Error:', err.message);
    }
}

runInjection();
