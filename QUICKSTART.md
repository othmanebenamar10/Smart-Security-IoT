# 🚀 Guide de démarrage rapide

Checklist de déploiement complet et guide de reference.

## ✅ Checklist pré-déploiement

### Configuration de base
- [ ] `.env` créé et rempli avec valeurs correctes
- [ ] Pas de `.env` commité en git (dans `.gitignore`)
- [ ] Admin password hash généré (SHA-256)
- [ ] AES secret généré (32 hex bytes)

### Réseau et matériel
- [ ] Caméra RTSP connectée et testée (ffplay)
- [ ] Siemens LOGO! V8 ping-able et adresse IP correcte
- [ ] Firewall configuré (ports 554 RTSP, 102 Snap7)
- [ ] Réseau IoT isolé du réseau corporatif

### Dépendances
- [ ] Node.js 18+ installé (`npm --version`)
- [ ] Python 3.10+ installé (`python3 --version`)
- [ ] Dépendances npm installées (`npm install --legacy-peer-deps`)
- [ ] Dépendances Python IA installées (`pip list | grep opencv`)
- [ ] Dépendances Python PLC installées (`pip list | grep snap7`)

### Base de données
- [ ] Base SQLite initialisée (`sqlite3 database/system.db ".tables"`)
- [ ] Tables créées (users, access_logs, intrusion_logs)
- [ ] Fichier utilisateurs JSON rempli (`ai/authorized_users.json`)

### Sécurité
- [ ] CSP configurée dans `renderer/index.html`
- [ ] Context isolation activée dans main.ts
- [ ] IPC whitelist vérifiée (preload.ts)
- [ ] Aucun secret en dur dans le code source
- [ ] npm audit passé (`npm audit`)

### Tests
- [ ] Tests IPC réussis (`npm run test:main`)
- [ ] Service IA testé (`python3 ai/face_service.py --run-once`)
- [ ] PLC testé (`python3 plc/logo_controller.py --status`)
- [ ] Logs générés sans erreur critique

### Builds
- [ ] Build renderer réussi (`npm run build:renderer`)
- [ ] Build main réussi (`npm run build:main`)
- [ ] Pas de warnings/erreurs TypeScript

---

## 🎯 Commandes essentielles

### Développement
```bash
npm run dev              # Mode développement avec hot reload
npm run build            # Build production complet
npm run test             # Lancer tous les tests
npm run lint             # Vérifier style code
```

### Production Windows
```bash
npm run package:windows  # Génère SmartSecureAccessIoTInstaller.exe
```

### Production Linux
```bash
npm run package:linux    # Génère SmartSecureAccessIoT.AppImage
```

### Debugging
```bash
tail -f logs/app.log              # Voir logs en temps réel
npm run start:electron -- --verbose  # Mode verbose
DEBUG=1 npm run dev               # Logs détaillés
```

---

## 📚 Structure des fichiers critiques

```
main/
├── main.ts              ← Point d'entrée Electron
├── faceService.ts       ← Interface service IA Python
└── plcService.ts        ← Interface PLC Siemens

renderer/src/
├── main.tsx             ← Point d'entrée React
├── App.tsx              ← App component
└── components/
    └── Dashboard.tsx    ← Dashboard principal

ai/
├── face_service.py      ← Service reconnaissance faciale
├── requirements.txt     ← Dépendances Python
└── authorized_users.json ← Base utilisateurs

plc/
├── logo_controller.py   ← Contrôleur Siemens
└── requirements.txt     ← Dépendances Python

database/
└── sqliteManager.ts     ← Gestionnaire SQLite

security/
├── aes.ts              ← Chiffrement AES-256-GCM
├── auth.ts             ← Authentification admin
└── validate.ts         ← Validation IPC
```

---

## 🔐 Vérifications de sécurité avant production

### Secrets et credentials
```bash
# Vérifier aucun secret en dur
grep -r "password" . --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "secret" . --include="*.ts" --include="*.tsx" --include="*.js"

# Vérifier .env n'est pas commité
git status | grep .env

# Vérifier fichiers sensibles ignorés
cat .gitignore | grep "env\|\.key\|\.pem"
```

### Audit sécurité npm
```bash
npm audit
npm audit fix
npm audit fix --audit-level=moderate
```

### Audit sécurité Python
```bash
pip-audit
pip-audit --fix
```

