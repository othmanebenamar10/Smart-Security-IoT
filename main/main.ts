import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase, logAccessEvent, logIntrusionEvent } from '../database/sqliteManager';
import { createLogger } from '../logs/logger';
import { launchFaceService } from './faceService';
import { LogoController } from './plcService';
import { validateIPCRequest } from '../security/validate';

dotenv.config();

const logger = createLogger();
let mainWindow: BrowserWindow | null = null;
let logoController: LogoController | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 780,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../installer/icon.png')
  });

  const indexPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../renderer/index.html')
    : path.join(__dirname, '../../renderer/dist/index.html');

  mainWindow.loadFile(indexPath);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', () => {
    logger.error('Renderer process crashed');
    dialog.showErrorBox('Erreur', 'L\'interface utilisateur a planté. Redémarrage...');
    createMainWindow();
  });
}

async function setupApplication() {
  try {
    logger.info('Initializing database...');
    initDatabase();

    logger.info('Initializing PLC controller...');
    logoController = new LogoController();

    logger.info('Launching face recognition service...');
    launchFaceService({
      onAuthorized: async (event) => {
        logger.info('Face recognized', { user: event.user, timestamp: event.timestamp });
        try {
          await logAccessEvent({ ...event, status: 'authorized' });
          if (logoController) {
            await logoController.activateLight(30);
          }
          mainWindow?.webContents.send('face-event', event);
        } catch (error) {
          logger.error('Failed to process authorized face', { error });
        }
      },
      onUnauthorized: async (event) => {
        logger.warn('Unauthorized face detected', { reason: event.reason || 'Unknown' });
        try {
          await logIntrusionEvent(event);
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
      'Erreur au démarrage',
      'Impossible de démarrer le système. Consultez les logs pour plus de détails.'
    );
  }
}

app.on('ready', async () => {
  createMainWindow();
  await setupApplication();
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

// IPC Handlers
ipcMain.handle('secure:ping', async () => {
  return { ok: true, timestamp: new Date().toISOString() };
});

ipcMain.handle('secure:fetch-state', async (_, payload) => {
  try {
    validateIPCRequest(payload);
    const state = {
      system: 'Smart Secure Access IoT System',
      version: '0.1.0',
      env: process.env.APP_ENV || 'production',
      timestamp: new Date().toISOString(),
      plcConnected: logoController !== null
    };
    return state;
  } catch (error) {
    logger.error('Failed to fetch state', { error });
    throw new Error('Invalid request');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  app.quit();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  app.quit();
});
