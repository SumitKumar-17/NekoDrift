import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  dialog,
  shell,
  systemPreferences,
} from 'electron';
import path from 'path';
import { getSettings, saveSettings, isFirstRun, setFirstRunDone } from './store';
import { IdleDetector } from './idle-detector';
import { KeyboardTracker } from './keyboard-tracker';
import { StretchTimer } from './stretch-timer';
import { PomodoroTimer } from './pomodoro-timer';
import { MessageReminder } from './message-reminder';
import { NekoDriftHttpServer } from './http-server';
import { createTray } from './tray';
import { IPC } from '../shared/types';
import { GREETING_MESSAGES, IDLE_MESSAGES, AI_DONE_MESSAGES } from '../shared/constants';

// ─── Single instance lock ──────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ─── Window refs ───────────────────────────────────────────────
let catWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ─── Services ──────────────────────────────────────────────────
let idleDetector: IdleDetector;
let keyboardTracker: KeyboardTracker;
let stretchTimer: StretchTimer;
let pomodoroTimer: PomodoroTimer | null = null;
let messageReminder: MessageReminder | null = null;
let httpServer: NekoDriftHttpServer | null = null;

const DIST = path.join(app.getAppPath(), 'dist/renderer');

function rendererPath(file: string): string {
  return `file://${path.join(DIST, file)}`;
}

// ─── Platform helpers ──────────────────────────────────────────
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

// ─── Cat Window ────────────────────────────────────────────────
function createCatWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const settings = getSettings();
  const catSize = 64 * settings.size;
  const winW = catSize + 200;
  const winH = catSize + 200;

  catWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    // roundedCorners only applies on macOS
    ...(isMac ? { roundedCorners: false } : {}),
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Click-through: forward events to windows below
  catWindow.setIgnoreMouseEvents(true, { forward: true });

  // Show on all virtual desktops/workspaces
  if (isMac) {
    catWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  } else if (isLinux) {
    catWindow.setVisibleOnAllWorkspaces(true);
  }

  catWindow.loadURL(rendererPath('cat/index.html'));
  catWindow.on('closed', () => { catWindow = null; });
}

// ─── Settings Window ───────────────────────────────────────────
function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 580,
    height: 800,
    minWidth: 480,
    resizable: true,
    title: 'NekoDrift Settings',
    show: false,
    ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
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

// ─── Onboarding Window ─────────────────────────────────────────
function createOnboardingWindow(): void {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 480,
    height: 600,
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

// ─── Quit ──────────────────────────────────────────────────────
function quitApp(): void {
  try { idleDetector?.stop(); } catch (_) {}
  try { keyboardTracker?.stop(); } catch (_) {}
  try { stretchTimer?.stop(); } catch (_) {}
  try { pomodoroTimer?.stop(); } catch (_) {}
  try { messageReminder?.stop(); } catch (_) {}
  try { httpServer?.stop(); } catch (_) {}
  try { catWindow?.destroy(); catWindow = null; } catch (_) {}
  try { settingsWindow?.destroy(); settingsWindow = null; } catch (_) {}
  try { onboardingWindow?.destroy(); onboardingWindow = null; } catch (_) {}
  try { tray?.destroy(); tray = null; } catch (_) {}
  app.exit(0);
}

// ─── macOS Accessibility permission ────────────────────────────
function checkAccessibilityPermission(): void {
  if (!isMac) return;
  try {
    const trusted = (systemPreferences as any).isTrustedAccessibilityClient?.(false);
    if (trusted === false) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Accessibility Permission',
        message: 'NekoDrift needs Accessibility access to detect typing.',
        detail: 'Enable it in System Settings → Privacy & Security → Accessibility, then restart NekoDrift.',
        buttons: ['Open Settings', 'Skip'],
        defaultId: 0,
      }).then(({ response }) => {
        if (response === 0) {
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
        }
      });
    }
  } catch (_) {}
}

// ─── Login at startup ──────────────────────────────────────────
function applyLoginItem(enabled: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
      ...(isMac ? { name: 'NekoDrift' } : {}),
    });
  } catch (_) {}
}

