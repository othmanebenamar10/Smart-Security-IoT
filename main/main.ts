import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import {
  closeDatabase,
  initDatabase,
  logAccessEvent,
  logIntrusionEvent
} from '../database/sqliteManager';
import { createLogger } from '../logs/logger';
import { launchFaceService, stopFaceService } from './faceService';
import { HomeAccessRelay } from './relayService';
import { validateIPCRequest } from '../security/validate';

dotenv.config();

const logger = createLogger();
let mainWindow: BrowserWindow | null = null;
let accessRelay: HomeAccessRelay | null = null;
const appDataPath = path.join(process.cwd(), '.electron-runtime');
const startupTime = Date.now();

// Variables pour surveiller les performances
let performanceMonitor: NodeJS.Timeout | null = null;

app.commandLine.appendSwitch('use-angle', 'swiftshader');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-features', 'IsolateOrigins,site-per-process');
app.disableHardwareAcceleration();
app.setPath('userData', appDataPath);
app.setPath('sessionData', path.join(appDataPath, 'session'));
app.setPath('cache', path.join(appDataPath, 'cache'));

// Configurer l'auto-lancement au démarrage Windows
if (process.platform === 'win32') {
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
      path: app.getPath('exe')
    });
    logger.info('Auto-launch at startup enabled');
  } catch (error) {
    logger.warn('Failed to set auto-launch', { error });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 780,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../installer/icon.png')
  });

  void mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
      logger.warn('Blocked unexpected navigation', { url });
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error('Renderer process crashed', { reason: details.reason, exitCode: details.exitCode });
    dialog.showErrorBox('Erreur', 'L interface utilisateur a plante. Redemarrage...');
    createMainWindow();
  });

  mainWindow.webContents.on('unresponsive', () => {
    logger.warn('Renderer process became unresponsive');
  });
}

async function setupApplication(): Promise<void> {
  try {
    logger.info('Initializing database...');
    initDatabase();

    logger.info('Initializing home access relay...');
    accessRelay = new HomeAccessRelay();

    logger.info('Launching face recognition service...');
    launchFaceService({
      onAuthorized: async (event) => {
        try {
          logger.info('Face recognized', { user: event.user, timestamp: event.timestamp });
          await logAccessEvent({ ...event, status: 'authorized' });

          if (accessRelay) {
            await accessRelay.activateLight(30);
          }

          mainWindow?.webContents.send('face-event', event);
        } catch (error) {
          logger.error('Failed to process authorized face', { error });
        }
      },
      onUnauthorized: async (event) => {
        try {
          logger.warn('Unauthorized face detected', { reason: event.reason || 'Unknown' });
          await logIntrusionEvent({
            timestamp: event.timestamp,
            image: event.snapshotPath,
            reason: event.reason || 'Unknown'
          });
          mainWindow?.webContents.send('face-event', { ...event, status: 'unauthorized' });
        } catch (error) {
          logger.error('Failed to log unauthorized event', { error });
        }
      }
    });

    logger.info('Application setup complete');
  } catch (error) {
    logger.error('Failed to set up application', { error });
    dialog.showErrorBox(
      'Erreur au demarrage',
      'Impossible de demarrer le systeme. Consultez les logs pour plus de details.'
    );
    app.quit();
  }
}

app.on('ready', async () => {
  createMainWindow();
  await setupApplication();
  
  if (!performanceMonitor) {
    performanceMonitor = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
        mainWindow.webContents.send('system:stats', {
          memoryUsage: Math.min(memoryUsage, 100),
          timestamp: new Date().toISOString()
        });
      }
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});

app.on('second-instance', () => {
  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.focus();
});

app.on('before-quit', () => {
  if (performanceMonitor) {
    clearInterval(performanceMonitor);
    performanceMonitor = null;
  }
  stopFaceService();
  closeDatabase();
});

ipcMain.handle('secure:ping', async () => {
  return { ok: true, timestamp: new Date().toISOString() };
});

ipcMain.handle('secure:fetch-state', async (_, payload) => {
  try {
    validateIPCRequest(payload);

    const uptime = Date.now() - startupTime;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    
    const cpus = os.cpus();
    let idleTime = 0, totalTime = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTime += cpu.times[type as keyof typeof cpu.times];
      }
      idleTime += cpu.times.idle;
    });
    const cpuUsage = 100 - ~~((100 * idleTime) / totalTime) || 0;

    return {
      system: 'Home Secure Access',
      version: '0.1.0',
      env: process.env.APP_ENV || 'production',
      timestamp: new Date().toISOString(),
      platform: os.platform(),
      relayConnected: accessRelay !== null,
      uptime: uptime,
      cpuUsage: Math.min(cpuUsage, 100),
      memoryUsage: Math.min(memoryUsage, 100)
    };
  } catch (error) {
    logger.error('Failed to fetch state', { error });
    throw new Error('Invalid request');
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  app.quit();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  app.quit();
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  dialog.showErrorBox('Erreur Critique', 'Une erreur critique s\'est produite. L\'application va redémarrer.');
  setTimeout(() => {
    app.quit();
    app.relaunch();
  }, 2000);
});
