import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { SpriteType, SpriteConfig, SpriteInfo, IPC } from '../shared/types';
import { isMac, isLinux } from './platform';
import { getSettings } from './store';

const PRELOAD = path.join(app.getAppPath(), 'dist/main/preload.js');
const DIST = path.join(app.getAppPath(), 'dist/renderer');

function spriteUrl(config: SpriteConfig): string {
  const { id, type, size } = config;
  const scale = size * 4;
  return `file://${DIST}/sprite/index.html?id=${encodeURIComponent(id)}&type=${type}&scale=${scale}`;
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 8);
}

interface SpriteEntry {
  config: SpriteConfig;
  win: BrowserWindow;
}

const sprites = new Map<string, SpriteEntry>();

export function addSprite(type: SpriteType): SpriteInfo {
  const settings = getSettings();
  const id = `${type}-${makeId()}`;
  const config: SpriteConfig = {
    id,
    type,
    lockedPosition: false,
    size: settings.size,
  };

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const catSize = 64 * config.size;
  const winW = catSize + 80;
  const winH = catSize + 80;

  const win = new BrowserWindow({
    width: winW,
    height: winH,
    x: Math.floor(width / 2 + (sprites.size * 20)),
    y: Math.floor(height / 2 + (sprites.size * 20)),
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

  win.setIgnoreMouseEvents(true, { forward: true });

  if (settings.showOnAllDesktops) {
    if (isMac) {
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    } else if (isLinux) {
      win.setVisibleOnAllWorkspaces(true);
    }
  }

  win.loadURL(spriteUrl(config));
  win.on('closed', () => { sprites.delete(id); });

  sprites.set(id, { config, win });
  return { id, type, lockedPosition: config.lockedPosition, size: config.size };
}

export function removeSprite(id: string): boolean {
  const entry = sprites.get(id);
  if (!entry) return false;
  try {
    if (!entry.win.isDestroyed()) entry.win.destroy();
  } catch { /* ignore */ }
  sprites.delete(id);
  return true;
}

export function listSprites(): SpriteInfo[] {
  return Array.from(sprites.values()).map(({ config }) => ({
    id: config.id,
    type: config.type,
    lockedPosition: config.lockedPosition,
    size: config.size,
  }));
}

export function resizeSprite(id: string, size: number): boolean {
  const entry = sprites.get(id);
  if (!entry || entry.win.isDestroyed()) return false;
  entry.config.size = Math.max(1, Math.min(4, Math.round(size)));
  const catSize = 64 * entry.config.size;
  entry.win.setSize(catSize + 80, catSize + 80);
  entry.win.loadURL(spriteUrl(entry.config));
  return true;
}

export function getSpriteWindow(id: string): BrowserWindow | null {
  return sprites.get(id)?.win ?? null;
}

export function trackMouseForSprites(cursorX: number, cursorY: number) {
  for (const { config, win } of sprites.values()) {
    if (win.isDestroyed() || config.lockedPosition) continue;
    const [wX, wY] = win.getPosition();
    const [wW, wH] = win.getSize();
    const catCX = wX + wW / 2;
    const catCY = wY + wH / 2;
    const dx = (cursorX - catCX) / Math.max(wW, 1);
    const dy = (cursorY - catCY) / Math.max(wH, 1);
    const mag = Math.sqrt(dx * dx + dy * dy);
    win.webContents.send(IPC.SPRITE_EYE_DIR, config.id, {
      dx: mag > 0 ? dx / mag : 0,
      dy: mag > 0 ? dy / mag : 0,
    });
  }
}

export function broadcastToSprites(channel: string, ...args: unknown[]): void {
  for (const { win } of sprites.values()) {
    if (!win.isDestroyed()) win.webContents.send(channel, ...args);
  }
}

export function destroyAllSprites(): void {
  for (const { win } of sprites.values()) {
    try { if (!win.isDestroyed()) win.destroy(); } catch { /* ignore */ }
  }
  sprites.clear();
}
