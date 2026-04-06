/**
 * invoiceGenerator.cjs
 * ─────────────────────────────────────────────────────────────
 * Generates a professional LANDSCAPE PDF invoice for each
 * Gagner Sports participant using PDFKit.
 * 
 * Returns a Buffer so the caller can attach it to an email.
 * ─────────────────────────────────────────────────────────────
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── LOGO PATH ──
// Try multiple known locations for the logo
const LOGO_CANDIDATES = [
    path.join(__dirname, 'src', 'assets', 'images', 'logo.png'),
    path.join(__dirname, 'public', 'logo.png'),
    path.join(__dirname, 'dist', 'assets', 'logo.png'),
];

function findLogo() {
    for (const p of LOGO_CANDIDATES) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Generate a single-page landscape PDF invoice.
 * 
 * @param {Object} data
 * @param {string} data.invoiceOrderId  - Unique 5-digit ID e.g. "JT10001"
 * @param {string} data.participantName - Full name
 * @param {string} data.email           - Email address
 * @param {string} data.phone           - Contact number
 * @param {string} data.gender          - Gender
 * @param {string} data.tshirtSize      - T-shirt size
 * @param {string} data.eventName       - Event title
 * @param {string} data.category        - Category (e.g. "5K Run")
 * @param {string} data.orderId         - CCAvenue order ID
 * @param {string} data.transactionId   - CCAvenue tracking ID
 * @param {string} data.date            - Event date
 * @param {string} data.venue           - Event venue
 * @param {string} data.amount          - Amount paid (optional)
 * @param {string} data.bloodGroup      - Blood group (optional)
 * @param {string} data.age             - Age (optional)
 * @param {string} data.dob             - DOB (optional)
 * @returns {Promise<Buffer>} - The PDF as a Buffer
 */
