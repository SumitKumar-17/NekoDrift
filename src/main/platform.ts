import { app, dialog, shell, systemPreferences } from 'electron';

export const isMac = process.platform === 'darwin';
export const isWin = process.platform === 'win32';
export const isLinux = process.platform === 'linux';

export function checkAccessibilityPermission(): void {
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

export function applyLoginItem(enabled: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
      ...(isMac ? { name: 'NekoDrift' } : {}),
    });
  } catch (_) {}
}
