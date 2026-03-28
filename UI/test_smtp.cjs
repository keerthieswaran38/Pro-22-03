const nodemailer = require('nodemailer');

async function tryHost(host) {
    try {
        console.log(`\nTrying ${host}...`);
        const t = nodemailer.createTransport({
            host: host,
            port: 587,
            secure: false,
            auth: {
                user: 'info@gagnersports.com',
                pass: 'Rv1S3FRNssun'
            },
            tls: { rejectUnauthorized: false }
        });
        await t.verify();
        console.log(`SUCCESS with ${host}!`);
        return true;
    } catch (e) {
        console.log(`FAILED with ${host}: ${e.message}`);
        return false;
    }
}

(async () => {
    // Try all Zoho regional SMTP servers
    const hosts = [
        'smtp.zoho.in',
        'smtp.zoho.com',
        'smtp.zoho.eu',
        'smtp.zoho.com.au',
        'smtppro.zoho.in',
        'smtppro.zoho.com',
    ];
    
    for (const h of hosts) {
        const ok = await tryHost(h);
        if (ok) break;
    }
})();