function generateInvoice(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 50, right: 50 },
                bufferPages: true // Required for single-page control
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pageW = doc.page.width;
            const pageH = doc.page.height;
            const marginL = 50;
            const marginR = 50;
            const contentW = pageW - marginL - marginR;

            // ── COLORS ──
            const primaryOrange = '#FF5F00';
            const darkBg = '#1a1a2e';
            const accentGreen = '#00C853';
            const textDark = '#2d2d2d';
            const textMuted = '#666666';
            const borderColor = '#e0e0e0';
            const headerBg = '#f8f8f8';

            // ═══════════════════════════════════════════════════
            // HEADER SECTION — Logo + Company Info + Invoice ID
            // ═══════════════════════════════════════════════════

            // White background rectangle for header
            doc.rect(0, 0, pageW, 120).fill('#ffffff');

            // Orange accent stripe at top
            doc.rect(0, 0, pageW, 5).fill(primaryOrange);

            // Logo (on white background)
            const logoPath = findLogo();
            if (logoPath) {
                try {
                    doc.image(logoPath, marginL, 15, { width: 90, height: 90 });
                } catch (imgErr) {
                    console.error('[INVOICE] Logo load failed:', imgErr.message);
                    // Fallback: text logo
                    doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryOrange);
                    doc.text('GR', marginL + 10, 30);
                }
            } else {
                // Fallback text logo
                doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryOrange);
                doc.text('GR', marginL + 10, 25);
                doc.fontSize(8).fillColor(textMuted);
                doc.text('GAGNER SPORTS', marginL + 5, 60);
            }

            // Company name and tagline
            doc.fontSize(22).font('Helvetica-Bold').fillColor(textDark);
            doc.text('GAGNER SPORTS', marginL + 110, 25);
            doc.fontSize(9).font('Helvetica').fillColor(textMuted);
            doc.text('Premium Sports Events & Experiences', marginL + 110, 52);
            doc.text('www.gagnersports.com  |  info@gagnersports.com', marginL + 110, 66);

            // Invoice title — right side
            doc.fontSize(26).font('Helvetica-Bold').fillColor(primaryOrange);
            doc.text('INVOICE', pageW - marginR - 200, 22, { width: 200, align: 'right' });

            // Invoice Order ID badge
            doc.roundedRect(pageW - marginR - 180, 55, 180, 35, 6).fill(primaryOrange);
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text(`# ${data.invoiceOrderId}`, pageW - marginR - 175, 63, { width: 170, align: 'center' });

            // Date under badge
            const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            doc.fontSize(8).font('Helvetica').fillColor(textMuted);
            doc.text(`Date: ${invoiceDate}`, pageW - marginR - 180, 97, { width: 180, align: 'right' });

            // ── Divider line ──
            doc.moveTo(marginL, 120).lineTo(pageW - marginR, 120).strokeColor(borderColor).lineWidth(1).stroke();

            // ═══════════════════════════════════════════════════
            // EVENT INFO BAR
            // ═══════════════════════════════════════════════════
            doc.rect(marginL, 130, contentW, 45).fill(headerBg).stroke(borderColor);

            doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryOrange);
            doc.text('EVENT:', marginL + 15, 142);
            doc.fillColor(textDark);
            doc.text(data.eventName || 'N/A', marginL + 70, 142);

            doc.fontSize(9).font('Helvetica').fillColor(textMuted);
            const eventMeta = [
                data.category ? `Category: ${data.category}` : '',
                data.date ? `Date: ${data.date}` : '',
                data.venue ? `Venue: ${data.venue}` : ''
            ].filter(Boolean).join('   |   ');
            doc.text(eventMeta, marginL + 15, 158);

            // ═══════════════════════════════════════════════════
            // PARTICIPANT DETAILS TABLE
            // ═══════════════════════════════════════════════════
            const tableTop = 195;
            const tableWidth = contentW;
            const col1W = tableWidth * 0.25; // Label
            const col2W = tableWidth * 0.25; // Value
            const col3W = tableWidth * 0.25; // Label
            const col4W = tableWidth * 0.25; // Value
            const rowH = 32;

            // Table header
            doc.rect(marginL, tableTop, tableWidth, 30).fill(darkBg);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('PARTICIPANT DETAILS', marginL + 15, tableTop + 9);

            // Table rows
            const details = [
                ['Participant Name', data.participantName || 'N/A', 'Order ID', data.invoiceOrderId],
                ['Email', data.email || 'N/A', 'Contact', data.phone || 'N/A'],
                ['Gender', data.gender || 'N/A', 'T-Shirt Size', data.tshirtSize || 'N/A'],
                ['Blood Group', data.bloodGroup || 'N/A', 'Age / DOB', `${data.age || 'N/A'} / ${data.dob || 'N/A'}`],
                ['Category', data.category || 'N/A', 'Transaction ID', data.transactionId || 'N/A'],
            ];

            let rowY = tableTop + 30;
            details.forEach((row, i) => {
                const bgColor = i % 2 === 0 ? '#ffffff' : '#fafafa';

                // Row background
                doc.rect(marginL, rowY, tableWidth, rowH).fill(bgColor);

                // Column 1 - Label
                doc.fontSize(8).font('Helvetica-Bold').fillColor(textMuted);
                doc.text(row[0].toUpperCase(), marginL + 15, rowY + 10, { width: col1W - 20 });

                // Column 2 - Value
                doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark);
                doc.text(row[1], marginL + col1W, rowY + 9, { width: col2W - 10 });

                // Column 3 - Label
                doc.fontSize(8).font('Helvetica-Bold').fillColor(textMuted);
                doc.text(row[2].toUpperCase(), marginL + col1W + col2W + 15, rowY + 10, { width: col3W - 20 });

                // Column 4 - Value
                doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark);
                doc.text(row[3], marginL + col1W + col2W + col3W, rowY + 9, { width: col4W - 15 });

                // Vertical dividers
                doc.moveTo(marginL + col1W, rowY).lineTo(marginL + col1W, rowY + rowH).strokeColor('#eeeeee').lineWidth(0.5).stroke();
                doc.moveTo(marginL + col1W + col2W, rowY).lineTo(marginL + col1W + col2W, rowY + rowH).strokeColor('#eeeeee').lineWidth(0.5).stroke();
                doc.moveTo(marginL + col1W + col2W + col3W, rowY).lineTo(marginL + col1W + col2W + col3W, rowY + rowH).strokeColor('#eeeeee').lineWidth(0.5).stroke();

                rowY += rowH;
            });

            // Table border
            doc.rect(marginL, tableTop, tableWidth, 30 + details.length * rowH)
               .strokeColor(borderColor).lineWidth(1).stroke();

            // ═══════════════════════════════════════════════════
            // AMOUNT SECTION (if provided)
            // ═══════════════════════════════════════════════════
            if (data.amount) {
                const amountY = rowY + 15;
                doc.roundedRect(pageW - marginR - 250, amountY, 250, 45, 8).fill(accentGreen);
                doc.fontSize(10).font('Helvetica').fillColor('#ffffff');
                doc.text('AMOUNT PAID', pageW - marginR - 240, amountY + 8, { width: 110 });
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff');
                doc.text(`₹ ${data.amount}`, pageW - marginR - 130, amountY + 6, { width: 120, align: 'right' });
            }

            // ═══════════════════════════════════════════════════
            // FOOTER
            // ═══════════════════════════════════════════════════
            const footerY = pageH - 70;

            // Footer divider
            doc.moveTo(marginL, footerY).lineTo(pageW - marginR, footerY).strokeColor(borderColor).lineWidth(0.5).stroke();

            // Footer left
            doc.fontSize(8).font('Helvetica').fillColor(textMuted);
            doc.text('This is a computer-generated invoice. No signature required.', marginL, footerY + 12);
            doc.text('For queries, contact: info@gagnersports.com', marginL, footerY + 24);

            // Footer right — status badge
            doc.roundedRect(pageW - marginR - 130, footerY + 8, 130, 28, 6).fill(accentGreen);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('✓ PAYMENT CONFIRMED', pageW - marginR - 128, footerY + 15, { width: 126, align: 'center' });

            // Orange bottom stripe
            doc.rect(0, pageH - 5, pageW, 5).fill(primaryOrange);

            // ── FINALIZE ──
            doc.end();

        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateInvoice };
