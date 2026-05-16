# 🛡️ Smart Security IoT - Caméra Jardin

Système de sécurité intelligent léger optimisé pour un usage local (PFE / Démonstration IoT).
Le système gère une caméra de surveillance (RTSP ou USB) avec reconnaissance faciale temps réel, stockage local et alertes email.

## 🚀 Fonctionnalités
- **Vision IA** : Détection et reconnaissance faciale (connu/inconnu).
- **Dashboard Cyber** : Interface futuriste Dark Mode avec TailwindCSS.
- **Alertes Gratuites** : Notifications par Email (SMTP Gmail) avec capture d'écran.
- **Historique** : Journalisation complète des événements dans SQLite.
- **Local-First** : 100% gratuit, aucune API payante, respect de la vie privée.

## 🛠️ Installation

### Prérequis
- Python 3.10+ & Node.js 18+
- CMake (pour `dlib` / `face_recognition`)

### Setup
```bash
# 1. Environnement Python
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate sur Windows
pip install -r requirements.txt
# 2. Configuration
cp .env.example .env
# Editez .env avec vos accès SMTP et URL RTSP
```

## 🏃 Lancement

**Backend (Flask):**
```bash
python backend/app.py
```

**Frontend (React):**
```bash
cd renderer && npm install && npm run dev
```

## 📁 Structure
```text
├── backend/        # Serveur Flask & Gestion de flux MJPEG
├── ai/             # Moteur de reconnaissance faciale
├── database/       # SQLite (logs & users)
├── renderer/       # Dashboard React (Tailwind)
└── assets/         # Captures d'écran et snapshots
```

## 🏗️ Architecture
```
Electron (Main + Renderer)
    ↓
┌───────────────────────────────────┐
│ TypeScript Services               │
├───────────────────────────────────┤
│ • Face Recognition (Python AI)    │
│ • PLC Controller (Snap7)          │
│ • Database (SQLite)               │
│ • Security (AES-256, Validation)  │
├───────────────────────────────────┤
│ External Systems                  │
│ • Camera RTSP IP                  │
│ • Siemens LOGO! V8                │
└───────────────────────────────────┘
```

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour détails complets.

## ⚡ Quick Start

### Prérequis
- Node.js 18+
- Python 3.10+
- Git
- Caméra RTSP + Siemens LOGO! V8 sur réseau

### Installation Kali Linux

```bash
# 1. Cloner le repo
git clone <url> && cd smart-secure-access-iot

# 2. Installer dépendances
npm install --legacy-peer-deps

# 3. Configurer l'environnement
cp .env.example .env
nano .env

# 4. Installer services Python
cd ai && pip install -r requirements.txt
cd ../plc && pip install -r requirements.txt
cd ..

# 5. Lancer en développement
npm run dev

# 6. Compiler l'exécutable Windows
npm run package:windows
```

Voir [INSTALLATION_KALI.md](./INSTALLATION_KALI.md) pour guide détaillé.

### Installation Windows

Télécharger l'exécutable :
```
SmartSecureAccessIoTInstaller.exe
```

Puis créer `.env` dans le dossier d'installation. Voir [INSTALLATION_WINDOWS.md](./INSTALLATION_WINDOWS.md).

## 📦 Stack Technique

### Frontend
- **Electron** 26.3.0 - Framework desktop multiplateforme
- **React** 18.3.1 - Interface utilisateur
- **Tailwind CSS** 3.4.4 - Styling CSS utilitaire
- **Framer Motion** 10.18.0 - Animations fluides
- **Recharts** 2.7.2 - Graphiques en temps réel
- **Vite** 5.4.4 - Build tool ultra-rapide

### Backend / Services
- **TypeScript** 5.6.0 - Type-safe backend
- **Winston** - Logging structuré
- **Python 3.10+** - Services IA et PLC
- **OpenCV** 4.8.1 - Traitement d'images
- **DeepFace** 0.0.89 - Détection faciale
- **face_recognition** - Encodage/reconnaissance
- **python-snap7** 1.3.25 - Communication Siemens

### Infrastructure
- **SQLite** 3 - Base de données légère
- **Snap7** - Protocole Siemens LOGO!
- **electron-builder** 24.6.1 - Packaging cross-platform
- **Jest** 29.7.0 - Tests unitaires

