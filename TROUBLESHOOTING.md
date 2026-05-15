# Dépannage (Troubleshooting)

## Problèmes courants et solutions

### 1. RTSP Stream not available

**Symptôme**: 
```
Error: Unable to open RTSP stream
```

**Solutions**:
- Vérifier URL RTSP correcte dans `.env`
- Tester le flux avec FFplay:
  ```bash
  ffplay rtsp://user:pass@192.168.10.50:554/stream
  ```
- Vérifier caméra connectée au réseau
- Vérifier firewall permet port 554
- Vérifier credentials (user/pass)
- Tester avec VLC Media Player

**Configuration RTSP par marque**:
```
Hikvision:  rtsp://admin:password@192.168.10.50:554/h264/ch1
Dahua:      rtsp://admin:password@192.168.10.50:554/stream
Axis:       rtsp://admin:password@192.168.10.50:554/axis-media/media.amp
Reolink:    rtsp://admin:password@192.168.10.50:554/h264Preview_01_main
TP-Link:    rtsp://admin:password@192.168.10.50:554/stream0
```

---

### 2. Unable to connect to LOGO! PLC

**Symptôme**:
```
Error: [Address] Connection failed
```

**Solutions**:
- Vérifier IP LOGO! dans `.env`
  ```env
  LOGO_HOST=192.168.10.100
  ```
- Tester ping:
  ```bash
  ping 192.168.10.100
  ```
- Vérifier LOGO! en IP mode (pas RS-232)
- Vérifier câble Ethernet
- Tester avec TIA Portal / LOGO! Soft Comfort
- Vérifier Rack/Slot corrects:
  ```env
  LOGO_RACK=0
  LOGO_SLOT=1
  ```
- Sur LOGO! V8: Réinitialiser et reconfigurer IP
- Vérifier firewall: autoriser port 102 (Snap7)

**Debug Snap7**:
```python
import snap7

plc = snap7.client.Client()
try:
    plc.connect('192.168.10.100', 0, 1)
    print("Connected!")
except Exception as e:
    print(f"Error: {e}")
```

---

### 3. Application crashes at startup

**Symptôme**:
```
Application has crashed
```

**Solutions**:
- Vérifier fichier `.env` existe et est valide
- Vérifier syntaxe JSON `.env`
- Vérifier base de données SQLite valide
- Consulter logs:
  ```bash
  tail -f logs/app.log
  ```
- Vérifier répertoires existent:
  ```bash
  mkdir -p database logs ai/snapshots
  ```
- Redémarrer Node.js completement:
  ```bash
  killall node
  npm run dev
  ```

---

### 4. Face recognition not working

**Symptôme**:
```
DeepFace detection error / No faces detected
```

**Solutions**:
- Vérifier OpenCV installé:
  ```bash
  python3 -c "import cv2; print(cv2.__version__)"
  ```
- Vérifier face_recognition installé:
  ```bash
  python3 -c "import face_recognition; print('OK')"
  ```
- Vérifier DeepFace installé:
  ```bash
  python3 -c "from deepface import DeepFace; print('OK')"
  ```
- Installer dépendances manquantes:
  ```bash
  pip install --upgrade opencv-python face_recognition deepface
  ```
- Vérifier éclairage de la caméra
- Vérifier résolution caméra >= 320x240
- Tester avec image locale:
  ```bash
  python3 ai/face_service.py --run-once
  ```

---

### 5. npm install fails with native modules

**Symptôme**:
```
npm ERR! code 1
npm ERR! path better-sqlite3
npm ERR! command failed
```

**Solutions**:
- Utiliser flag --legacy-peer-deps:
  ```bash
  npm install --legacy-peer-deps
  ```
- Nettoyer cache npm:
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install --legacy-peer-deps
  ```
- Sur Kali Linux, installer build-tools:
  ```bash
  sudo apt install build-essential python3-dev
  ```

**Alternative**: Le projet utilise `sqlite` pas `better-sqlite3` pour compatibilité accrue.

---

### 6. Dashboard blank or infinite loading

**Symptôme**:
- Interface blanche
- Spinner de chargement infiniti
- Pas de contenu affiché

**Solutions**:
- Vérifier processus Node en arrière-plan:
  ```bash
  ps aux | grep node
  ```
- Tuer tous les processus Node:
  ```bash
  killall -9 node
  ```
- Redémarrer complètement:
  ```bash
  npm run dev
  ```
- Vérifier Vite build réussi:
  ```bash
  npm run build:renderer
  ```
- Vérifier les logs:
  ```bash
  tail -f logs/app.log
  ```
- Sur Windows, ouvrir DevTools (F12) et vérifier console pour erreurs

---

### 7. IPC errors (secureAPI not found)

**Symptôme**:
```
TypeError: window.secureAPI is undefined
```

**Solutions**:
- Vérifier preload.js chargé correctement dans main.ts
- Vérifier chemin preload correct:
  ```typescript
  preload: path.join(__dirname, '../preload/preload.js')
  ```
- Vérifier build preload:
  ```bash
  npm run build:main
  ```
- Effacer build et reconstruire:
  ```bash
  rm -rf dist/
  npm run build
  ```

---

### 8. Port 554 (RTSP) already in use

**Symptôme**:
```
Error: EADDRINUSE: address already in use :::554
```

**Solutions Linux**:
```bash
# Trouver processus utilisant le port
lsof -i :554

