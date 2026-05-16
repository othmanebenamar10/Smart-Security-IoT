/**
 * Module d'authentification PIN sécurisé
 * Stockage chiffré et hachage des codes d'accès
 */

import path from 'path';
import fs from 'fs';
import { hashPassword, verifyPassword, generateSecureHash } from './security';
import { createLogger } from '../logs/logger';

const logger = createLogger();

interface AuthUser {
  id: string;
  pin: string; // Stocké en hash
  salt: string;
  createdAt: string;
  attempts: number;
  lockedUntil?: number;
}

interface AuthStorage {
  users: Record<string, AuthUser>;
  masterPin?: {
    hash: string;
    salt: string;
  };
  lastModified: string;
}

const authDbPath = path.join(process.env.APPDATA || '', 'HomeSecureAccess', 'auth.json');

class AuthenticationManager {
  private storage: AuthStorage;

  constructor() {
    this.storage = this.loadAuthStorage();
  }

  /**
   * Charger le stockage d'authentification
   */
  private loadAuthStorage(): AuthStorage {
    try {
      const dir = path.dirname(authDbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(authDbPath)) {
        const data = fs.readFileSync(authDbPath, 'utf-8');
        return JSON.parse(data) as AuthStorage;
      }
    } catch (error) {
      logger.warn('Failed to load auth storage', { error });
    }

    return {
      users: {},
      lastModified: new Date().toISOString()
    };
  }

  /**
   * Sauvegarder le stockage d'authentification
   */
  private saveAuthStorage(): void {
    try {
      const dir = path.dirname(authDbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.storage.lastModified = new Date().toISOString();
      fs.writeFileSync(authDbPath, JSON.stringify(this.storage, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save auth storage', { error });
    }
  }

  /**
   * Définir le PIN maître (administrateur)
   */
  setMasterPin(pin: string): boolean {
    if (!this.validatePIN(pin)) {
      return false;
    }

    const { hash, salt } = hashPassword(pin);
    this.storage.masterPin = { hash, salt };
    this.saveAuthStorage();
    logger.info('Master PIN set');
    return true;
  }

  /**
   * Vérifier le PIN maître
   */
  verifyMasterPin(pin: string): boolean {
    if (!this.storage.masterPin) {
      return false;
    }

    try {
      return verifyPassword(pin, this.storage.masterPin.hash, this.storage.masterPin.salt);
    } catch {
      return false;
    }
  }

  /**
   * Ajouter un utilisateur avec PIN
   */
  addUser(userId: string, pin: string): boolean {
    if (!this.validatePIN(pin) || this.storage.users[userId]) {
      return false;
    }

    const { hash, salt } = hashPassword(pin);
    this.storage.users[userId] = {
      id: userId,
      pin: hash,
      salt: salt,
      createdAt: new Date().toISOString(),
      attempts: 0
    };

    this.saveAuthStorage();
    logger.info('User added', { userId });
    return true;
  }

  /**
   * Vérifier le PIN d'un utilisateur
   */
  verifyUserPin(userId: string, pin: string): boolean {
    const user = this.storage.users[userId];

    if (!user) {
      return false;
    }

    // Vérifier le verrouillage après tentatives échouées
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      logger.warn('User account locked', { userId });
      return false;
    }

    try {
      const isValid = verifyPassword(pin, user.pin, user.salt);

      if (!isValid) {
        user.attempts++;
        if (user.attempts >= 5) {
          user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
          logger.warn('User locked after failed attempts', { userId });
        }
        this.saveAuthStorage();
        return false;
      }

      // Réinitialiser les tentatives
      user.attempts = 0;
      user.lockedUntil = undefined;
      this.saveAuthStorage();
      logger.info('User authenticated', { userId });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valider le format du PIN
   */
  private validatePIN(pin: string): boolean {
    // PIN de 4 à 8 chiffres
    return /^\d{4,8}$/.test(pin);
  }

  /**
   * Obtenir la liste des utilisateurs
   */
  getUsers(): string[] {
    return Object.keys(this.storage.users);
  }

  /**
   * Supprimer un utilisateur
   */
  removeUser(userId: string): boolean {
    if (!this.storage.users[userId]) {
      return false;
    }

    delete this.storage.users[userId];
    this.saveAuthStorage();
    logger.info('User removed', { userId });
    return true;
  }

  /**
   * Vérifier si le système est initialisé
   */
  isInitialized(): boolean {
    return !!this.storage.masterPin;
  }
}

export default new AuthenticationManager();
