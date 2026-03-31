const ccavUtils = require('./ccavUtils.cjs');
require('dotenv').config();

const merchant_id = process.env.CCAV_MERCHANT_ID;
const working_key = process.env.CCAV_WORKING_KEY;
const access_code = process.env.CCAV_ACCESS_CODE;

console.log('--- CC AVENUE ENCRYPTION TEST ---');
console.log('Merchant ID:', merchant_id);
console.log('Working Key Length:', working_key ? working_key.length : 0);
console.log('Access Code Length:', access_code ? access_code.length : 0);

if (!working_key) {
    console.error('ERROR: Missing CCAV_WORKING_KEY in .env');
    process.exit(1);
}

const testPlain = `merchant_id=${merchant_id}&order_id=GS${Date.now()}&currency=INR&amount=1&redirect_url=https://test.ngrok.dev/api/payment/status&cancel_url=https://test.ngrok.dev/cancel&language=EN`;
console.log('\n--- PLAIN TEXT PAYLOAD ---');
console.log(testPlain);

try {
    const encText = ccavUtils.encrypt(testPlain, working_key);
    console.log('\n✅ ENCRYPTION SUCCESSFUL');
    console.log('Encrypted String Length:', encText.length);
    console.log('Encrypted Value Prefix:', encText.substring(0, 20) + '...');
} catch(e) {
    console.error('\n❌ ENCRYPTION FAILED', e.message);
}
