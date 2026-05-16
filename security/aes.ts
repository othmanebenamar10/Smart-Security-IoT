/**
 * AES Encryption Module with GCM Authentication
 * @author BENAMAR Othmane
 * @secure Uses AES-256-GCM for authenticated encryption
 */
import crypto from 'crypto';
import { createLogger } from '../logs/logger';

const logger = createLogger();
const algorithm = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Derive a key from a secret string using PBKDF2
 * @param secret Secret string to derive key from
 * @returns 32-byte key for AES-256
 */
function deriveKey(secret: string): Buffer {
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    throw new Error('Secret must be at least 16 characters');
  }
  // Use a fixed salt for deterministic key derivation (consider using stored salt for better security)
  const salt = Buffer.from('smart-security-salt-2024', 'utf8');
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt payload using AES-256-GCM
 * @param secret Secret key
 * @param text Plain text to encrypt
 * @returns Encrypted payload as hex string with format: iv:tag:ciphertext
 */
export function encryptPayload(secret: string, text: string): string {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to encrypt must be a non-empty string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(secret);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:ciphertext (all hex encoded)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    logger.error('Encryption failed', { error });
    throw error;
  }
}

/**
 * Decrypt payload using AES-256-GCM
 * @param secret Secret key
 * @param payload Encrypted payload as hex string with format: iv:tag:ciphertext
 * @returns Decrypted plain text
 */
export function decryptPayload(secret: string, payload: string): string {
  try {
    if (!payload || typeof payload !== 'string') {
      throw new Error('Payload must be a non-empty string');
    }

    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid payload format: expected iv:tag:ciphertext');
    }

    const [ivHex, tagHex, encryptedHex] = parts;
    
    if (!ivHex || !tagHex || !encryptedHex) {
      throw new Error('Invalid payload: missing components');
    }

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      
      if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
      }
      if (tag.length !== TAG_LENGTH) {
        throw new Error(`Invalid tag length: expected ${TAG_LENGTH}, got ${tag.length}`);
      }
      
      const key = deriveKey(secret);
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
      return decrypted;
    } catch (bufferError) {
      throw new Error('Invalid payload encoding or corrupted data');
    }
  } catch (error) {
    logger.error('Decryption failed', { error });
    throw error;
  }
}
