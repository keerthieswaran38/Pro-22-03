/**
 * simulate_payment.cjs
 * Automated QA script to verify CC Avenue flow.
 */
const axios = require('axios');
const crypto = require('crypto');
const ccav = require('./ccavUtils.cjs');
require('dotenv').config();

const WORKING_KEY = process.env.CCAV_WORKING_KEY;
const API_BASE = 'http://localhost:5000';

if (!WORKING_KEY) {
    console.error('❌ ERROR: CCAV_WORKING_KEY not found in .env');
    process.exit(1);
}

async function runSimulation() {
    console.log('🚀 Starting FULL CC Avenue Flow Simulation...');

    try {
        const testEvent = 'health-day-run-2026'; // ensure this works

        // Step 1: Call /api/payment/initiate to create a DB record (isPaid: false)
        console.log('🔹 Step 1: Initiating Payment...');
        const initResp = await axios.post(`${API_BASE}/api/payment/initiate`, {
            eventID: testEvent,
            participants: [{ name: 'QA_Automated_User', email: 'qa@gagner.com', phone: '9999999999', age: '25' }],
            totalAmount: 1,
            redirectUrl: `${API_BASE}/api/payment/status`,
            cancelUrl: `${API_BASE}/cancel`
        });

        if (!initResp.data.success) throw new Error('Failed to initiate payment');

        const order_id = initResp.data.order_id;
        console.log(`✅ Order ID Created: ${order_id}`);

        // Step 2: Prepare the simulated response from CC Avenue (Success)
        const plainResp = `order_id=${order_id}&order_status=Success&tracking_id=QA_MOCK_TXN_${Date.now()}`;
        const encResp = ccav.encrypt(plainResp, WORKING_KEY);

        console.log('🔹 Step 2: Sending simulated SUCCESS Webhook...');

        // Step 3: Hit the Webhook (/api/payment/status)
        const params = new URLSearchParams();
        params.append('encResp', encResp);

        const response = await axios.post(`${API_BASE}/api/payment/status`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('🟢 Webhook Response Status:', response.status);

        if (response.data.includes('Redirecting...')) {
            console.log('✅ Webhook correctly initiated redirect HTML.');
        }

        // Step 4: Verify Database Update
        console.log('🔹 Step 3: Verifying Database Update...');
        const participantsResp = await axios.get(`${API_BASE}/api/participants`);
        const participant = participantsResp.data.find(p => p.orderId === order_id);

        if (participant && participant.isPaid) {
            console.log('\x1b[32m%s\x1b[0m', '🏆 CRITICAL SUCCESS: Participant updated to isPaid: true');
            console.log('\x1b[32m%s\x1b[0m', '🏁 FLOW CONFIRMED END-TO-END.');
        } else {
            console.error('\x1b[31m%s\x1b[0m', '❌ FAILURE: Participant record not found or not updated.');
        }

    } catch (e) {
        console.error('❌ SIMULATION FAILED:', e.message);
        if (e.response) console.error('Response Data:', e.response.data);
    }
}

runSimulation();
