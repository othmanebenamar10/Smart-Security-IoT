# Guide de Sécurité

## Principes de sécurité appliqués

### OWASP Top 10 (2021)

| # | Risque | Mitigation | Statut |
|---|--------|-----------|--------|
| A01 | Broken Access Control | Authentification stricte, validation IPC | ✅ |
| A02 | Cryptographic Failures | AES-256-GCM, TLS future | ✅ |
| A03 | Injection | Prepared statements SQLite, validation | ✅ |
| A04 | Insecure Design | Architecture zero-trust, sandbox | ✅ |
| A05 | Security Misconfiguration | Env vars, CSP, défauts sécurisés | ✅ |
| A06 | Vulnerable Components | Dépendances à jour, npm audit | ✅ |
| A07 | Authentication Failures | Admin credentials hashés | ✅ |
| A08 | Data Integrity Failures | Logs d'audit signés | ✅ |
| A09 | Access Control Failures | Context isolation, IPC whitelist | ✅ |
| A10 | Cryptography Failures | AES-256-GCM, certificats SSL | ✅ |

## Architecture de sécurité Electron

### Context Isolation

```typescript
// main.ts - SÉCURISÉ
webPreferences: {
  contextIsolation: true,      // ✅ Isoler renderer du main
  nodeIntegration: false,      // ✅ Pas d'accès Node direct
  sandbox: true,               // ✅ Sandbox Chromium
  preload: path.join(__dirname, '../preload/preload.js')
}
```

### IPC Sécurisé (Whitelist)

```typescript
// preload.ts - WHITELIST STRICTE
const allowedChannels = {
  send: ['secure:ping', 'secure:fetch-state'],
  receive: ['face-event', 'log-update']
};

contextBridge.exposeInMainWorld('secureAPI', {
  send: (channel: string, payload?: unknown) => {
    if (allowedChannels.send.includes(channel)) {
      return ipcRenderer.invoke(channel, payload);
    }
    throw new Error('IPC channel not allowed');
  }
});
```

### Content Security Policy (CSP)

```html
<!-- renderer/index.html -->
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline'; 
           img-src 'self' data:; 
           connect-src 'self' ws: http: https:;">
```

## Gestion des credentials

### Variables d'environnement (.env)

```env
# NE JAMAIS committer .env en production
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<SHA256_DU_MOT_DE_PASSE>
AES_SECRET=<32_BYTES_HEXADÉCIMAUX>
```

### Génération hash admin

```bash
# Linux/Mac
echo -n "monmotdepasse" | sha256sum

# PowerShell Windows
[System.Security.Cryptography.SHA256]::ComputeHash([System.Text.Encoding]::UTF8.GetBytes("monmotdepasse")) | ForEach-Object { $_ -f 'x2' }
```

### Génération secret AES

```bash
# Linux/Mac
openssl rand -hex 32

# PowerShell Windows
[System.Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Chiffrement des données sensibles

### Encodages visages (Face Encoding)

```typescript
// security/aes.ts
import crypto from 'crypto';

export function encryptPayload(secret: string, text: string) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

### Stockage sécurisé

```json
{
  "nom": "Admin Industriel",
  "face_encoding": "iv:tag:encrypted_base64",
  "role": "admin",
  "created_at": "2026-05-13T00:00:00Z"
}
```

## Protection contre les attaques courantes

### Anti-brute force (Admin login)

```typescript
// Limiter tentatives de connexion
const LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

let failedAttempts = 0;
let lockoutTime = null;

function checkAdminPassword(username: string, password: string) {
  if (lockoutTime && Date.now() < lockoutTime) {
    throw new Error('Account locked. Try again later.');
  }
  
  if (!verifyAdmin(username, password)) {
    failedAttempts++;
    if (failedAttempts >= LOGIN_ATTEMPTS) {
      lockoutTime = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      throw new Error('Too many failed attempts. Account locked.');
    }
  }
  
  failedAttempts = 0;
}
```

### Protection XSS (React)

```tsx
// Utiliser React.escapeHtml par défaut
// Éviter dangerouslySetInnerHTML

// ❌ MAUVAIS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ BON
<div>{userInput}</div>
```

### Validation stricte des entrées

```typescript
// security/validate.ts
export function validateIPCRequest(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid IPC payload');
  }
  if (Array.isArray(payload)) {
    throw new Error('Array payloads not allowed');
  }
  return payload;
}
```

## Isolation réseau

### Topologie recommandée

