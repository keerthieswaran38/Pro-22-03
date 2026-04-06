import { Request, Response } from 'express';
import { encrypt, decrypt } from '../utils/crypto';
import Participant from '../models/Participant';
import Audit from '../models/Audit';
import dotenv from 'dotenv';

dotenv.config();

const WORKING_KEY = process.env.CCAV_WORKING_KEY || '77CBADC7443F52193CDD382949264C51';
const ACCESS_CODE = process.env.CCAV_ACCESS_CODE || 'AVRB83MH23BQ11BRQB';
const MERCHANT_ID = process.env.CCAV_MERCHANT_ID || '4399469';

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { amount, orderId, participants } = req.body; // Use POST for data-first flow

    if (!amount || !orderId) {
      return res.status(400).json({ error: 'Missing amount or orderId' });
    }

    // 1. DATA-FIRST PERSISTENCE (Pro-active Logging)
    if (participants && Array.isArray(participants)) {
      for (const p of participants) {
        await Participant.updateOne(
          { orderId, email: p.email, category: p.category },
          { $set: { ...p, orderId, paymentStatus: 'Pending', isPaid: false, registeredAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
      
      // Audit log
      await new Audit({
        action: 'INITIATE_PAYMENT',
        target: 'Participants',
        details: `Order ${orderId} started with ${participants.length} participants`
      }).save();
    }

    const host = req.get('host') || 'gagnersports.com';
    const isWWW = host.includes('www.');
    
    // Select credentials based on domain (Mirroring PHP logic)
    const workingKey = isWWW ? '5A8096D2CCCAAA0EA895860C2A314CA4' : '77CBADC7443F52193CDD382949264C51';
    const accessCode = isWWW ? 'AVDG84MJ95AQ29GDQA' : 'AVRB83MH23BQ11BRQB';
    const merchantId = '4399469';

    const finalAmount = Number(amount) > 0 ? Number(amount).toFixed(2) : '1.00';
    const redirectUrl = `https://${host}/api/payment/response`;
    const cancelUrl = `https://${host}/payment-failed`;

    // CCAvenue parameters
    const parts = [
      `merchant_id=${merchantId}`,
      `order_id=${orderId}`,
      `currency=INR`,
      `amount=${finalAmount}`,
      `redirect_url=${redirectUrl}`,
      `cancel_url=${cancelUrl}`,
      `language=EN`
    ];
    const requestParams = parts.join('&');
    const encRequest = encrypt(requestParams, workingKey);

    res.json({
      success: true,
      encRequest,
      access_code: accessCode,
      merchant_id: merchantId,
      gateway_url: 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handlePaymentResponse = async (req: Request, res: Response) => {
  try {
    const { encResp } = req.body;
    if (!encResp) return res.status(400).send('No response received');

    const host = req.get('host') || 'gagnersports.com';
    const isWWW = host.includes('www.');
    const workingKey = isWWW ? '5A8096D2CCCAAA0EA895860C2A314CA4' : '77CBADC7443F52193CDD382949264C51';

    const decryptedResp = decrypt(encResp, workingKey);
    const result: Record<string, string> = {};
    decryptedResp.split('&').forEach((item) => {
      const [key, val] = item.split('=');
      result[key] = val;
    });

    const orderId = result['order_id'];
    const orderStatus = result['order_status'];
    const trackingId = result['tracking_id'];

    let redirectUrl = `https://${host}`;

    if (orderStatus === 'Success') {
      await Participant.updateMany(
        { orderId },
        { paymentStatus: 'Paid', isPaid: true, transactionId: trackingId, tracking_id: trackingId }
      );
      redirectUrl += `/registration-success?orderId=${orderId}`;
    } else {
      await Participant.updateMany(
        { orderId },
        { paymentStatus: 'Failed', isPaid: false, transactionId: trackingId, tracking_id: trackingId }
      );
      redirectUrl += `/payment-failed?orderId=${orderId}&reason=${orderStatus}`;
    }

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('PAYMENT RESPONSE ERROR:', error.message);
    res.status(500).send('An error occurred during payment processing.');
  }
};