## 🔒 Sécurité

Implémentation stricte des standards industriels :
- **OWASP Top 10** - Tous les risques mitigés
- **Electron hardening** - Context isolation, sandbox, CSP
- **Zero trust** - Validation stricte IPC
- **Chiffrement** - AES-256-GCM pour données sensibles
- **Audit logs** - Tous les événements enregistrés
- **RGPD ready** - Conformité données biométriques

Voir [SECURITY.md](./SECURITY.md) pour checklist complète.

## 📊 Cas d'usage

### Visage autorisé
```
Détection → Reconnaissance → Vérification → Lumière ON 30s → Log
```

### Visage inconnu
```
Détection → Pas de match → Alerte intrusion → Lumière OFF → Log sécurité
```

## 🚀 Déploiement

### Développement
```bash
npm run dev          # Watch mode avec hot reload
npm run build        # Build production complet
npm run test         # Tests complets
npm run lint         # ESLint
```

### Production - Windows
```bash
npm run package:windows
# Génère: dist/SmartSecureAccessIoTInstaller.exe
```

### Production - Linux
```bash
npm run package:linux
# Génère: dist/SmartSecureAccessIoT.AppImage
```

## 📝 Configuration

### Variables d'environnement (.env)

```env
# Caméra RTSP
RTSP_URL=rtsp://user:pass@192.168.10.50:554/stream
CAMERA_ID=camera-entrance-01

# Siemens LOGO! V8
LOGO_HOST=192.168.10.100
LOGO_RACK=0
LOGO_SLOT=1

# Sécurité
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<sha256>
AES_SECRET=<32_hex_bytes>

# Base de données
DATABASE_PATH=./database/system.db
APP_ENV=development
```

### Format RTSP courants

```
Hikvision/Dahua:  rtsp://user:pass@192.168.10.50:554/stream
Axis:             rtsp://user:pass@192.168.10.50:554/axis-media/media.amp
Reolink:          rtsp://user:pass@192.168.10.50:554/h264Preview_01_main
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture détaillée et flux de données |
| [INSTALLATION_KALI.md](./INSTALLATION_KALI.md) | Guide d'installation Kali Linux |
| [INSTALLATION_WINDOWS.md](./INSTALLATION_WINDOWS.md) | Guide d'installation Windows |
| [SECURITY.md](./SECURITY.md) | Checklist sécurité et hardening |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Dépannage et solutions |

## 🧪 Tests

### Tests Electron/IPC
```bash
npm run test:main
```

### Tests Vision IA
```bash
python3 ai/face_service.py --run-once
```

### Tests Siemens LOGO!
```bash
python3 plc/logo_controller.py --status
```

### Tests complets
```bash
npm test
```

## 📋 Structure du projet

```
smart-secure-access-iot/
├── main/                    # Processus Electron principal
├── renderer/                # Interface React + Tailwind
├── preload/                 # Bridge IPC sécurisé
├── ai/                      # Service reconnaissance faciale
├── plc/                     # Contrôleur Siemens LOGO!
├── database/                # Gestion SQLite
├── security/                # Modules sécurité (AES, validation)
├── logs/                    # Configuration logging
├── tests/                   # Tests unitaires et fonctionnels
├── installer/               # Ressources d'installation
├── ARCHITECTURE.md          # Architecture détaillée
├── SECURITY.md              # Guide de sécurité
├── INSTALLATION_KALI.md     # Installation Linux
├── INSTALLATION_WINDOWS.md  # Installation Windows
└── package.json             # Configuration npm
```

## 🤝 Contribution

Les contributions sont bienvenues ! Pour des modifications mineures :
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir [LICENSE](./LICENSE) pour détails.

## 🔗 Ressources

- **Electron**: https://www.electronjs.org/
- **OpenCV**: https://opencv.org/
- **Snap7**: http://snap7.sourceforge.net/
- **OWASP**: https://owasp.org/
- **SQLite**: https://www.sqlite.org/

## 📞 Support

Pour des questions ou issues:
- Consulter [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Vérifier les logs: `logs/app.log`
- Ouvrir une issue GitHub

---

**Dernier update**: 13 mai 2026 | **Mainteneur**: Smart Secure Access IoT Team

*"Sécurité, simplicité, professionnalisme"*
"}