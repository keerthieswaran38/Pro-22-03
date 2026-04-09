/**
 * invoiceMailer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a per-participant PDF invoice and sends it to each participant's
 * registered email address via Zoho SMTP.
 *
 * One participant = One PDF = One email (1:1 dispatch)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { PassThrough } from 'stream';

// ── SMTP Transport ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'info@gagnersports.com',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/** Participant data shape expected by the mailer */
export interface InvoiceParticipant {
  name: string;
  email: string;
  phone?: string;
  eventName?: string;
  category?: string;
  orderId: string;
  trackingId?: string;
  amountPaid: string;         // formatted string, e.g. "₹500.00"
  registeredAt?: string;
}

// ── PDF Generation ────────────────────────────────────────────────────────────
function generateInvoicePDF(participant: InvoiceParticipant): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── HEADER BAR ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 160).fill('#FF5F00');
    doc.fillColor('#FFFFFF')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('GAGNER SPORTS', 50, 40)
       .fontSize(11)
       .font('Helvetica')
       .text('Official Registration Invoice', 50, 78)
       .text('info@gagnersports.com  •  www.gagnersports.com', 50, 96);

    // Invoice badge
    doc.roundedRect(doc.page.width - 200, 35, 150, 80, 8)
       .fill('rgba(0,0,0,0.25)');
    doc.fillColor('#FFFFFF')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('INVOICE', doc.page.width - 185, 50)
       .fontSize(9)
       .font('Helvetica')
       .text(`#${participant.orderId}`, doc.page.width - 185, 68, { width: 120 });

    // ── PAYMENT STATUS BADGE ──────────────────────────────────────────────────
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    doc.rect(50, 185, doc.page.width - 100, 50)
       .fill('#f0fdf4');
    doc.roundedRect(55, 191, 100, 36, 4)
       .fill('#16a34a');
    doc.fillColor('#FFFFFF')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('✓  PAID', 65, 205);
    doc.fillColor('#166534')
       .fontSize(9)
       .font('Helvetica')
       .text(`Payment confirmed on ${dateStr} at ${timeStr}`, 170, 205);

    // ── SECTION: PARTICIPANT INFO ─────────────────────────────────────────────
    const sectionTop = 260;

    doc.fillColor('#FF5F00')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('PARTICIPANT DETAILS', 50, sectionTop);
    doc.moveTo(50, sectionTop + 14).lineTo(doc.page.width - 50, sectionTop + 14)
       .strokeColor('#FF5F00').lineWidth(1.5).stroke();

    const rows: [string, string][] = [
      ['Participant Name', participant.name],
      ['Email Address',    participant.email],
      ['Phone',           participant.phone           || 'N/A'],
      ['Event',           participant.eventName       || 'N/A'],
      ['Category',        participant.category        || 'N/A'],
      ['Registered At',   participant.registeredAt
                            ? new Date(participant.registeredAt).toLocaleString('en-IN')
                            : dateStr],
    ];

    let y = sectionTop + 26;
    for (const [label, value] of rows) {
      doc.fillColor('#6b7280').fontSize(8.5).font('Helvetica').text(label, 50, y);
      doc.fillColor('#111827').fontSize(9.5).font('Helvetica-Bold').text(value, 220, y);
      y += 22;
      if ((rows as any).__shade) {
        doc.rect(50, y - 22, doc.page.width - 100, 22).fill('#f9fafb');
      }
    }

    // ── SECTION: PAYMENT DETAILS ──────────────────────────────────────────────
    y += 20;
    doc.fillColor('#FF5F00')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('PAYMENT DETAILS', 50, y);
    doc.moveTo(50, y + 14).lineTo(doc.page.width - 50, y + 14)
       .strokeColor('#FF5F00').lineWidth(1.5).stroke();

    const payRows: [string, string][] = [
      ['Order ID',       participant.orderId],
      ['Tracking ID',   participant.trackingId    || 'N/A'],
      ['Gateway',       'CCAvenue'],
      ['Currency',      'INR'],
      ['Amount Paid',   participant.amountPaid],
      ['Status',        'SUCCESS / PAID'],
    ];

    y += 26;
    for (const [label, value] of payRows) {
      doc.fillColor('#6b7280').fontSize(8.5).font('Helvetica').text(label, 50, y);

      const isAmount = label === 'Amount Paid';
      const isStatus = label === 'Status';

      doc.fillColor(isAmount ? '#FF5F00' : isStatus ? '#16a34a' : '#111827')
         .fontSize(isAmount ? 11 : 9.5)
         .font(isAmount || isStatus ? 'Helvetica-Bold' : 'Helvetica-Bold')
         .text(value, 220, y);
      y += 22;
    }

    // ── TOTAL BOX ─────────────────────────────────────────────────────────────
    y += 10;
    doc.rect(doc.page.width - 230, y, 180, 60)
       .fill('#FF5F00');
    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .font('Helvetica')
       .text('TOTAL AMOUNT PAID', doc.page.width - 215, y + 12);
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .text(participant.amountPaid, doc.page.width - 215, y + 28);

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 80;
    doc.rect(0, footerY, doc.page.width, 80).fill('#1a1a1a');
    doc.fillColor('rgba(255,255,255,0.5)')
       .fontSize(8)
       .font('Helvetica')
       .text('This is an automatically generated invoice. No signature required.', 50, footerY + 18, {
         align: 'center', width: doc.page.width - 100
       })
       .text('Gagner Sports Events Pvt. Ltd.  •  Chennai, Tamil Nadu, India', 50, footerY + 34, {
         align: 'center', width: doc.page.width - 100
       })
       .text('For queries: info@gagnersports.com  |  www.gagnersports.com', 50, footerY + 50, {
         align: 'center', width: doc.page.width - 100
       });

    doc.end();
  });
}

