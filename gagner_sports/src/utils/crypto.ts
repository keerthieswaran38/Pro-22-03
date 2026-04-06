import crypto from 'crypto';

/**
 * Encrypts the plain text using CC Avenue's AES-128-CBC standard.
 */
export function encrypt(plainText: string, workingKey: string): string {
  const m = crypto.createHash('md5').update(String(workingKey)).digest();
  const iv = Buffer.alloc(16, 0);
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
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-128-cbc', m, iv);
  decipher.setAutoPadding(true);
  
  let decoded = decipher.update(String(encText), 'hex', 'utf8');
  decoded += decipher.final('utf8');
  return decoded;
}
