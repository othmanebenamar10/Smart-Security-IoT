# Guide d'Installation - Windows

## Prérequis

- **OS**: Windows 10/11 (x64)
- **RAM**: 4 GB minimum
- **Disque**: 500 MB libre
- **Droits administrateur**: Requis pour installation

## Option 1 : Installer l'exécutable (.exe)

### Télécharger l'installer
```
SmartSecureAccessIoTInstaller.exe (généré par npm run package:windows)
```

### Lancer l'installation
1. Double-cliquer `SmartSecureAccessIoTInstaller.exe`
2. Accepter les conditions
3. Choisir le dossier d'installation (défaut: `C:\Program Files`)
4. Cliquer "Install"
5. L'application se lance automatiquement

### Configurer après installation

1. Créer fichier `.env` dans le dossier d'installation
```
C:\Program Files\Smart Secure Access IoT System\.env
```

2. Remplir la configuration
```env
RTSP_URL=rtsp://username:password@192.168.10.50:554/stream
LOGO_HOST=192.168.10.100
LOGO_RACK=0
LOGO_SLOT=1
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<hash_sha256>
AES_SECRET=<secret_aléatoire>
DATABASE_PATH=C:\ProgramData\SmartSecureAccessIoT\system.db
APP_ENV=production
```

3. Redémarrer l'application

## Option 2 : Build depuis source (développement)

### Prérequis logiciels

1. **Node.js 20+**
   - Télécharger depuis https://nodejs.org/
   - Installer avec npm

2. **Python 3.10+**
   - Télécharger depuis https://www.python.org/
   - Cocher "Add Python to PATH" lors de l'installation

3. **Git**
   - Télécharger depuis https://git-scm.com/

### Installation

1. Cloner le projet
```bash
git clone <repo-url> C:\Dev\smart-secure-access-iot
cd C:\Dev\smart-secure-access-iot
```

2. Installer dépendances Node
```bash
npm install --legacy-peer-deps
```

3. Installer dépendances Python (IA)
```bash
cd ai
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

4. Installer dépendances Python (PLC)
```bash
cd plc
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

5. Créer et configurer `.env`
```bash
cp .env.example .env
notepad .env
```

### Lancer en développement
```bash
npm run dev
```

### Créer l'installateur Windows
```bash
npm run package:windows
```

L'exécutable sera généré dans : `./dist/SmartSecureAccessIoTInstaller.exe`

## Configuration réseau Windows

### Autoriser à travers le Firewall

1. Ouvrir "Windows Defender Firewall with Advanced Security"
2. Cliquer "Inbound Rules" → "New Rule"
3. Sélectionner "Program"
4. Parcourir vers `SmartSecureAccessIoT.exe`
5. Permettre les connexions privées et publiques
6. Terminer

### Configuration caméra RTSP

Sur Windows, installer VLC pour tester le flux RTSP:
```
1. Ouvrir VLC
2. File → Open Network Stream
3. Entrer URL RTSP
4. Play
```

## Configuration Siemens LOGO! V8 sur réseau Windows

### 1. Configuration réseau
- LOGO! IP: `192.168.10.100`
- Masque: `255.255.255.0`
- Gateway: `192.168.10.1`
- Windows IP: `192.168.10.x` (même réseau)

### 2. Tester la connexion
```bash
ping 192.168.10.100
```

### 3. Configuration PLC TCP/IP
Dans LOGO! Soft Comfort:
- IP Address: `192.168.10.100`
- Rack: `0`
- Slot: `1`

## Antivirus et Sécurité

### Windows Defender peut bloquer l'application

**Solution**: Ajouter le dossier à la liste blanche

1. Paramètres → Virus & menaces
2. Paramètres de protection contre les virus
3. Exclusions → Ajouter un dossier
4. Sélectionner le dossier d'installation
5. Confirmer

### Certificat SSL pour HTTPS

Pour production, générer un certificat :
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

## Sauvegarde de la base de données

Sauvegarder régulièrement :
```
C:\ProgramData\SmartSecureAccessIoT\system.db
```

Vers :
```
C:\Users\<UserName>\Documents\SmartSecureAccessIoT_Backups\
```

## Tâche planifiée (Démarrage automatique)

### Créer une tâche planifiée

1. Ouvrir "Task Scheduler"
2. Créer Basic Task
   - Nom: "Smart Secure Access IoT"
   - Déclencheur: "At startup"
   - Action: "Start a program"
   - Programme: `C:\Program Files\Smart Secure Access IoT System\SmartSecureAccessIoT.exe`
3. OK

## Dépannage Windows

### Application ne démarre pas
- Vérifier Windows Defender Firewall
- Vérifier fichier .env existe et est valide
- Vérifier base de données SQLite valide
- Consulter `logs/app.log`

### Erreur "No RTSP stream"
- Vérifier URL RTSP correcte
- Vérifier caméra IP connectée sur réseau
- Tester avec VLC
- Vérifier Firewall permet le trafic RTSP (port 554)

### Erreur "Can't connect to LOGO! PLC"
- Vérifier IP LOGO! correcte dans .env
- Ping depuis Windows vers LOGO!
- Vérifier câble Ethernet
- Vérifier paramètres Snap7 (Rack/Slot)

### Interface utilisateur blanche ou chargement infini
- Vérifier processus Node.js en arrière-plan
- Redémarrer l'application
- Vérifier logs: `C:\ProgramData\SmartSecureAccessIoT\app.log`

## Désinstallation

### Via le panneau de configuration
1. Paramètres → Apps → Apps & features
2. Rechercher "Smart Secure Access IoT System"
3. Cliquer "Uninstall"
4. Suivre les instructions

### Nettoyage manuel
```powershell
# En tant qu'administrateur
Remove-Item -Path "C:\Program Files\Smart Secure Access IoT System" -Recurse
Remove-Item -Path "C:\ProgramData\SmartSecureAccessIoT" -Recurse
```

## Support technique

Consultez `TROUBLESHOOTING.md` pour des solutions détaillées à des problèmes spécifiques.