# Killer le processus
kill -9 <PID>
```

**Solutions Windows**:
```powershell
# Trouver processus utilisant le port
netstat -ano | findstr :554

# Killer le processus
taskkill /PID <PID> /F
```

---

### 9. Permissions denied (logs/database)

**Symptôme**:
```
Error: EACCES: permission denied, open 'logs/app.log'
```

**Solutions**:
```bash
# Vérifier permissions
ls -la logs/ database/

# Fixer permissions
chmod -R 755 logs/ database/

# Ou exécuter avec sudo
sudo npm run dev
```

---

### 10. Vite build hangs or times out

**Symptôme**:
```
Vite build stays at 0% or times out
```

**Solutions**:
- Augmenter timeout (dans package.json):
  ```json
  "build:renderer": "vite build --config renderer/vite.config.ts --logLevel=debug"
  ```
- Vérifier espace disque:
  ```bash
  df -h
  ```
- Vérifier pas d'autres build en cours:
  ```bash
  ps aux | grep vite
  ```
- Nettoyer cache Vite:
  ```bash
  rm -rf renderer/.vite
  npm run build:renderer
  ```

---

## Performance et optimization

### Améliorer vitesse reconnaissance faciale

```python
# Dans ai/face_service.py
# Réduire fréquence de traitement
if frame_count % 10 != 0:  # Traiter 1 frame sur 10
    continue

# Réduire résolution
frame = cv2.resize(frame, (640, 480))

# Augmenter tolerance (moins strict)
matches = face_recognition.compare_faces([known_encoding], encoding, tolerance=0.6)
```

### Réduire consommation CPU

```typescript
// Dans main/main.ts
// Réduire fréquence update dashboard
const UPDATE_INTERVAL = 5000; // 5 secondes au lieu de 1

setInterval(() => {
  mainWindow?.webContents.send('stats-update', getStats());
}, UPDATE_INTERVAL);
```

### Réduire taille SQLite

```bash
# Vacuum database
sqlite3 database/system.db "VACUUM;"

# Archiver anciens logs (>90 jours)
find logs/ -mtime +90 -exec gzip {} \;
```

---

## Logs pour debugging

### Activer logs détaillés

```typescript
// logs/logger.ts
level: process.env.DEBUG ? 'debug' : 'info'
```

```bash
DEBUG=1 npm run dev
```

### Analyser logs

```bash
# Voir dernier 100 lignes
tail -n 100 logs/app.log

# Filtrer par type d'erreur
grep "ERROR" logs/app.log

# Voir en temps réel
tail -f logs/app.log

# Compter occurrences
grep "FACE_AUTHORIZED" logs/app.log | wc -l
```

---

## Support additionnels

### Obtenir informations système

```bash
# Infos Node
node --version
npm --version

# Infos Python
python3 --version
pip list | grep -E "opencv|deepface|face-recognition"

# Infos système
uname -a
lsb_release -a

# Infos GPU (si applicable)
nvidia-smi
```

### Activer verbose mode

```bash
# Electron
npm run dev -- --verbose

# Python face service
PYTHONUNBUFFERED=1 python3 ai/face_service.py --run-once 2>&1 | tee debug.log
```

### Tester composants individuels

```bash
# Test RTSP seul
ffprobe -v error -show_format -show_streams rtsp://...

# Test Snap7 seul
python3 -c "import snap7; print('OK')" 

# Test SQLite seul
sqlite3 database/system.db ".tables"

# Test Electron preload
npm run build:main && npm run start:electron
```

---

## Réinitialisation complète

Si tout échoue, réinitialiser l'installation:

```bash
# Nettoyer complètement
rm -rf node_modules dist/ logs/ database/system.db

# Réinstaller
npm install --legacy-peer-deps

# Reconfigurer
cp .env.example .env
nano .env

# Relancer
npm run dev
```

---

**Dernière mise à jour**: 13 mai 2026