```
┌─────────────────────────────────────────┐
│        Réseau de sécurité IoT           │
├─────────────────────────────────────────┤
│ 192.168.10.0/24                         │
│                                         │
│ ┌──────────────┐  ┌──────────────┐     │
│ │  Caméra RTSP │  │ Siemens      │     │
│ │  IP          │  │ LOGO! V8     │     │
│ │  192.168.10.50 │  │ 192.168.10.100 │     │
│ └──────────────┘  └──────────────┘     │
│                                         │
│        Firewall / Routeur               │
├─────────────────────────────────────────┤
│      Réseau LAN Corporatif              │
│      192.168.1.0/24                     │
│                                         │
│   PC Sécurité Access IoT                │
│   192.168.1.10                          │
└─────────────────────────────────────────┘
```

### Règles Firewall

```bash
# Autoriser UNIQUEMENT
ufw allow from 192.168.10.50 to any port 22  # SSH pour admin
ufw allow from 192.168.10.100 to any port 102 # Snap7 (Siemens)

# BLOQUER tout autre trafic
ufw default deny incoming
ufw default allow outgoing
```

## Logs d'audit

### Points de log critiques

```typescript
// main/main.ts
logger.info('Face recognized', { user: event.user, timestamp: event.timestamp });
logger.warn('Unauthorized face detected', { reason: event.reason });
logger.error('Failed to set up application', { error });
logger.info('Admin login attempt', { username, success: true/false });
```

### Format audit

```
timestamp [level] event_type | user | result | additional_data
2026-05-13 14:22:33 [INFO] FACE_AUTHORIZED | Admin | OK | snapshot_id
2026-05-13 14:23:01 [WARN] INTRUSION_DETECTED | unknown | BLOCKED | event_id
2026-05-13 14:23:15 [ERROR] PLC_CONNECTION_FAILED | system | FAILED | error_msg
```

### Archivage logs

```bash
# Archiver logs tous les jours
0 0 * * * gzip -c logs/app.log > logs/archive/app-$(date +\%Y\%m\%d).log.gz && > logs/app.log
```

## Checklist de déploiement

### Avant production

- [ ] Fichier .env configuré (pas en git)
- [ ] Admin password hash généré (SHA-256)
- [ ] AES secret généré (openssl rand -hex 32)
- [ ] Caméra RTSP en réseau isolé
- [ ] Siemens LOGO! firewall configuré
- [ ] Base de données SQLite chiffré
- [ ] Logs d'audit activés
- [ ] CSP stricte testée
- [ ] IPC whitelist vérifiée
- [ ] npm audit passed (0 vulnérabilités critiques)
- [ ] Tests de sécurité passés
- [ ] Certificats SSL installés
- [ ] Sauvegardes régulières en place

### En production

- [ ] Accès administrateur limité
- [ ] Monitoring système activé
- [ ] Alertes de sécurité configurées
- [ ] Rotation des logs (7 jours)
- [ ] Backups quotidiens
- [ ] Plan de disaster recovery
- [ ] Tests de penetration (optionnel)
- [ ] Conformité RGPD vérifiée (données faciales)

## Conformité RGPD (données biométriques)

### Obligation légale
- Article 9 RGPD: Données biométriques = données spéciales
- Consentement explicite requis
- Retention minimale (ne pas garder plus que nécessaire)
- Droit à l'oubli (suppression encodages)

### Implémentation

```typescript
// Supprimer données utilisateur
export async function deleteUserData(userId: string) {
  // Supprimer face_encoding
  // Archiver logs 6 mois, puis purger
  // Garder trace audit (légalement requis)
}
```

### Notice légale

À afficher aux utilisateurs :
```
"Reconnaissance faciale activée. Vos données biométriques 
sont traitées conformément au RGPD. Droit d'accès et 
suppression: contact@company.com"
```

## Mise à jour de sécurité

### Vérifier vulnérabilités npm
```bash
npm audit
npm audit fix
```

### Vérifier vulnérabilités Python
```bash
pip-audit
pip install --upgrade package
```

### Processus d'update
1. Vérifier changelog
2. Tester sur environnement staging
3. Appliquer en production
4. Vérifier logs d'erreur

## Incident response

### En cas de compromission

1. **Isoler immédiatement**
   - Déconnecter caméra RTSP
   - Couper accès Siemens LOGO!

2. **Analyser les logs**
   ```bash
   cat logs/app.log | grep "INTRUSION\|UNAUTHORIZED\|ERROR"
   ```

3. **Sauvegarder evidences**
   ```bash
   tar -czf incident_backup_$(date +%s).tar.gz logs/ database/
   ```

4. **Notifier administrateur**
   - Template d'alerte préparé
   - Procédure escalade documentée

## Ressources de sécurité

- OWASP: https://owasp.org/
- CISA: https://www.cisa.gov/
- CVE Database: https://www.cvedetails.com/
- npm Security: https://www.npmjs.com/advisories
