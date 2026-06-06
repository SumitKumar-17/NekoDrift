import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';

type TrayCallback = {
  onOpenSettings: () => void;
  onOpenManager: () => void;
  onQuit: () => void;
  onToggleCat: () => void;
  onSummonCat: () => void;
};

export function createTray(callbacks: TrayCallback): Tray {
  const isMac = process.platform === 'darwin';
  const assetsDir = path.join(app.getAppPath(), 'assets');

  let icon: Electron.NativeImage;
  try {
    // macOS: use template image (22×22 px @1x, automatically inverted for dark menu bar)
    // Linux: tray icon must be ≤24×24 for most desktop environments
    // Windows: any size, but 16×16 or 32×32 looks best
    const iconFile = isMac ? 'tray-icon-mac.png' : 'tray-icon.png';
    const iconPath = path.join(assetsDir, iconFile);
    icon = nativeImage.createFromPath(iconPath);

    // Fall back to main icon resized if tray icon not found
    if (icon.isEmpty()) {
      const fallbackPath = path.join(assetsDir, 'icon.png');
      icon = nativeImage.createFromPath(fallbackPath);
      if (!icon.isEmpty()) {
        icon = icon.resize({ width: 22, height: 22 });
      }
    }

    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }

    // macOS: mark as template image so it adapts to light/dark menu bar
    if (isMac && !icon.isEmpty()) {
      icon.setTemplateImage(true);
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  const tray = new Tray(icon);
  tray.setToolTip('NekoDrift');

  const menu = Menu.buildFromTemplate([
    {
      label: 'NekoDrift',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Bring Cat to Center',
      click: callbacks.onSummonCat,
    },
    {
      label: 'Show / Hide Cat',
      click: callbacks.onToggleCat,
    },
    {
      label: 'Settings...',
      click: callbacks.onOpenSettings,
      accelerator: isMac ? 'Cmd+,' : undefined,
    },
    {
      label: 'Control Panel...',
      click: callbacks.onOpenManager,
    },
    { type: 'separator' },
    {
      label: 'Quit NekoDrift',
      click: callbacks.onQuit,
      accelerator: isMac ? 'Cmd+Q' : undefined,
    },
  ]);

  tray.setContextMenu(menu);

  // macOS: click opens menu; Windows/Linux: double-click opens settings
  if (!isMac) {
    tray.on('double-click', callbacks.onOpenSettings);
  }

  return tray;
}
