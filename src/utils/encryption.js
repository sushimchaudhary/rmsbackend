/**
 * AES-256-GCM encrypt/decrypt for merchant credentials at rest.
 *
 * Requires MERCHANT_CREDENTIALS_KEY in .env — a 32-byte key, base64 encoded.
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Rotate this key by re-encrypting all merchant_accounts rows if it ever
 * needs to change — there's a `rotateKey` helper below for that.
 */

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

function getKey() {
  const raw = process.env.MERCHANT_CREDENTIALS_KEY;
  if (!raw) {
    throw new Error(
      'MERCHANT_CREDENTIALS_KEY is not set. Generate one with: ' +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('MERCHANT_CREDENTIALS_KEY must decode to exactly 32 bytes.');
  }
  return key;
}

/**
 * @param {string} plaintext
 * @returns {string} "iv:authTag:ciphertext" all base64, colon-joined
 */
function encrypt(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext.length) {
    throw new Error('encrypt() requires a non-empty string.');
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/**
 * @param {string} payload output of encrypt()
 * @returns {string} plaintext
 */
function decrypt(payload) {
  if (typeof payload !== 'string' || payload.split(':').length !== 3) {
    throw new Error('decrypt() received a malformed payload.');
  }
  const key = getKey();
  const [ivB64, tagB64, ctB64] = payload.split(':');

  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };