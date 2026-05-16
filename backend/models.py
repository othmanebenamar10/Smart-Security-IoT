# @author BENAMAR Othmane
# @secure Database Schema with indexing for performance
import sqlite3
import os
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.join(BASE_DIR, 'database', 'system.db')

SCHEMA = '''
CREATE TABLE IF NOT EXISTS known_faces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    last_seen TEXT
);
CREATE INDEX IF NOT EXISTS idx_known_names ON known_faces(name);

CREATE TABLE IF NOT EXISTS detection_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT,
    image_path TEXT
);
CREATE INDEX IF NOT EXISTS idx_detection_type ON detection_history(type);
CREATE INDEX IF NOT EXISTS idx_detection_timestamp ON detection_history(timestamp);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT,
    image_path TEXT
);
CREATE INDEX IF NOT EXISTS idx_event_type ON events(type);
'''


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA)
    conn.commit()
    conn.close()

def get_system_stats():
    """Récupère les statistiques réelles pour l'API."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM known_faces")
        known = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM events WHERE type='intrusion' AND timestamp >= date('now')")
        alerts = cur.fetchone()[0]
        conn.close()
        return {"known_faces": known, "alerts_today": alerts}
    except Exception:
        return {"known_faces": 0, "alerts_today": 0}

if __name__ == '__main__':
    init_db()
    print('DB initialized at', DB_PATH)
