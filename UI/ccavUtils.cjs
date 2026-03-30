const crypto = require('crypto');

/**
 * Encrypts the plain text using CC Avenue's AES-128-CBC standard.
 * @param {string} plainText - The query string to encrypt.
 * @param {string} workingKey - The 32-bit working key from CC Avenue dashboard.
 * @returns {string} - The encrypted hex string.
 */
function encrypt(plainText, workingKey) {
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
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
    const m = crypto.createHash('md5');
    m.update(workingKey);
    const key = m.digest();
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decoded = decipher.update(encText, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
}

module.exports = { encrypt, decrypt };
