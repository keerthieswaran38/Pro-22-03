/**
 * test-invoice-local.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * LOCAL TESTING SCRIPT — Task 3 (Zero-downtime staging strategy)
 *
 * Run this BEFORE pushing to production to verify:
 *   1. PDF generation works correctly
 *   2. Email lands in your Zoho inbox with PDF attachment
 *   3. No SMTP errors
 *
 * Usage (from gagner_sports/):
 *   npx ts-node src/utils/test-invoice-local.ts
 *
 * Environment:
 *   Requires .env with SMTP_USER and SMTP_PASS set.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
dotenv.config();

import { generateAndSendInvoices, InvoiceParticipant } from './invoiceMailer';

// ── Simulated participants (matching image_7.png payload) ─────────────────────
const MOCK_ORDER_ID   = 'ORD-1775730604146';
const MOCK_TRACKING   = 'TXN-TEST-20260409';
const MOCK_AMOUNT     = '₹1.00';          // Matches image_7.png test amount

const mockParticipants: InvoiceParticipant[] = [
  {
    name:         'Arul',
    email:        process.env.SMTP_USER || 'info@gagnersports.com', // Send to self for testing
    phone:        '+91 98765 43210',
    eventName:    'Gagner Sports Marathon 2026',
    category:     '5KM Run',
    orderId:      MOCK_ORDER_ID,
    trackingId:   MOCK_TRACKING,
    amountPaid:   MOCK_AMOUNT,
    registeredAt: new Date().toISOString(),
  },
  {
    name:         'Priya',
    email:        process.env.SMTP_USER || 'info@gagnersports.com', // Same inbox — separate PDF
    phone:        '+91 87654 32109',
    eventName:    'Gagner Sports Marathon 2026',
    category:     '10KM Run',
    orderId:      MOCK_ORDER_ID,
    trackingId:   MOCK_TRACKING,
    amountPaid:   MOCK_AMOUNT,
    registeredAt: new Date().toISOString(),
  },
];

async function runTest() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🧪 Gagner Sports — Local Invoice Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Order ID  : ${MOCK_ORDER_ID}`);
  console.log(`  Tracking  : ${MOCK_TRACKING}`);
  console.log(`  Amount    : ${MOCK_AMOUNT}`);
  console.log(`  Recipients: ${mockParticipants.map(p => p.email).join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const result = await generateAndSendInvoices(mockParticipants);
    console.log('\n✅ Test complete!');
    console.log(`   Emails sent   : ${result.sent}`);
    console.log(`   Emails failed : ${result.failed}`);
    if (result.errors.length > 0) {
      console.error('   Errors:', result.errors);
    } else {
      console.log('   Check your inbox for 2 separate PDF invoices.');
    }
  } catch (err: any) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTest();
