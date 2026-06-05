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

// ─── Window refs ─────────────────────────────────────────────
let catWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ─── Services ────────────────────────────────────────────────
let idleDetector: IdleDetector;
let keyboardTracker: KeyboardTracker;
let stretchTimer: StretchTimer;

const isDev = process.env.NODE_ENV === 'development';
const DIST = path.join(app.getAppPath(), 'dist/renderer');

function rendererPath(file: string): string {
  return `file://${path.join(DIST, file)}`;
}

// ─── Cat Window (transparent, always-on-top) ─────────────────
function createCatWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const settings = getSettings();
  const catSize = 64 * settings.size;  // pixel size on screen

  catWindow = new BrowserWindow({
    width: catSize + 120,   // extra room for speech bubble
    height: catSize + 100,
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

  // Click-through the transparent area
  catWindow.setIgnoreMouseEvents(true, { forward: true });

  // Keep on all workspaces (macOS)
  if (process.platform === 'darwin') {
    catWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }

  catWindow.loadURL(rendererPath('cat/index.html'));

  if (isDev) {
    catWindow.webContents.openDevTools({ mode: 'detach' });
  }

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
    height: 640,
    resizable: false,
    title: 'Comnyang Settings',
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
  onboardingWindow = new BrowserWindow({
    width: 480,
    height: 560,
    resizable: false,
    center: true,
    title: 'Welcome to Comnyang!',
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

// ─── IPC Handlers ────────────────────────────────────────────
function setupIPC(): void {
  // Settings CRUD
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    // Push updated settings to cat window
    catWindow?.webContents.send(IPC.CAT_SETTINGS, updated);
    // Restart stretch timer if interval changed
    if (partial.stretchIntervalMin || partial.name) {
      const s = updated;
      if (s.stretchEnabled) {
        stretchTimer.restart(s.stretchIntervalMin, s.name);
      }
    }
    return updated;
  });

  // Stretch actions
  ipcMain.on(IPC.DISMISS_STRETCH, () => {
    catWindow?.webContents.send(IPC.CAT_SPEECH, null);
  });

  ipcMain.on(IPC.SNOOZE_STRETCH, (_event, minutes: number) => {
    stretchTimer.snooze(minutes);
    catWindow?.webContents.send(IPC.CAT_SPEECH, null);
  });

  // Window actions
  ipcMain.on(IPC.OPEN_SETTINGS, () => createSettingsWindow());
  ipcMain.on(IPC.QUIT_APP, () => app.quit());

  // Onboarding done
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

  // Idle detection
  idleDetector = new IdleDetector((isIdle) => {
    catWindow?.webContents.send(IPC.IDLE_CHANGED, isIdle);
    if (!isIdle) {
      // Welcome back
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

  // Keyboard tracking
  keyboardTracker = new KeyboardTracker((isTyping) => {
    catWindow?.webContents.send(IPC.TYPING_CHANGED, isTyping);
  });
  keyboardTracker.start();

  // Stretch timer
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
  // Poll mouse position and move the cat window toward it
  let targetX = 400;
  let targetY = 400;
  let currentX = 400;
  let currentY = 400;

  // Get mouse position via Electron's screen API
  setInterval(() => {
    const pos = screen.getCursorScreenPoint();
    targetX = pos.x;
    targetY = pos.y;
  }, 16); // ~60fps polling

  // Smooth lerp movement
  setInterval(() => {
    if (!catWindow || catWindow.isDestroyed()) return;

    const settings = getSettings();
    const catSize = 64 * settings.size;
    const winW = catSize + 120;
    const winH = catSize + 100;

    // Lerp toward cursor
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    // Offset so cat appears next to cursor, not on top
    const x = Math.round(currentX) - Math.floor(catSize / 2);
    const y = Math.round(currentY) - catSize + 8;

    // Clamp to screen
    const display = screen.getDisplayNearestPoint({ x: Math.round(currentX), y: Math.round(currentY) });
    const { bounds } = display;
    const clampedX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - winW, x));
    const clampedY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - winH, y));

    catWindow.setPosition(clampedX, clampedY, false);
  }, 16);
}

// ─── App lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  // Prevent app from showing in dock (macOS) — lives in tray only
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  setupIPC();
  createCatWindow();

  tray = createTray({
    onOpenSettings: createSettingsWindow,
    onQuit: () => app.quit(),
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

app.on('window-all-closed', () => {
  // Keep running in tray (don't quit when windows close)
});

app.on('before-quit', () => {
  idleDetector?.stop();
  keyboardTracker?.stop();
  stretchTimer?.stop();
});
