# API Documentation

Documentation des interfaces TypeScript et modules Python pour Smart Secure Access IoT System.

## Frontend API (React Components)

### Dashboard Component

**Location**: `renderer/src/components/Dashboard.tsx`

```typescript
interface DashboardProps {
  // (props coming from main App)
}

export default function Dashboard(): JSX.Element
```

**Features**:
- Affiche l'état du système
- Graphiques temps réel (Recharts)
- Historique accès
- Alertes intrusion

**Events écoutés**:
```typescript
window.secureAPI.receive('face-event', (data) => { ... })
```

---

## IPC API (Electron Bridge)

### secureAPI (Preload Context)

**Disponible dans renderer via**: `window.secureAPI`

#### `send(channel: string, payload?: unknown)`

Envoyer une requête au processus principal.

```typescript
// Exemple: Vérifier connexion
const result = await window.secureAPI.send('secure:ping');
// { ok: true, timestamp: "2026-05-13T..." }

// Exemple: Récupérer l'état système
const state = await window.secureAPI.send('secure:fetch-state', {});
// { system: "Smart Secure...", version: "0.1.0", ... }
```

**Channels autorisés**:
- `secure:ping` - Vérifier connexion avec main process
- `secure:fetch-state` - Récupérer l'état du système

---

#### `receive(channel: string, callback)`

Écouter les événements du processus principal.

```typescript
// Exemple: Écouter événements de reconnaissance faciale
const unsubscribe = window.secureAPI.receive('face-event', (event) => {
  console.log('Visage:', event.user, event.status);
});

// Se désabonner
unsubscribe();
```

**Channels disponibles**:
- `face-event` - Événement reconnaissance faciale
- `log-update` - Mise à jour logs/statistiques

---

## Backend API (TypeScript)

### Database Module

**Location**: `database/sqliteManager.ts`

#### `initDatabase()`

Initialiser la base de données SQLite.

```typescript
import { initDatabase } from '../database/sqliteManager';

initDatabase();
// Crée les tables si nécessaire
```

---

#### `logAccessEvent(event: AccessEvent)`

Enregistrer un événement d'accès.

```typescript
import { logAccessEvent, AccessEvent } from '../database/sqliteManager';

const accessEvent: AccessEvent = {
  user: 'Admin Industriel',
  status: 'authorized',
  timestamp: new Date().toISOString(),
  snapshotPath: '/snapshots/face_2026-05-13_14-22-33.png',
  cameraId: 'camera-entrance-01'
};

await logAccessEvent(accessEvent);
```

**Interface AccessEvent**:
```typescript
interface AccessEvent {
  user: string;
  status: 'authorized' | 'unauthorized';
  timestamp: string;
  snapshotPath?: string;
  cameraId?: string;
}
```

---

#### `logIntrusionEvent(event: IntrusionEvent)`

Enregistrer un événement d'intrusion.

```typescript
import { logIntrusionEvent, IntrusionEvent } from '../database/sqliteManager';

const intrusionEvent: IntrusionEvent = {
  timestamp: new Date().toISOString(),
  image: 'base64_encoded_image',
  reason: 'Face not matched to authorized database'
};

await logIntrusionEvent(intrusionEvent);
```

**Interface IntrusionEvent**:
```typescript
interface IntrusionEvent {
  timestamp: string;
  image: string;
  reason: string;
}
```

---

### Logger Module

**Location**: `logs/logger.ts`

#### `createLogger()`

Créer une instance logger Winston.

```typescript
import { createLogger } from '../logs/logger';

const logger = createLogger();

logger.info('Face recognized', { user: 'Admin', timestamp });
logger.warn('Unauthorized access attempt', { event_id: 123 });
logger.error('PLC connection failed', { error: err });
```

**Niveaux de log**: `debug`, `info`, `warn`, `error`

---

### Security Module

#### `security/aes.ts`

**Chiffrement AES-256-GCM**:

```typescript
import { encryptPayload, decryptPayload } from '../security/aes';

const secret = process.env.AES_SECRET!;

// Chiffrer
const encrypted = encryptPayload(secret, 'sensitive_data');
// Format: iv:tag:ciphertext

// Déchiffrer
const decrypted = decryptPayload(secret, encrypted);
// "sensitive_data"
```

---

#### `security/auth.ts`

**Authentification Admin**:

```typescript
import { hashPassword, verifyAdmin } from '../security/auth';

// Générer hash
const hash = hashPassword('monmotdepasse');

// Vérifier
const isValid = verifyAdmin(
  'admin',
  'monmotdepasse',
  process.env.ADMIN_PASSWORD_HASH!
);
```

---

#### `security/validate.ts`

**Validation d'entrées IPC**:

```typescript
import { validateIPCRequest } from '../security/validate';

try {
  const validated = validateIPCRequest(userPayload);
  // Procéder avec les données
} catch (error) {
  // Payload invalide
}
```

---

### Main Process Modules

#### `main/main.ts` (Electron Main)

Point d'entrée de l'application. Configure:
- Fenêtre Electron
- Services Python
- Handlers IPC

---

#### `main/faceService.ts`

**Interface avec le service Python de reconnaissance faciale**:

