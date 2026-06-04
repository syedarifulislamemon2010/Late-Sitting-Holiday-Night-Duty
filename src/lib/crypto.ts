/**
 * Native Web Cryptography API Encryption Utility (AES-GCM 256)
 * Safe to run on both Client (browser) and Server (Node.js) environments.
 */

const SECRET_RAW = process.env.CHAT_ENCRYPTION_SECRET || 'JanataBankLateSittingRosterChatKey2026';

// Helper to derive a 32-byte key from secret
async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Hash the secret to ensure it is exactly 32 bytes (256 bits) for AES-256
  const secretBytes = enc.encode(secret);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', secretBytes);
  
  return globalThis.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Transparently encrypts a plain text string using AES-GCM.
 * Output format: "ivHex:encryptedHex"
 */
export async function encryptText(text: string): Promise<string> {
  try {
    if (!text) return '';
    const key = await getEncryptionKey(SECRET_RAW);
    
    // Generate a random 12-byte initialization vector (IV) for AES-GCM
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encodedText = enc.encode(text);
    
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedText
    );
    
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text; // Fallback to raw text
  }
}

/**
 * Transparently decrypts a cipher string in the form "ivHex:encryptedHex"
 * Returns decrypted plain text or original cipher string.
 */
export async function decryptText(encryptedText: string): Promise<string> {
  try {
    if (!encryptedText) return '';
    if (!encryptedText.includes(':')) return encryptedText; // Plain text fallback
    
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;
    
    const ivHex = parts[0];
    const cipherHex = parts[1];
    
    // 12 bytes IV is represented by 24 hex characters
    if (ivHex.length !== 24) return encryptedText;
    
    const key = await getEncryptionKey(SECRET_RAW);
    
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const decrypted = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error('Decryption failed, returning ciphertext:', err);
    return encryptedText; // Fallback
  }
}
