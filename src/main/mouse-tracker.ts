import { BrowserWindow, screen } from 'electron';
import { getSettings } from './store';
import { IPC } from '../shared/types';

export function startMouseTracking(getCatWindow: () => BrowserWindow | null): void {
  let targetX = 400;
  let targetY = 400;
  let currentX = 400;
  let currentY = 400;
  let velTimer = 0;
  const recentVelX: number[] = [];
  let lastShakeTime = 0;

  // Walk animation state — sent as vel=0 (stop) or vel>0 (start)
  let walkActive = false;
  let walkStopTimer: ReturnType<typeof setTimeout> | null = null;

  // Cursor position poll — velocity + shake detection
  setInterval(() => {
    const pos = screen.getCursorScreenPoint();
    const vx = pos.x - targetX;
    const vy = pos.y - targetY;
    targetX = pos.x;
    targetY = pos.y;

    const vel = Math.hypot(vx, vy) * 60;
    if (vel > 300) {
      if (++velTimer >= 3) {
        getCatWindow()?.webContents.send(IPC.MOUSE_VELOCITY, vel);
        velTimer = 0;
      }
      // Hunt overrides walk — cancel pending walk-stop and clear walk state
      if (walkActive) {
        walkActive = false;
        if (walkStopTimer) { clearTimeout(walkStopTimer); walkStopTimer = null; }
      }
    } else {
      velTimer = 0;
      if (vel > 120 && !getSettings().lockedPosition) {
        if (!walkActive) {
          walkActive = true;
          getCatWindow()?.webContents.send(IPC.MOUSE_VELOCITY, vel);
        }
        if (walkStopTimer) clearTimeout(walkStopTimer);
        walkStopTimer = setTimeout(() => {
          walkActive = false;
          walkStopTimer = null;
          getCatWindow()?.webContents.send(IPC.MOUSE_VELOCITY, 0);
        }, 500);
      }
    }

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
        getCatWindow()?.webContents.send(IPC.SHAKE_EVENT);
      }
    }
  }, 16);

  // Window smooth-follow + eye direction (position-lock aware)
  setInterval(() => {
    const catWindow = getCatWindow();
    if (!catWindow || catWindow.isDestroyed()) return;
    const settings = getSettings();
    const sz = 64 * settings.size;

    if (settings.lockedPosition) {
      const wb = catWindow.getBounds();
      const catCx = wb.x + wb.width / 2;
      const catCy = wb.y + 80 + sz * 0.2;
      catWindow.webContents.send(IPC.EYE_DIR, {
        dx: Math.max(-1, Math.min(1, (targetX - catCx) / 40)),
        dy: Math.max(-1, Math.min(1, (targetY - catCy) / 40)),
      });
      return;
    }

    const winW = sz + 200;
    const winH = sz + 200;

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    const x = Math.round(currentX) - Math.floor(sz / 2);
    const y = Math.round(currentY) - sz + 8;
    const display = screen.getDisplayNearestPoint({ x: Math.round(currentX), y: Math.round(currentY) });
    const { bounds } = display;
    catWindow.setPosition(
      Math.max(bounds.x, Math.min(bounds.x + bounds.width - winW, x)),
      Math.max(bounds.y, Math.min(bounds.y + bounds.height - winH, y)),
      false,
    );

    const wb = catWindow.getBounds();
    const catCx = wb.x + wb.width / 2;
    const catCy = wb.y + 80 + sz * 0.2;
    catWindow.webContents.send(IPC.EYE_DIR, {
      dx: Math.max(-1, Math.min(1, (targetX - catCx) / 40)),
      dy: Math.max(-1, Math.min(1, (targetY - catCy) / 40)),
    });
  }, 16);
}
