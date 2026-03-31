const nodeCcav = require('node-ccavenue');
const myCcav = require('./ccavUtils.cjs');

const merchantId = '1234';
const workingKey = '77CBADC7443F52193CDD382949264C51';
const accessCode = 'AVRB83MH23BQ11BRQB';

const ccav = new nodeCcav.Configure({
  merchant_id: merchantId,
  working_key: workingKey,
});

const payload = 'merchant_id=1234&order_id=1234&amount=100';

const standardResult = ccav.encrypt(payload);
const myResult = myCcav.encrypt(payload, workingKey);

console.log('Standard:', standardResult);
console.log('My Result:', myResult);
console.log('Match?', standardResult === myResult);
