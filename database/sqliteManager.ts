/**
 * SQLite Database Manager
 * Falls back to a JSON-backed store when the native sqlite module is unavailable.
 */
import fs from 'fs';
import path from 'path';
import { createLogger } from '../logs/logger';

const logger = createLogger();
const dbPath = path.resolve(process.env.DATABASE_PATH || path.join('database', 'system.db'));
const fallbackPath = path.resolve(path.join('database', 'system-fallback.json'));

type Statement = {
  run: (...params: unknown[]) => void;
};

type DatabaseLike = {
  pragma: (command: string) => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
  close: () => void;
};

interface AccessLogRecord {
  user: string;
  status: 'authorized' | 'unauthorized';
  timestamp: string;
  snapshot_path: string | null;
  camera_id: string | null;
}

interface IntrusionLogRecord {
  timestamp: string;
  image: string;
  reason: string;
}

interface FallbackStore {
  access_logs: AccessLogRecord[];
  intrusion_logs: IntrusionLogRecord[];
}

let db: DatabaseLike | null = null;

function ensureDatabaseDir(): void {
  const targetDir = path.dirname(dbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

function loadFallbackStore(): FallbackStore {
  ensureDatabaseDir();

  if (!fs.existsSync(fallbackPath)) {
    const initialState: FallbackStore = {
      access_logs: [],
      intrusion_logs: []
    };
    fs.writeFileSync(fallbackPath, JSON.stringify(initialState, null, 2), 'utf8');
    return initialState;
  }

  try {
    const raw = fs.readFileSync(fallbackPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FallbackStore>;
    return {
      access_logs: Array.isArray(parsed.access_logs) ? parsed.access_logs : [],
      intrusion_logs: Array.isArray(parsed.intrusion_logs) ? parsed.intrusion_logs : []
    };
  } catch (error) {
    logger.warn('Fallback database was unreadable, recreating it', { error });
    const resetState: FallbackStore = {
      access_logs: [],
      intrusion_logs: []
    };
    fs.writeFileSync(fallbackPath, JSON.stringify(resetState, null, 2), 'utf8');
    return resetState;
  }
}

function saveFallbackStore(store: FallbackStore): void {
  fs.writeFileSync(fallbackPath, JSON.stringify(store, null, 2), 'utf8');
}

function createFallbackDatabase(): DatabaseLike {
  logger.warn('better-sqlite3 unavailable, using JSON fallback database', { fallbackPath });

  return {
    pragma: () => undefined,
    exec: () => undefined,
    prepare: (sql: string): Statement => {
      if (sql.includes('INSERT INTO access_logs')) {
        return {
          run: (...params: unknown[]) => {
            const [user, status, timestamp, snapshotPath, cameraId] = params;
            const store = loadFallbackStore();
            store.access_logs.push({
              user: String(user ?? ''),
              status: status === 'authorized' ? 'authorized' : 'unauthorized',
              timestamp: String(timestamp ?? ''),
              snapshot_path: snapshotPath ? String(snapshotPath) : null,
              camera_id: cameraId ? String(cameraId) : null
            });
            saveFallbackStore(store);
          }
        };
      }

      if (sql.includes('INSERT INTO intrusion_logs')) {
        return {
          run: (...params: unknown[]) => {
            const [timestamp, image, reason] = params;
            const store = loadFallbackStore();
            store.intrusion_logs.push({
              timestamp: String(timestamp ?? ''),
              image: String(image ?? ''),
              reason: String(reason ?? '')
            });
            saveFallbackStore(store);
          }
        };
      }

      throw new Error('Unsupported fallback query');
    },
    close: () => undefined
  };
}

function createSqliteDatabase(): DatabaseLike {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BetterSqlite3 = require('better-sqlite3') as new (filename: string) => DatabaseLike;
  const database = new BetterSqlite3(dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  return database;
}

function getDatabase(): DatabaseLike {
  if (!db) {
    ensureDatabaseDir();

    try {
      db = createSqliteDatabase();
    } catch (error) {
      logger.warn('Native SQLite driver failed to load, switching to fallback storage', { error });
      db = createFallbackDatabase();
    }
  }

  return db;
}

export function initDatabase() {
  try {
    const database = getDatabase();

    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL UNIQUE,
        face_encoding TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT,
        status TEXT NOT NULL CHECK(status IN ('authorized', 'unauthorized')),
        timestamp TEXT NOT NULL,
        snapshot_path TEXT,
        camera_id TEXT
      );

      CREATE TABLE IF NOT EXISTS intrusion_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        image TEXT NOT NULL,
        reason TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_intrusion_logs_timestamp ON intrusion_logs(timestamp);
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', { error });
    throw error;
  }
}

export interface AccessEvent {
  user: string;
  status: 'authorized' | 'unauthorized';
  timestamp: string;
  snapshotPath?: string;
  cameraId?: string;
}

export interface IntrusionEvent {
  timestamp: string;
  image: string;
  reason: string;
}

export async function logAccessEvent(event: AccessEvent): Promise<void> {
  try {
    if (!event.user?.trim() || !event.status || !event.timestamp) {
      throw new Error('Missing required fields: user, status, timestamp');
    }

    const database = getDatabase();
    const stmt = database.prepare(
      `INSERT INTO access_logs (user, status, timestamp, snapshot_path, camera_id) 
       VALUES (?, ?, ?, ?, ?)`
    );

    stmt.run(
      event.user,
      event.status,
      event.timestamp,
      event.snapshotPath || null,
      event.cameraId || null
    );

    logger.info('Access event logged', { user: event.user, status: event.status });
  } catch (error) {
    logger.error('Failed to log access event', { error, event });
    throw error;
  }
}

export async function logIntrusionEvent(event: IntrusionEvent): Promise<void> {
  try {
    if (!event.timestamp || !event.image?.trim() || !event.reason?.trim()) {
      throw new Error('Missing required fields: timestamp, image, reason');
    }

    const database = getDatabase();
    const stmt = database.prepare(
      `INSERT INTO intrusion_logs (timestamp, image, reason) VALUES (?, ?, ?)`
    );

    stmt.run(event.timestamp, event.image, event.reason);
    logger.info('Intrusion event logged', { reason: event.reason });
  } catch (error) {
    logger.error('Failed to log intrusion event', { error, event });
    throw error;
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}
