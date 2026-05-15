# Installer et packaging

Ce dossier contient des ressources pour l’installation Windows et Linux.

## Windows

- `electron-builder` est configuré dans `package.json`.
- Le package cible est NSIS via la commande :
  ```bash
  npm run package:windows
  ```

## Linux

- Le package cible est DEB via la commande :
  ```bash
  npm run package:linux
  ```

## Notes

- Copier `.env.example` vers `.env` avant le build.
- Ne pas inclure de secrets dans le code source.
