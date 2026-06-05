import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
} from 'electron';
import path from 'path';
import { getSettings, saveSettings, isFirstRun, setFirstRunDone } from './store';
import { IdleDetector } from './idle-detector';
import { KeyboardTracker } from './keyboard-tracker';
import { StretchTimer } from './stretch-timer';
import { createTray } from './tray';
import { IPC } from '../shared/types';
import { GREETING_MESSAGES, IDLE_MESSAGES } from '../shared/constants';

// ─── Single instance lock ─────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ─── Window refs ─────────────────────────────────────────────
let catWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ─── Services ────────────────────────────────────────────────
let idleDetector: IdleDetector;
let keyboardTracker: KeyboardTracker;
let stretchTimer: StretchTimer;

const DIST = path.join(app.getAppPath(), 'dist/renderer');

function rendererPath(file: string): string {
  return `file://${path.join(DIST, file)}`;
}

// ─── Cat Window (transparent, always-on-top) ─────────────────
function createCatWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const settings = getSettings();
  const catSize = 64 * settings.size;

  catWindow = new BrowserWindow({
    width: catSize + 200,
    height: catSize + 160,
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    roundedCorners: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  catWindow.setIgnoreMouseEvents(true, { forward: true });

  if (process.platform === 'darwin') {
    catWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }

  catWindow.loadURL(rendererPath('cat/index.html'));
  catWindow.on('closed', () => { catWindow = null; });
}

// ─── Settings Window ─────────────────────────────────────────
function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 520,
    height: 660,
    resizable: false,
    title: 'NekoDrift Settings',
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadURL(rendererPath('settings/index.html'));
  settingsWindow.once('ready-to-show', () => settingsWindow?.show());
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// ─── Onboarding Window ───────────────────────────────────────
function createOnboardingWindow(): void {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 480,
    height: 580,
    resizable: false,
    center: true,
    title: 'Welcome to NekoDrift!',
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  onboardingWindow.loadURL(rendererPath('onboarding/index.html'));
  onboardingWindow.once('ready-to-show', () => onboardingWindow?.show());
  onboardingWindow.on('closed', () => { onboardingWindow = null; });
}

// ─── Quit helper ─────────────────────────────────────────────
function quitApp(): void {
  // Stop services first
  try { idleDetector?.stop(); } catch (_) {}
  try { keyboardTracker?.stop(); } catch (_) {}
  try { stretchTimer?.stop(); } catch (_) {}

  // Destroy all windows explicitly
  try { catWindow?.destroy(); catWindow = null; } catch (_) {}
  try { settingsWindow?.destroy(); settingsWindow = null; } catch (_) {}
  try { onboardingWindow?.destroy(); onboardingWindow = null; } catch (_) {}

  // Remove tray
  try { tray?.destroy(); tray = null; } catch (_) {}

  app.exit(0);
}

// ─── IPC Handlers ────────────────────────────────────────────
function setupIPC(): void {
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    catWindow?.webContents.send(IPC.CAT_SETTINGS, updated);
    if (partial.stretchIntervalMin || partial.name) {
      if (updated.stretchEnabled) {
        stretchTimer?.restart(updated.stretchIntervalMin, updated.name);
      }
    }
    return updated;
  });

  ipcMain.on(IPC.DISMISS_STRETCH, () => {
    catWindow?.webContents.send(IPC.CAT_SPEECH, null);
  });

  ipcMain.on(IPC.SNOOZE_STRETCH, (_event, minutes: number) => {
    stretchTimer?.snooze(minutes);
    catWindow?.webContents.send(IPC.CAT_SPEECH, null);
  });

  ipcMain.on(IPC.OPEN_SETTINGS, () => createSettingsWindow());
  ipcMain.on(IPC.QUIT_APP, () => quitApp());

  ipcMain.on(IPC.ONBOARDING_DONE, (_event, settings) => {
    saveSettings(settings);
    setFirstRunDone();
    onboardingWindow?.close();
    startServices();
  });
}

// ─── Services Start ──────────────────────────────────────────
function startServices(): void {
  const settings = getSettings();

  idleDetector = new IdleDetector((isIdle) => {
    catWindow?.webContents.send(IPC.IDLE_CHANGED, isIdle);
    if (!isIdle) {
      const msg = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setTimeout(() => {
        catWindow?.webContents.send(IPC.CAT_SPEECH, msg(settings.name));
      }, 500);
    } else {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      catWindow?.webContents.send(IPC.CAT_SPEECH, msg);
    }
  });
  idleDetector.start();

  keyboardTracker = new KeyboardTracker((isTyping) => {
    catWindow?.webContents.send(IPC.TYPING_CHANGED, isTyping);
  });
  keyboardTracker.start();

  if (settings.stretchEnabled) {
    stretchTimer = new StretchTimer(
      (msg) => {
        catWindow?.webContents.send(IPC.STRETCH_REMINDER, msg);
        catWindow?.webContents.send(IPC.CAT_SPEECH, msg);
      },
      settings.stretchIntervalMin,
      settings.name
    );
    stretchTimer.start();
  }
}

// ─── Mouse tracking for cat following ────────────────────────
function startMouseTracking(): void {
  let targetX = 400;
  let targetY = 400;
  let currentX = 400;
  let currentY = 400;

  setInterval(() => {
    const pos = screen.getCursorScreenPoint();
    targetX = pos.x;
    targetY = pos.y;
  }, 16);

  setInterval(() => {
    if (!catWindow || catWindow.isDestroyed()) return;

    const settings = getSettings();
    const catSize = 64 * settings.size;
    const winW = catSize + 200;
    const winH = catSize + 160;

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    const x = Math.round(currentX) - Math.floor(catSize / 2);
    const y = Math.round(currentY) - catSize + 8;

    const display = screen.getDisplayNearestPoint({ x: Math.round(currentX), y: Math.round(currentY) });
    const { bounds } = display;
    const clampedX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - winW, x));
    const clampedY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - winH, y));

    catWindow.setPosition(clampedX, clampedY, false);
  }, 16);
}

// ─── Second instance → focus existing ────────────────────────
app.on('second-instance', () => {
  if (catWindow && !catWindow.isDestroyed()) {
    catWindow.show();
  }
});

// ─── App lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  setupIPC();
  createCatWindow();

  tray = createTray({
    onOpenSettings: createSettingsWindow,
    onQuit: quitApp,
    onToggleCat: () => {
      if (catWindow?.isVisible()) catWindow.hide();
      else catWindow?.show();
    },
  });

  startMouseTracking();

  if (isFirstRun()) {
    createOnboardingWindow();
  } else {
    startServices();
  }
});

// Keep running in tray when all windows close
app.on('window-all-closed', () => {});
