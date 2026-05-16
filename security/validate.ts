/**
 * Request Validation Module
 * @author BENAMAR Othmane
 * @secure Provides comprehensive input validation
 */
import { createLogger } from '../logs/logger';

const logger = createLogger();

/**
 * Validate IPC request payload
 * @param payload Payload to validate
 * @returns Validated payload
 */
export function validateIPCRequest(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    logger.warn('Invalid IPC payload type');
    throw new Error('Invalid IPC payload: must be an object');
  }

  // Ensure payload is a plain object, not a class instance
  if (Object.getPrototypeOf(payload) !== Object.prototype) {
    logger.warn('IPC payload is not a plain object');
    throw new Error('Invalid IPC payload: must be a plain object');
  }

  const record = payload as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length > 16) {
    logger.warn('IPC payload contains too many keys', { count: keys.length });
    throw new Error('Invalid IPC payload: too many keys');
  }

  for (const key of keys) {
    if (!/^[a-zA-Z0-9:_-]{1,64}$/.test(key)) {
      logger.warn('IPC payload contains invalid key', { key });
      throw new Error('Invalid IPC payload: invalid key');
    }

    const value = record[key];
    if (typeof value === 'string' && value.length > 2048) {
      logger.warn('IPC payload string too large', { key });
      throw new Error('Invalid IPC payload: string value too large');
    }
  }

  return record;
}

/**
 * Validate admin credentials format
 * @param username Username to validate
 * @param password Password to validate
 * @returns true if valid
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  if (typeof username !== 'string' || username.trim().length < 3) {
    logger.warn('Invalid username format');
    throw new Error('Invalid username: must be at least 3 characters');
  }
  
  if (typeof password !== 'string' || password.length < 8) {
    logger.warn('Invalid password format');
    throw new Error('Invalid password: must be at least 8 characters');
  }
  
  // Check for suspicious patterns
  if (/[<>"'%;()&+]/.test(username)) {
    logger.warn('Username contains suspicious characters');
    throw new Error('Invalid username: contains suspicious characters');
  }
  
  return true;
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns true if valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logger.warn('Invalid email format');
    throw new Error('Invalid email format');
  }
  return true;
}

/**
 * Validate IPC channel name
 * @param channel Channel name to validate
 * @param allowedChannels List of allowed channels
 * @returns true if valid
 */
export function validateIPCChannel(channel: string, allowedChannels: string[]): boolean {
  if (typeof channel !== 'string' || !channel.trim()) {
    throw new Error('Invalid channel: must be a non-empty string');
  }
  
  if (!allowedChannels.includes(channel)) {
    logger.warn('Unauthorized IPC channel access attempted', { channel });
    throw new Error('IPC channel not allowed');
  }
  
  return true;
}
