const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_secret_key_change_me', 'salt', 32);
const ivLength = 16;

const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original if decryption fails (e.g. for legacy plain text)
  }
};

module.exports = { encrypt, decrypt };
