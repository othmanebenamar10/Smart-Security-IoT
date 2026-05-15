# Guide d'Installation - Kali Linux

## Prérequis système

- **OS**: Kali Linux 2024+
- **CPU**: Intel/AMD x64 (2+ cores recommandés)
- **RAM**: 4 GB minimum, 8 GB recommandé
- **Disque**: 2 GB libre
- **Node.js**: 18+ (recommandé 20+)
- **Python**: 3.10+
- **Caméra IP**: Flux RTSP actif
- **Siemens LOGO! V8**: Réseau Ethernet accessible

## Étape 1 : Dépendances système

### Mise à jour système
```bash
sudo apt update && sudo apt upgrade -y
```

### Installation Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3-dev python3-pip
```

### Installation Python et OpenCV
```bash
sudo apt install -y python3-venv python3-opencv libopencv-dev
```

### Installation SQLite
```bash
sudo apt install -y sqlite3 libsqlite3-dev
```

## Étape 2 : Clonage et préparation

```bash
cd /opt
git clone <repo-url> smart-secure-access-iot
cd smart-secure-access-iot
```

## Étape 3 : Configuration

### Copier fichier .env
```bash
cp .env.example .env
nano .env
```

### Éditer .env
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
ADMIN_PASSWORD_HASH=$(echo -n "monmotdepasse" | sha256sum | cut -d' ' -f1)
AES_SECRET=$(openssl rand -hex 32)

# Base de données
DATABASE_PATH=./database/system.db
APP_ENV=development
```

## Étape 4 : Installation dépendances Node

```bash
npm install --legacy-peer-deps
```

Si vous avez des erreurs de compilation native, essayez :
```bash
npm ci --legacy-peer-deps
```

## Étape 5 : Installation dépendances Python (IA)

```bash
cd ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Étape 6 : Installation dépendances Python (PLC)

```bash
cd plc
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Étape 7 : Initialisation base de données

```bash
sqlite3 database/system.db < schema.sql
```

Ou directement:
```bash
npm run build:main
```

## Étape 8 : Lancement en développement

### Terminal 1 - Build Renderer React
```bash
npm run watch:renderer
```

### Terminal 2 - Build Main TypeScript
```bash
npm run watch:main
```

### Terminal 3 - Lancer Electron
```bash
npm run start:electron
```

Ou en une commande :
```bash
npm run dev
```

## Étape 9 : Configuration caméra RTSP

### Test flux RTSP
```bash
ffplay rtsp://username:password@192.168.10.50:554/stream
```

### Format RTSP courants
```
# Hikvision/Dahua
rtsp://username:password@192.168.10.50:554/stream
rtsp://username:password@192.168.10.50:554/h264/ch1

# Axis
rtsp://username:password@192.168.10.50:554/axis-media/media.amp?videocodec=h264

# Reolink
rtsp://username:password@192.168.10.50:554/h264Preview_01_main
```

## Étape 10 : Configuration Siemens LOGO! V8

### Test connexion TCP/IP
```bash
telnet 192.168.10.100 102
```

### Configuration Snap7
Le script `plc/logo_controller.py` se connecte automatiquement via :
- Host: Variable d'env `LOGO_HOST`
- Rack/Slot: Variables d'env `LOGO_RACK` / `LOGO_SLOT`

### Variables mémoire LOGO!
```
V10.0 = Bit de commande lumière entrée
```

Mettre en place dans le programme LOGO! :
```
INPUT:  V10.0 (Bit commande)
OUTPUT: Q1    (Sortie relais/contacteur)
```

## Étape 11 : Enregistrement utilisateurs autorisés

### Créer fichier JSON
```bash
cat > ai/authorized_users.json << 'EOF'
[
  {
    "nom": "Admin Industriel",
    "role": "admin",
    "face_encoding": "base64_encoded_face_vector",
    "created_at": "2026-05-13T00:00:00Z"
  }
]
EOF
```

Pour générer face_encoding, utiliser script Python :
```bash
cd ai
python3 << 'PYEOF'
import face_recognition
import json
import base64

# Charger image utilisateur
image = face_recognition.load_image_file("admin_photo.jpg")
encodings = face_recognition.face_encodings(image)

if encodings:
    encoding_json = json.dumps(encodings[0].tolist())
    print(encoding_json)
else:
    print("Aucun visage détecté")
PYEOF
```

## Étape 12 : Tests

### Tests Electron/IPC
```bash
npm run test:main
```

### Tests service IA
```bash
python3 ai/face_service.py --run-once
```

### Tests PLC (simulation)
```bash
python3 plc/logo_controller.py --status
```

### Tests complets
```bash
npm test
```

## Étape 13 : Build pour déploiement

### Build production
```bash
npm run build
```

### Générer exécutable AppImage Linux
```bash
npm run package:linux
```

### Build Windows (cross-compilation)
```bash
npm run package:windows
```

## Dépannage

### "RTSP stream not available"
- Vérifier URL RTSP dans .env
- Tester avec `ffplay`
- Vérifier firewall/routage réseau

### "Unable to connect to LOGO! PLC"
- Vérifier IP LOGO! correcte
- Tester ping vers LOGO!
- Vérifier paramètres Rack/Slot

### "No prebuilt binaries found"
- Compiler pour votre architecture Node
- Utiliser `--legacy-peer-deps`
- Installer build-essential

### "Face service process crashed"
- Vérifier OpenCV installé: `python3 -c "import cv2"`
- Vérifier DeepFace: `python3 -c "from deepface import DeepFace"`
- Voir logs: `tail -f logs/app.log`

## Production (Services systemd)

### Créer service systemd
```bash
sudo tee /etc/systemd/system/smart-secure-access.service << EOF
[Unit]
Description=Smart Secure Access IoT System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/smart-secure-access-iot
ExecStart=/usr/bin/node dist/main/main.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Activerservice
```bash
sudo systemctl daemon-reload
sudo systemctl enable smart-secure-access
sudo systemctl start smart-secure-access
```

### Vérifier logs
```bash
journalctl -u smart-secure-access -f
```

## Support

Documenter les problèmes et solutions dans `TROUBLESHOOTING.md`.
