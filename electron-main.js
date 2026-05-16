const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let backendProc;
let aiProc;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload', 'preload.js')
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'dist', 'renderer', 'index.html'));
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  try {
    const env = Object.assign({}, process.env);
    // include project root and user site-packages so Python can find installed packages
    env.PYTHONPATH = env.PYTHONPATH ? env.PYTHONPATH + ';' + __dirname : __dirname;
    env.PYTHONPATH += ';C:\\Users\\somatisme\\AppData\\Roaming\\Python\\Python310\\site-packages';
    env.PYTHONPATH += ';C:\\Users\\somatisme\\AppData\\Local\\Programs\\Python\\Python310\\Lib\\site-packages';
    backendProc = spawn('py', ['-3.10', '-m', 'backend.app'], { stdio: 'inherit', env });
  } catch (e) {
    console.error('Failed to start backend via py -3.10, try python', e);
    const env = Object.assign({}, process.env);
    backendProc = spawn('python', ['-m', 'backend.app'], { stdio: 'inherit', env });
  }
}

function startAI() {
  try {
    const env = Object.assign({}, process.env);
    env.PYTHONPATH = env.PYTHONPATH ? env.PYTHONPATH + ';' + __dirname : __dirname;
    env.PYTHONPATH += ';C:\\Users\\somatisme\\AppData\\Roaming\\Python\\Python310\\site-packages';
    env.PYTHONPATH += ';C:\\Users\\somatisme\\AppData\\Local\\Programs\\Python\\Python310\\Lib\\site-packages';
    aiProc = spawn('py', ['-3.10', 'ai\\face_service.py'], { stdio: 'inherit', env });
  } catch (e) {
    console.error('Failed to start ai via py -3.10, try python', e);
    const env = Object.assign({}, process.env);
    aiProc = spawn('python', ['ai/face_service.py'], { stdio: 'inherit', env });
  }
}

app.on('ready', () => {
  // Do not start backend or AI from Electron. Expect backend to be started separately.
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProc) backendProc.kill();
  if (aiProc) aiProc.kill();
});
