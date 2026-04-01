const crypto = require('crypto');

/**
 * Encrypts the plain text using CC Avenue's AES-128-CBC standard.
 * @param {string} plainText - The query string to encrypt.
 * @param {string} workingKey - The 32-bit working key from CC Avenue dashboard.
 * @returns {string} - The encrypted hex string.
 */
function encrypt(plainText, workingKey) {
    // 1. Derive 128-bit key from Working Key (Standard for Integration Kits)
    const m = crypto.createHash('md5').update(String(workingKey)).digest();
    
    // 2. Initialize Null IV (16 zero bytes) as required by CCAvenue
    const iv = Buffer.alloc(16, 0);
    
    // 3. Create Cipher with explicit padding
    const cipher = crypto.createCipheriv('aes-128-cbc', m, iv);
    cipher.setAutoPadding(true); // Enforce PKCS7 (Standard)

    let encoded = cipher.update(String(plainText), 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
}

/**
 * Decrypts the encrypted text from CC Avenue response.
 * @param {string} encText - The encrypted hex string from CC Avenue.
 * @param {string} workingKey - The 32-bit working key from CC Avenue dashboard.
 * @returns {string} - The decrypted plain text.
 */
function decrypt(encText, workingKey) {
    const m = crypto.createHash('md5').update(String(workingKey)).digest();
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-128-cbc', m, iv);
    decipher.setAutoPadding(true);
    let decoded = decipher.update(String(encText), 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
}

module.exports = { encrypt, decrypt };
