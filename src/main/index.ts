import { app, Menu, Tray } from 'electron';
import { isFirstRun } from './store';
import { createTray } from './tray';
import { isMac, checkAccessibilityPermission } from './platform';
import {
  createCatWindow, createSettingsWindow, createOnboardingWindow, createManagerWindow,
  getCatWindow, getSettingsWindow, getOnboardingWindow, getManagerWindow, summonCat,
} from './window-manager';
import { startServices, stopAll } from './services';
import { startMouseTracking } from './mouse-tracker';
import { setupIPC } from './ipc-handlers';
import { destroyAllSprites } from './sprite-manager';

// ─── Single instance lock ──────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let tray: Tray | null = null;

function quitApp(): void {
  stopAll();
  destroyAllSprites();
  try { getCatWindow()?.destroy(); } catch (_) {}
  try { getSettingsWindow()?.destroy(); } catch (_) {}
  try { getOnboardingWindow()?.destroy(); } catch (_) {}
  try { getManagerWindow()?.destroy(); } catch (_) {}
  try { tray?.destroy(); tray = null; } catch (_) {}
  app.exit(0);
}

app.on('second-instance', () => {
  const cw = getCatWindow();
  if (cw && !cw.isDestroyed()) cw.show();
});

app.whenReady().then(() => {
  if (isMac) {
    app.dock?.setMenu(Menu.buildFromTemplate([
      { label: 'Settings...', click: () => createSettingsWindow() },
      {
        label: 'Show / Hide Cat', click: () => {
          const cw = getCatWindow();
          if (cw?.isVisible()) cw.hide();
          else cw?.show();
        },
      },
    ]));
    checkAccessibilityPermission();
  }

  setupIPC({
    getCatWindow,
    createSettingsWindow,
    createManagerWindow,
    closeOnboarding: () => getOnboardingWindow()?.close(),
    startServices: () => startServices(getCatWindow),
    quitApp,
  });

  createCatWindow();

  tray = createTray({
    onOpenSettings: createSettingsWindow,
    onOpenManager: createManagerWindow,
    onQuit: quitApp,
    onToggleCat: () => {
      const cw = getCatWindow();
      if (cw?.isVisible()) cw.hide();
      else cw?.show();
    },
    onSummonCat: summonCat,
  });

  startMouseTracking(getCatWindow);

  if (isFirstRun()) {
    createOnboardingWindow();
  }
  startServices(getCatWindow);
});

app.on('window-all-closed', () => {
  // Keep running in system tray on all platforms
});