// ── Email Dispatch ────────────────────────────────────────────────────────────
async function sendInvoiceEmail(
  participant: InvoiceParticipant,
  pdfBuffer: Buffer
): Promise<void> {
  const subject = `Invoice for your Gagner Sports Registration: ${participant.orderId}`;

  const htmlBody = `
    <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #030712; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: #FF5F00; padding: 32px 40px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">GAGNER SPORTS</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Registration Confirmed</p>
      </div>

      <!-- Body -->
      <div style="padding: 36px 40px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">✅</span>
          <div>
            <div style="font-weight: 800; color: #15803d; font-size: 15px;">Payment Successful!</div>
            <div style="color: #166534; font-size: 13px;">Your spot is now confirmed.</div>
          </div>
        </div>

        <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
          Hi <strong style="color: #FF5F00;">${participant.name}</strong>,<br><br>
          Thank you for registering for <strong>${participant.eventName || 'the event'}</strong>.<br>
          Your payment of <strong style="color: #FF5F00;">${participant.amountPaid}</strong> has been received successfully.
        </p>

        <!-- Order Details -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #FF5F00; margin-bottom: 14px;">ORDER SUMMARY</div>
          ${[
            ['Order ID',    participant.orderId],
            ['Category',    participant.category || 'N/A'],
            ['Amount',      participant.amountPaid],
            ['Status',      '✅ PAID'],
          ].map(([l, v]) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span style="color: rgba(255,255,255,0.5); font-size: 13px;">${l}</span>
            <span style="font-weight: 700; color: #fff; font-size: 13px;">${v}</span>
          </div>`).join('')}
        </div>

        <p style="color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.7;">
          Your invoice PDF is attached to this email. Please keep it for your records.<br>
          For any queries, reply to this email or contact us at <a href="mailto:info@gagnersports.com" style="color: #FF5F00;">info@gagnersports.com</a>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #0d0d0d; padding: 20px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
        <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} Gagner Sports Events Pvt. Ltd. • Chennai, India<br>
          This is an automated email. Please do not reply directly.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: '"Gagner Sports" <info@gagnersports.com>',
    to: participant.email,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: `gagner-invoice-${participant.orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// ── Main Export ───────────────────────────────────────────────────────────────
/**
 * generateAndSendInvoices
 * For each participant in the array: generate a unique PDF invoice and send
 * an individual email. Errors for one participant do not block others.
 */
export async function generateAndSendInvoices(
  participants: InvoiceParticipant[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const p of participants) {
    try {
      const pdfBuffer = await generateInvoicePDF(p);
      await sendInvoiceEmail(p, pdfBuffer);
      sent++;
      console.log(`📧 Invoice sent → ${p.email} (${p.orderId})`);
    } catch (err: any) {
      failed++;
      const msg = `Failed to send invoice to ${p.email}: ${err.message}`;
      errors.push(msg);
      console.error(`❌ ${msg}`);
    }
  }

  return { sent, failed, errors };
}
