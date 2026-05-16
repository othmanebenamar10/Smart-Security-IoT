/**
 * Module de configuration de sécurité renforcée
 * Inclut : chiffrement, authentification, validation des requêtes
 */

import crypto from 'crypto';
import { createHmac } from 'crypto';

interface AuthConfig {
  secret: string;
  algorithm: string;
  iterations: number;
}

const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET || 'default-secure-key-change-in-production',
  algorithm: 'aes-256-cbc',
  iterations: 100000
};

/**
 * Générer un hash sécurisé
 */
export function generateSecureHash(data: string, salt?: string): string {
  const hash = createHmac('sha256', authConfig.secret);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Valider une signature
 */
export function validateSignature(data: string, signature: string): boolean {
  const expectedSignature = generateSecureHash(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Chiffrer des données sensibles
 */
export function encryptData(data: string): { iv: string; encryptedData: string } {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(authConfig.secret, 'salt', 32);
  const cipher = crypto.createCipheriv(authConfig.algorithm, key, iv);

  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

/**
 * Déchiffrer des données
 */
export function decryptData(encryptedData: string, iv: string): string {
  const key = crypto.scryptSync(authConfig.secret, 'salt', 32);
  const decipher = crypto.createDecipheriv(
    authConfig.algorithm,
    key,
    Buffer.from(iv, 'hex')
  );

  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

/**
 * Valider les paramètres d'une requête
 */
export function validateRequestParams(params: unknown): boolean {
  if (!params || typeof params !== 'object') {
    return false;
  }

  const obj = params as Record<string, unknown>;
  
  // Vérifier les champs requis de sécurité
  if (!obj.timestamp || !obj.nonce) {
    return false;
  }

  // Vérifier que le timestamp est récent (moins de 5 minutes)
  const requestTime = new Date(obj.timestamp as string).getTime();
  const now = Date.now();
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }

  return true;
}

/**
 * Générer un token de session sécurisé
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hasher un mot de passe avec salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, authConfig.iterations, 64, 'sha512')
    .toString('hex');

  return { hash, salt };
}

/**
 * Vérifier un mot de passe
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, authConfig.iterations, 64, 'sha512')
    .toString('hex');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(passwordHash));
}

/**
 * Générer un nonce pour les requêtes
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export default {
  generateSecureHash,
  validateSignature,
  encryptData,
  decryptData,
  validateRequestParams,
  generateSessionToken,
  hashPassword,
  verifyPassword,
  generateNonce
};
