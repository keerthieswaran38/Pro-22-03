import nodemailer from 'nodemailer';
import { Request, Response } from 'express';

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'info@gagnersports.com',
    pass: process.env.SMTP_PASS || 'Rv1S3FRNssun',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendBulkEmail = async (req: Request, res: Response) => {
  try {
    const { subject, body, recipients } = req.body;
    if (!subject || !body || !recipients || !recipients.length) {
      return res.status(400).json({ error: 'Missing subject, body, or recipients' });
    }

    // Verify SMTP connection first
    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      return res.status(500).json({ error: 'SMTP verification failed: ' + verifyErr.message });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    for (const email of recipients) {
      try {
        await transporter.sendMail({
          from: '"Gagner Sports" <info@gagnersports.com>',
          to: email,
          subject: subject,
          html: body.replace(/\n/g, '<br/>'),
        });
        successCount++;
      } catch (err: any) {
        errors.push({ email, error: err.message });
        failCount++;
      }
    }

    res.json({ success: true, successCount, failCount, errors });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkSmtpHealth = async (_req: Request, res: Response) => {
  try {
    await transporter.verify();
    res.json({ status: 'healthy', transport: 'smtp.zoho.in' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