### Vérifier permissions
```bash
ls -la database/
ls -la logs/
chmod 600 database/system.db  # Seulement le propriétaire peut lire
chmod 600 ai/authorized_users.json
```

---

## 🐛 Debugging rapide

### Application ne démarre pas
```bash
# 1. Vérifier .env
cat .env

# 2. Vérifier base de données
sqlite3 database/system.db ".tables"

# 3. Voir les logs
tail -f logs/app.log

# 4. Relancer avec verbose
npm run dev -- --verbose
```

### Caméra RTSP non accessible
```bash
# Tester streaming
ffplay rtsp://user:pass@192.168.10.50:554/stream

# Tester connectivité
ping 192.168.10.50
telnet 192.168.10.50 554
```

### PLC non accessible
```bash
# Tester ping
ping 192.168.10.100

# Tester Snap7
python3 -c "import snap7; plc = snap7.client.Client(); plc.connect('192.168.10.100', 0, 1)"

# Vérifier paramètres
echo $LOGO_HOST $LOGO_RACK $LOGO_SLOT
```

---

## 📊 Métriques de performance

### CPU/Mémoire
- Processus Electron: ~150-200 MB
- Service IA Python: ~300-500 MB
- SQLite: <10 MB
- **Total estimé**: ~500 MB minimum

### Latence
- Détection visage: 200-500ms (selon CPU)
- Communication PLC: <100ms
- Mise à jour UI: <16ms (60 FPS)

### Stockage
- Exécutable Windows: ~150 MB
- Base de données par jour (1000 événements): ~500 KB
- Snapshots par jour (100): ~50 MB
- Logs par jour: ~5 MB

---

## 🔄 Processus de mise à jour

### Mettre à jour dépendances npm
```bash
npm outdated               # Voir versions disponibles
npm update                 # Mettre à jour
npm audit fix              # Fixer vulnérabilités
npm run build              # Recompiler
```

### Mettre à jour dépendances Python
```bash
pip list --outdated                          # Voir versions disponibles
pip install --upgrade package_name           # Mettre à jour
pip-audit --fix                              # Fixer vulnérabilités
python3 ai/face_service.py --run-once       # Tester service IA
```

### Après mise à jour
```bash
npm run test               # Lancer tous les tests
npm run build              # Recompiler
# Vérifier logs pour erreurs
```

---

## 📞 Contacts d'aide

| Ressource | Lien |
|-----------|------|
| Documentation | [README.md](./README.md) |
| Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Sécurité | [SECURITY.md](./SECURITY.md) |
| Installation Kali | [INSTALLATION_KALI.md](./INSTALLATION_KALI.md) |
| Installation Windows | [INSTALLATION_WINDOWS.md](./INSTALLATION_WINDOWS.md) |
| Dépannage | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| API | [API.md](./API.md) |
| Logs | `logs/app.log` |

---

## 📋 Checklist quotidienne

- [ ] Vérifier logs pour erreurs critiques
- [ ] Vérifier base de données pour intégrité
- [ ] Sauvegarder logs et base de données
- [ ] Vérifier uptime système (journalctl)
- [ ] Vérifier espace disque disponible

---

## 🎓 Ressources d'apprentissage

### Concepts généraux
- Electron: https://www.electronjs.org/docs
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/

### Vision et IA
- OpenCV: https://docs.opencv.org/
- DeepFace: https://github.com/serengp/deepface
- face_recognition: https://github.com/ageitgey/face_recognition

### Industrie
- Siemens Snap7: http://snap7.sourceforge.net/
- OWASP: https://owasp.org/
- NIST Cybersecurity: https://www.nist.gov/

---

## 🎯 Prochaines étapes

1. **Court terme** (première semaine)
   - [ ] Configuration complète en dev
   - [ ] Tests initiaux
   - [ ] Build première version

2. **Moyen terme** (premier mois)
   - [ ] Tests de sécurité pénétration
   - [ ] Optimisation performance
   - [ ] Documentation finale

3. **Long terme** (maintenance)
   - [ ] Monitoring continu
   - [ ] Mise à jour dépendances mensuelles
   - [ ] Archivage logs

---

**Version**: 0.1.0 | **Dernière mise à jour**: 13 mai 2026

*Smart Secure Access IoT System - Professionnel. Sécurisé. Fiable.*
