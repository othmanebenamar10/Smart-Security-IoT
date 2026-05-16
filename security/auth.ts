/**
 * Authentication Module with Secure Password Hashing
 * @author BENAMAR Othmane
 * @secure Uses bcrypt for password hashing instead of SHA256
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createLogger } from '../logs/logger';

const logger = createLogger();
const BCRYPT_ROUNDS = 12; // Increase to 13-14 for production if performance allows

/**
 * Hash password using bcrypt
 * @param password Plain text password to hash
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be a string with at least 8 characters');
  }
  try {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  } catch (error) {
    logger.error('Password hashing failed', { error });
    throw error;
  }
}

/**
 * Verify password against bcrypt hash
 * @param password Plain text password to verify
 * @param hash Bcrypt hash to compare against
 * @returns Promise resolving to boolean
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    throw new Error('Password and hash are required');
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Password verification failed', { error });
    throw error;
  }
}

/**
 * Verify admin credentials
 * @param username Username to verify
 * @param password Plain text password to verify
 * @param storedHash Stored bcrypt hash
 * @returns Promise resolving to boolean
 */
export async function verifyAdmin(
  username: string,
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Constant-time comparison to prevent timing attacks
    const validUsername = process.env.ADMIN_USERNAME || '';
    if (!validUsername) {
      logger.error('ADMIN_USERNAME environment variable not set');
      return false;
    }

    const usernameBuffer = Buffer.from(username, 'utf8');
    const validUsernameBuffer = Buffer.from(validUsername, 'utf8');
    const usernameMatch =
      usernameBuffer.length === validUsernameBuffer.length &&
      crypto.timingSafeEqual(usernameBuffer, validUsernameBuffer);

    if (!usernameMatch) {
      logger.warn('Admin login attempt with invalid username', { username });
      return false;
    }

    const passwordMatch = await verifyPassword(password, storedHash);
    if (!passwordMatch) {
      logger.warn('Admin login attempt with invalid password');
    }

    return passwordMatch;
  } catch (error) {
    logger.error('Admin verification failed', { error });
    return false;
  }
}