```typescript
import { launchFaceService, FaceEvent } from './faceService';

launchFaceService({
  onAuthorized: async (event: FaceEvent) => {
    // Utilisateur autorisé
    console.log(`Access granted: ${event.user}`);
  },
  onUnauthorized: async (event: FaceEvent) => {
    // Utilisateur non autorisé
    console.log(`Access denied: ${event.reason}`);
  }
});
```

**Interface FaceEvent**:
```typescript
interface FaceEvent {
  user: string;
  status: 'authorized' | 'unauthorized';
  timestamp: string;
  snapshotPath: string;
  cameraId: string;
  reason?: string; // Pour 'unauthorized'
}
```

---

#### `main/plcService.ts`

**Contrôleur Siemens LOGO! V8**:

```typescript
import { LogoController } from './plcService';

const plc = new LogoController();

// Allumer lumière 30 secondes
await plc.activateLight(30);

// Lire état actuel
const status = plc.readStatus();
// "ON" ou "OFF"
```

---

## Python API (Services)

### Face Recognition Service

**Location**: `ai/face_service.py`

**Utilisation**:
```bash
python3 ai/face_service.py [--run-once]
```

**Entrée**: Stream RTSP (via env var `RTSP_URL`)

**Sortie** (JSON sur stdout):
```json
{
  "user": "Admin Industriel",
  "status": "authorized",
  "timestamp": "2026-05-13T14:22:33Z",
  "snapshotPath": "/path/to/snapshot.png",
  "cameraId": "camera-entrance-01"
}
```

**Ou en cas d'intrusion**:
```json
{
  "user": "unknown",
  "status": "unauthorized",
  "timestamp": "2026-05-13T14:22:35Z",
  "snapshotPath": "/path/to/snapshot.png",
  "cameraId": "camera-entrance-01",
  "reason": "Face not matched to authorized database"
}
```

**Configuration** (via .env):
```env
RTSP_URL=rtsp://user:pass@192.168.10.50:554/stream
CAMERA_ID=camera-entrance-01
```

---

### PLC Controller Service

**Location**: `plc/logo_controller.py`

**Utilisation CLI**:
```bash
# Activer lumière 30 secondes
python3 plc/logo_controller.py --activate 30

# Lire état
python3 plc/logo_controller.py --status
```

**Configuration** (via .env):
```env
LOGO_HOST=192.168.10.100
LOGO_RACK=0
LOGO_SLOT=1
```

**Protocole**: Snap7 TCP/IP (port 102)

---

## Database Schema

### Table: `users`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  face_encoding TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

### Table: `access_logs`

```sql
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  snapshot_path TEXT,
  camera_id TEXT
);
```

---

### Table: `intrusion_logs`

```sql
CREATE TABLE intrusion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  image TEXT NOT NULL,
  reason TEXT NOT NULL
);
```

---

## Environment Variables

```env
# Caméra RTSP
RTSP_URL=rtsp://username:password@192.168.10.50:554/stream
CAMERA_ID=camera-entrance-01

# Siemens LOGO! V8
LOGO_HOST=192.168.10.100
LOGO_RACK=0
LOGO_SLOT=1

# Sécurité
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<sha256_hash>
AES_SECRET=<32_hex_bytes>

# Database
DATABASE_PATH=./database/system.db

# Application
APP_ENV=production|development
DEBUG=true|false (optionnel)
NODE_ENV=production|development
```

---

## Événements IPC

### face-event

Émis par le processus principal lorsqu'un visage est détecté.

```typescript
window.secureAPI.receive('face-event', (event) => {
  // {
  //   user: "Admin",
  //   status: "authorized",
  //   timestamp: "...",
  //   snapshotPath: "...",
  //   cameraId: "...",
  //   reason: "..." (si unauthorized)
  // }
});
```

---

### log-update

Émis par le processus principal pour mettre à jour le dashboard.

```typescript
window.secureAPI.receive('log-update', (logs) => {
  // { entries: [...], totalCount: 1234 }
});
```

---

## Exemples de code

### Créer un composant React qui utilise l'API IPC

```tsx
import { useEffect, useState } from 'react';

export function SystemStatus() {
  const [status, setStatus] = useState<string>('Chargement...');

  useEffect(() => {
    window.secureAPI.send('secure:fetch-state', {})
      .then(state => setStatus(JSON.stringify(state)))
      .catch(err => setStatus(`Erreur: ${err.message}`));
  }, []);

  return <div>{status}</div>;
}
```

---

### Écouter les événements faciales

```tsx
import { useEffect } from 'react';

export function FaceEventListener() {
  useEffect(() => {
    const unsubscribe = window.secureAPI.receive('face-event', (event) => {
      if (event.status === 'authorized') {
        console.log(`✓ Accès autorisé: ${event.user}`);
      } else {
        console.log(`✗ Accès refusé: ${event.reason}`);
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
```

---

## Notes de développement

- Tous les appels IPC doivent utiliser des channels whitelistés
- Les données sensibles doivent être chiffrées avec `encryptPayload`
- Les logs doivent inclure suffisamment de contexte
- Les erreurs doivent être catchées et loggées, jamais silent
- Les chemins fichiers doivent être résolus avec `path.join`

---

**Dernière mise à jour**: 13 mai 2026
