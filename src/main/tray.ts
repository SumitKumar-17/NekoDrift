import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';

type TrayCallback = {
  onOpenSettings: () => void;
  onQuit: () => void;
  onToggleCat: () => void;
};

export function createTray(callbacks: TrayCallback): Tray {
  // Try to load icon, fall back to empty image
  let icon: Electron.NativeImage;
  try {
    const iconPath = path.join(app.getAppPath(), 'assets', 'tray-icon.png');
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  const tray = new Tray(icon);
  tray.setToolTip('Comnyang 🐱');

  const menu = Menu.buildFromTemplate([
    {
      label: '🐱 Comnyang',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show / Hide Cat',
      click: callbacks.onToggleCat,
    },
    {
      label: 'Settings...',
      click: callbacks.onOpenSettings,
    },
    { type: 'separator' },
    {
      label: 'Quit Comnyang',
      click: callbacks.onQuit,
    },
  ]);

  tray.setContextMenu(menu);

  // Double-click opens settings on Windows/Linux
  tray.on('double-click', callbacks.onOpenSettings);

  return tray;
}
