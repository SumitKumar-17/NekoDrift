import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { getSettings } from './store';
import { isMac, isLinux } from './platform';

const DIST = path.join(app.getAppPath(), 'dist/renderer');
const PRELOAD = path.join(app.getAppPath(), 'dist/main/preload.js');

export function rendererPath(file: string): string {
  return `file://${path.join(DIST, file)}`;
}

let catWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;

export function getCatWindow(): BrowserWindow | null { return catWindow; }
export function getSettingsWindow(): BrowserWindow | null { return settingsWindow; }
export function getOnboardingWindow(): BrowserWindow | null { return onboardingWindow; }

export function createCatWindow(): void {
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
    ...(isMac ? { roundedCorners: false } : {}),
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  catWindow.setIgnoreMouseEvents(true, { forward: true });

  if (isMac) {
    catWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  } else if (isLinux) {
    catWindow.setVisibleOnAllWorkspaces(true);
  }

  catWindow.loadURL(rendererPath('cat/index.html'));
  catWindow.on('closed', () => { catWindow = null; });
}

export function createSettingsWindow(): void {
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
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadURL(rendererPath('settings/index.html'));
  settingsWindow.once('ready-to-show', () => settingsWindow?.show());
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

export function createOnboardingWindow(): void {
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
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  onboardingWindow.loadURL(rendererPath('onboarding/index.html'));
  onboardingWindow.once('ready-to-show', () => onboardingWindow?.show());
  onboardingWindow.on('closed', () => { onboardingWindow = null; });
}