// ─── IPC Handlers ─────────────────────────────────────────────
function setupIPC(): void {
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    catWindow?.webContents.send(IPC.CAT_SETTINGS, updated);

    if (partial.stretchIntervalMin !== undefined || partial.stretchEnabled !== undefined) {
      stretchTimer?.stop();
      if (updated.stretchEnabled) {
        stretchTimer = new StretchTimer(
          (msg) => {
            catWindow?.webContents.send(IPC.STRETCH_REMINDER, msg);
            catWindow?.webContents.send(IPC.CAT_SPEECH, msg);
          },
          updated.stretchIntervalMin,
          updated.name
        );
        stretchTimer.start();
      }
    }

    if (partial.pomodoroEnabled !== undefined || partial.pomodoroFocusMin !== undefined || partial.pomodoroBreakMin !== undefined) {
      pomodoroTimer?.stop();
      pomodoroTimer = null;
      if (updated.pomodoroEnabled) {
        pomodoroTimer = new PomodoroTimer(updated.pomodoroFocusMin, updated.pomodoroBreakMin, (state) => {
          catWindow?.webContents.send(IPC.POMODORO_STATE, state);
        });
      }
    }

    if (partial.reminderEnabled !== undefined || partial.reminderHour !== undefined
      || partial.reminderMinute !== undefined || partial.reminderMessage !== undefined) {
      messageReminder?.stop();
      messageReminder = null;
      if (updated.reminderEnabled) {
        messageReminder = new MessageReminder(
          updated.reminderHour, updated.reminderMinute, updated.reminderMessage,
          (msg) => catWindow?.webContents.send(IPC.REMINDER_TRIGGER, msg)
        );
        messageReminder.start();
      }
    }

    if (partial.alwaysOnTop !== undefined && catWindow && !catWindow.isDestroyed()) {
      catWindow.setAlwaysOnTop(updated.alwaysOnTop);
    }

    if (partial.startOnLogin !== undefined) {
      applyLoginItem(updated.startOnLogin);
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

  // Per-pixel hit test → toggle ignoreMouseEvents
  ipcMain.on(IPC.SET_IGNORE_MOUSE, (_event, ignore: boolean) => {
    if (catWindow && !catWindow.isDestroyed()) {
      catWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  // Mochi drag
  ipcMain.on(IPC.DRAG_CAT, (_event, dx: number, dy: number) => {
    if (!catWindow || catWindow.isDestroyed()) return;
    const [x, y] = catWindow.getPosition();
    const newX = x + Math.round(dx);
    const newY = y + Math.round(dy);
    const display = screen.getDisplayNearestPoint({ x: newX, y: newY });
    const { bounds } = display;
    const [w, h] = catWindow.getSize();
    const cx = Math.max(bounds.x, Math.min(bounds.x + bounds.width - w, newX));
    const cy = Math.max(bounds.y, Math.min(bounds.y + bounds.height - h, newY));
    catWindow.setPosition(cx, cy, false);
  });

  // Pomodoro control
  ipcMain.on(IPC.POMODORO_CONTROL, (_event, action: 'start' | 'pause' | 'reset') => {
    if (!pomodoroTimer) {
      const s = getSettings();
      pomodoroTimer = new PomodoroTimer(s.pomodoroFocusMin, s.pomodoroBreakMin, (state) => {
        catWindow?.webContents.send(IPC.POMODORO_STATE, state);
      });
    }
    if (action === 'start') pomodoroTimer.start();
    else if (action === 'pause') pomodoroTimer.pause();
    else { pomodoroTimer.reset(); pomodoroTimer = null; }
  });
}

// ─── Services ──────────────────────────────────────────────────
function startServices(): void {
  const settings = getSettings();

  idleDetector = new IdleDetector((isIdle) => {
    catWindow?.webContents.send(IPC.IDLE_CHANGED, isIdle);
    if (!isIdle) {
      const msg = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setTimeout(() => catWindow?.webContents.send(IPC.CAT_SPEECH, msg(settings.name)), 500);
    } else {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      catWindow?.webContents.send(IPC.CAT_SPEECH, msg);
    }
  });
  idleDetector.start();

  keyboardTracker = new KeyboardTracker(
    (isTyping) => catWindow?.webContents.send(IPC.TYPING_CHANGED, isTyping),
    (level) => catWindow?.webContents.send(IPC.HEAT_LEVEL, level),
    () => catWindow?.webContents.send(IPC.SCROLL_EVENT)
  );
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

  if (settings.pomodoroEnabled) {
    pomodoroTimer = new PomodoroTimer(settings.pomodoroFocusMin, settings.pomodoroBreakMin, (state) => {
      catWindow?.webContents.send(IPC.POMODORO_STATE, state);
    });
  }

  if (settings.reminderEnabled) {
    messageReminder = new MessageReminder(
      settings.reminderHour, settings.reminderMinute, settings.reminderMessage,
      (msg) => catWindow?.webContents.send(IPC.REMINDER_TRIGGER, msg)
    );
    messageReminder.start();
  }

  if (settings.claudeIntegration) {
    httpServer = new NekoDriftHttpServer();
    httpServer.start((thinking, done) => {
      catWindow?.webContents.send(IPC.AI_STATE, { thinking, done });
      if (done) {
        const s = getSettings();
        const msgs = AI_DONE_MESSAGES;
        const msg = msgs[Math.floor(Math.random() * msgs.length)](s.name);
        setTimeout(() => catWindow?.webContents.send(IPC.CAT_SPEECH, msg), 200);
      }
    });
  }

  // Apply login item setting
  applyLoginItem(settings.startOnLogin);
}

// ─── Mouse tracking (cursor follow + eye dir + velocity + shake) ─
function startMouseTracking(): void {
  let targetX = 400;
  let targetY = 400;
  let currentX = 400;
  let currentY = 400;
  let velTimer = 0;
  const recentVelX: number[] = [];
  let lastShakeTime = 0;

  // Cursor position poll — 60fps
  setInterval(() => {
    const pos = screen.getCursorScreenPoint();
    const vx = pos.x - targetX;
    const vy = pos.y - targetY;
    targetX = pos.x;
    targetY = pos.y;

    const vel = Math.hypot(vx, vy) * 60;
    if (vel > 300) {
      if (++velTimer >= 3) {
        catWindow?.webContents.send(IPC.MOUSE_VELOCITY, vel);
        velTimer = 0;
      }
    } else {
      velTimer = 0;
    }

    // Shake detection: ≥5 sign-reversals in last 16 X-velocity samples
    recentVelX.push(vx);
    if (recentVelX.length > 16) recentVelX.shift();
    if (recentVelX.length === 16) {
      let reversals = 0;
      for (let i = 1; i < recentVelX.length; i++) {
        if (Math.sign(recentVelX[i]) !== Math.sign(recentVelX[i - 1])
          && Math.abs(recentVelX[i]) > 8) reversals++;
      }
      const now = Date.now();
      if (reversals >= 5 && now - lastShakeTime > 1200) {
        lastShakeTime = now;
        catWindow?.webContents.send(IPC.SHAKE_EVENT);
      }
    }
  }, 16);

  // Window position smooth follow + eye direction
  setInterval(() => {
    if (!catWindow || catWindow.isDestroyed()) return;
    const settings = getSettings();
    const catSize = 64 * settings.size;
    const winW = catSize + 200;
    const winH = catSize + 200;

    // Smooth lag follow
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    const x = Math.round(currentX) - Math.floor(catSize / 2);
    const y = Math.round(currentY) - catSize + 8;
    const display = screen.getDisplayNearestPoint({ x: Math.round(currentX), y: Math.round(currentY) });
    const { bounds } = display;
    const cx = Math.max(bounds.x, Math.min(bounds.x + bounds.width - winW, x));
    const cy = Math.max(bounds.y, Math.min(bounds.y + bounds.height - winH, y));
    catWindow.setPosition(cx, cy, false);

    // Eye direction from cursor vs cat window center
    const wb = catWindow.getBounds();
    const catCx = wb.x + wb.width / 2;
    const catCy = wb.y + 80 + catSize * 0.2;
    const dx = Math.max(-1, Math.min(1, (targetX - catCx) / 40));
    const dy = Math.max(-1, Math.min(1, (targetY - catCy) / 40));
    catWindow.webContents.send(IPC.EYE_DIR, { dx, dy });
  }, 16);
}

// ─── Second instance ───────────────────────────────────────────
app.on('second-instance', () => {
  if (catWindow && !catWindow.isDestroyed()) catWindow.show();
});

// ─── App ready ─────────────────────────────────────────────────
app.whenReady().then(() => {
  if (isMac) {
    app.dock?.hide();
    checkAccessibilityPermission();
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

app.on('window-all-closed', () => {
  // Keep running in system tray on all platforms
});

// macOS: prevent quit when all windows closed
app.on('before-quit', () => {
  // Allow quit from tray menu
});
