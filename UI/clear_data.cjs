const axios = require('axios');
const API_URL = 'http://localhost:5000/api/events-batch';

async function clear() {
    console.log('🧹 Emptying collection to simulate No Data state...');
    try {
        await axios.post(API_URL, {});
        console.log('✅ Collection emptied.');
    } catch (err) {
        console.error('❌ Error clearing collection:', err.message);
    }
}
clear();
