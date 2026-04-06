import crypto from 'crypto';

/**
 * Encrypts the plain text using CC Avenue's AES-128-CBC standard.
 */
export function encrypt(plainText: string, workingKey: string): string {
  const m = crypto.createHash('md5').update(String(workingKey)).digest();
  // CCAvenue Standard IV: Sequential bytes 0x00-0x0F (NOT all zeros!)
  const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
  const cipher = crypto.createCipheriv('aes-128-cbc', m, iv);
  cipher.setAutoPadding(true);

  let encoded = cipher.update(String(plainText), 'utf8', 'hex');
  encoded += cipher.final('hex');
  return encoded;
}

/**
 * Decrypts the encrypted text from CC Avenue response.
 */
export function decrypt(encText: string, workingKey: string): string {
  const m = crypto.createHash('md5').update(String(workingKey)).digest();
  const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
  const decipher = crypto.createDecipheriv('aes-128-cbc', m, iv);
  decipher.setAutoPadding(true);
  
  let decoded = decipher.update(String(encText), 'hex', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
}
