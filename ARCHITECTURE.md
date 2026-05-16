# Architecture Technique

Smart Secure Access IoT System est une architecture modulaire professionnelle pour le contrôle d'accès sécurisé basé sur reconnaissance faciale.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                   Electron Main Window                      │
│                  (React Dashboard - Renderer)               │
├─────────────────────────────────────────────────────────────┤
│  Preload API (IPC Bridge - Context Isolated)                │
├─────────────────────────────────────────────────────────────┤
│                   Main Process (TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Face Service │  │ PLC Service  │  │ DB Service   │       │
│  │ (Python)     │  │ (Python)     │  │ (SQLite)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│ External Systems                                            │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Camera RTSP      │  │ Siemens LOGO! V8 │                  │
│ │ IP (OpenCV)      │  │ Snap7 TCP/IP     │                  │
│ └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Composants principaux

### 1. **Processus Principal (Electron)**
- **Fichier**: [main/main.ts](../main/main.ts)
- **Responsabilités**:
  - Gestion du cycle de vie Electron
  - Coordination des services IA et PLC
  - Gestion des événements IPC sécurisés
  - Logging centralisé
  - Gestion des erreurs applicatives

### 2. **Interface Utilisateur (React + Tailwind)**
- **Dossier**: [renderer/src](../renderer/src)
- **Composants**:
  - Dashboard principal avec statistiques d'accès
  - Historique des événements
  - Alertes de sécurité
  - État du système en temps réel
- **Sécurité**:
  - Context Isolation activée
  - CSP stricte
  - Sandbox Electron

### 3. **Service de Reconnaissance Faciale (Python)**
- **Fichier**: [ai/face_service.py](../ai/face_service.py)
- **Stack**:
  - OpenCV pour capture RTSP
  - face_recognition pour encodage
  - DeepFace pour détection
- **Flux**:
  1. Lecture stream RTSP
  2. Détection du visage
  3. Comparaison avec base de données
  4. Envoi du résultat en JSON via stdout
- **Sortie**: `{"user": "...", "status": "authorized/unauthorized", "timestamp": "...", "snapshotPath": "..."}`

### 4. **Contrôleur Siemens LOGO! V8 (Python)**
- **Fichier**: [plc/logo_controller.py](../plc/logo_controller.py)
- **Stack**:
  - python-snap7 pour communication Snap7
  - TCP/IP sur port standard Siemens
- **Commandes**:
  - `--activate <timeout>`: Allume lumière N secondes
  - `--status`: Lit état actuel
- **Registre**:
  - V10.0: Bit de commande lumière d'entrée

### 5. **Base de Données (SQLite)**
- **Fichier**: [database/sqliteManager.ts](../database/sqliteManager.ts)
- **Tables**:
  - `users`: Base de données visages autorisés
  - `access_logs`: Logs d'accès acceptés
  - `intrusion_logs`: Logs d'intrusions

### 6. **Sécurité (TypeScript + Crypto)**
- **Fichier**: [security/](../security)
- **Modules**:
  - `validate.ts`: Validation stricte des entrées IPC
  - `aes.ts`: Chiffrement AES-256-GCM
  - `auth.ts`: Authentification admin

## Flux de données

### Cas 1: Accès autorisé

```
1. Caméra RTSP envoie image
   ↓
2. face_service.py détecte visage
   ↓
3. Comparaison encodage ← authorized_users.json
   ↓
4. Match trouvé → {"user": "Admin", "status": "authorized"}
   ↓
5. Processus principal reçoit
   ↓
6. LogoController.activateLight(30)
   ↓
7. Snap7 écrit V10.0 = 1
   ↓
8. Lumière s'allume 30 secondes
   ↓
9. logAccessEvent() → SQLite
   ↓
10. Dashboard mise à jour en temps réel
```

### Cas 2: Intrusion

```
1. Visage non reconnu
   ↓
2. {"status": "unauthorized", "reason": "Not in database"}
   ↓
3. logIntrusionEvent() → SQLite
   ↓
4. Alerte affichée au dashboard
   ↓
5. Lumière reste éteinte
   ↓
6. Logs de sécurité générés
```

## Sécurité par défaut

- ✅ **contextIsolation**: true
- ✅ **nodeIntegration**: false
- ✅ **sandbox**: true
- ✅ **CSP** stricte (default-src 'self')
- ✅ **IPC validé** avec whitelist
- ✅ **Variables d'env** séparées (.env)
- ✅ **Pas de secrets** en dur
- ✅ **Chiffrement AES-256** des données sensibles
- ✅ **Logs d'audit** complets

## Structure des répertoires

```
.
├── main/                  # Processus principal Electron
│   ├── main.ts           # Point d'entrée Electron
│   ├── faceService.ts    # Interface service IA
│   └── plcService.ts     # Interface Siemens LOGO!
├── renderer/             # Interface utilisateur React
│   ├── index.html        # Document HTML
│   └── src/
│       ├── main.tsx      # Point d'entrée React
│       ├── App.tsx       # App component
│       ├── components/   # Composants React
│       └── styles/       # Tailwind CSS
├── preload/              # Bridge IPC sécurisé
│   └── preload.ts        # API sécurisée
├── ai/                   # Services Python IA
│   ├── face_service.py   # Reconnaissance faciale
│   ├── requirements.txt  # Dépendances Python
│   └── authorized_users.json  # Base utilisateurs
├── plc/                  # Services Siemens
│   ├── logo_controller.py # Contrôleur LOGO! V8
│   └── requirements.txt   # Dépendances Python
├── database/             # Gestion SQLite
│   └── sqliteManager.ts  # Manager database
├── security/             # Modules sécurité
│   ├── validate.ts       # Validation
│   ├── aes.ts           # Chiffrement
│   └── auth.ts          # Authentification
├── logs/                 # Système de logs
│   └── logger.ts        # Winston logger
├── tests/                # Tests unitaires
│   ├── main.test.ts
│   └── python/
├── installer/            # Ressources installation
│   ├── README.md
│   └── windows-installer.nsi
└── package.json          # Configuration npm
```

## Technologies utilisées

| Couche | Technologie | Version |
|--------|-------------|---------|
| Desktop | Electron | 26.3.0 |
| Frontend | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.4 |
| Animations | Framer Motion | 10.18.0 |
| Build | Vite | 5.4.4 |
| Backend | TypeScript | 5.6.0 |
| Vision IA | OpenCV | 4.8.1 |
| Reconnaissance | DeepFace | 0.0.89 |
| PLC | python-snap7 | 1.3.25 |
| Database | SQLite | 3 |
| Logs | Winston | (latest) |
| Tests | Jest | 29.7.0 |
| Build Windows | electron-builder | 24.6.1 |

## Communication inter-processus

### IPC sécurisé (Electron)

```typescript
// Whitelist des canaux autorisés
allowedChannels = {
  send: ['secure:ping', 'secure:fetch-state'],
  receive: ['face-event', 'log-update']
};
```

### Communication Python

```
Processus principal
  ↓
spawn('python3', ['face_service.py'])
  ↓
Écoute stdout/stderr JSON
  ↓
parse JSON
  ↓
DB + Dashboard update
```

## Compilation et Build

### Développement
```bash
npm run dev          # Watch mode avec Electron
npm run build        # Build complet
```

### Production - Windows
```bash
npm run package:windows  # Génère SmartSecureAccessIoTInstaller.exe
```

### Production - Linux
```bash
npm run package:linux    # Génère .deb
```

## Checklist de sécurité

- [ ] Variables .env configurées
- [ ] Admin credentials hashés (SHA-256)
- [ ] Caméra RTSP en réseau isolé
- [ ] Siemens LOGO! firewall configuré
- [ ] Logs d'audit archivés
- [ ] CSP stricte testée
- [ ] IPC whitelist vérifiée
- [ ] Aucun secret dans le source
- [ ] Certificats SSL pour production
- [ ] Rate limiting anti-brute-force activé
