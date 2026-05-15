import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dbPath = process.env.DATABASE_PATH || path.join('database', 'system.db');

export function initDatabase() {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
  }

  const initSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      face_encoding TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      status TEXT NOT NULL,
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
  `;

  try {
    execSync(`sqlite3 "${dbPath}" "${initSQL.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (error) {
    console.error('Database initialization failed', error);
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

export async function logAccessEvent(event: AccessEvent) {
  const sql = `INSERT INTO access_logs (user, status, timestamp, snapshot_path, camera_id) VALUES ('${event.user}', '${event.status}', '${event.timestamp}', '${event.snapshotPath || ''}', '${event.cameraId || ''}');`;
  try {
    execSync(`sqlite3 "${dbPath}" "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed to log access event', error);
  }
}

export async function logIntrusionEvent(event: IntrusionEvent) {
  const sql = `INSERT INTO intrusion_logs (timestamp, image, reason) VALUES ('${event.timestamp}', '${event.image}', '${event.reason}');`;
  try {
    execSync(`sqlite3 "${dbPath}" "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed to log intrusion event', error);
  }
}
