import crypto from 'crypto';

// Enforce 32-byte encryption key for AES-256-CBC
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const SECRET_RAW = process.env.CHAT_ENCRYPTION_SECRET || 'JanataBankLateSittingRosterChatKey2026';
// Hash key to exactly 32 bytes for consistency
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_RAW).digest();

/**
 * Transparently encrypts a plain text string.
 * Output format: "ivHex:encryptedHex"
 */
export function encryptMessage(text: string): string {
  try {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text; // Fallback to raw text on error
  }
}

/**
 * Transparently decrypts a cipher string in the form "ivHex:encryptedHex"
 * Returns decrypted plain text or fallback.
 */
export function decryptMessage(encryptedText: string): string {
  try {
    if (!encryptedText) return '';
    
    // Check if the text matches the "ivHex:encryptedHex" format
    if (!encryptedText.includes(':')) {
      return encryptedText; // Already decrypted or plain text
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return encryptedText;
    }

    const ivHex = parts[0];
    const encryptedHex = parts[1];
    
    // Mime checks for hex length
    if (ivHex.length !== 32) {
      return encryptedText; // Not a valid hex IV
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedTextBuffer = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedTextBuffer);
    // Merge buffers
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed, returning ciphertext:', err);
    return encryptedText; // Fallback to raw encrypted text if key mismatch
  }
}
