import { ipcMain, Menu, screen, BrowserWindow } from 'electron';
import { getSettings, saveSettings, setFirstRunDone } from './store';
import { applyLoginItem } from './platform';
import { IPC } from '../shared/types';
import { StretchTimer } from './stretch-timer';
import { PomodoroTimer } from './pomodoro-timer';
import { MessageReminder } from './message-reminder';
import {
  getStretchTimer, setStretchTimer,
  getPomodoroTimer, setPomodoroTimer,
  getMessageReminder, setMessageReminder,
} from './services';
import { addSprite, removeSprite, listSprites } from './sprite-manager';
import { SpriteType } from '../shared/types';

export interface IpcDeps {
  getCatWindow: () => BrowserWindow | null;
  createSettingsWindow: () => void;
  createManagerWindow: () => void;
  closeOnboarding: () => void;
  startServices: () => void;
  quitApp: () => void;
}

export function setupIPC(deps: IpcDeps): void {
  const { getCatWindow, createSettingsWindow, createManagerWindow, quitApp } = deps;
  const send = (channel: string, ...args: unknown[]) =>
    getCatWindow()?.webContents.send(channel, ...args);

  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    send(IPC.CAT_SETTINGS, updated);

    if (partial.stretchIntervalMin !== undefined || partial.stretchEnabled !== undefined) {
      getStretchTimer()?.stop();
      setStretchTimer(undefined);
      if (updated.stretchEnabled) {
        const st = new StretchTimer(
          (msg) => { send(IPC.STRETCH_REMINDER, msg); send(IPC.CAT_SPEECH, msg); },
          updated.stretchIntervalMin,
          updated.name,
        );
        st.start();
        setStretchTimer(st);
      }
    }

    if (partial.pomodoroEnabled !== undefined || partial.pomodoroFocusMin !== undefined || partial.pomodoroBreakMin !== undefined) {
      getPomodoroTimer()?.stop();
      setPomodoroTimer(null);
      if (updated.pomodoroEnabled) {
        setPomodoroTimer(new PomodoroTimer(
          updated.pomodoroFocusMin, updated.pomodoroBreakMin,
          (state) => send(IPC.POMODORO_STATE, state),
        ));
      }
    }

    if (partial.reminderEnabled !== undefined || partial.reminderHour !== undefined
      || partial.reminderMinute !== undefined || partial.reminderMessage !== undefined) {
      getMessageReminder()?.stop();
      setMessageReminder(null);
      if (updated.reminderEnabled) {
        const mr = new MessageReminder(
          updated.reminderHour, updated.reminderMinute, updated.reminderMessage,
          (msg) => send(IPC.REMINDER_TRIGGER, msg),
        );
        mr.start();
        setMessageReminder(mr);
      }
    }

    if (partial.alwaysOnTop !== undefined) {
      const cw = getCatWindow();
      if (cw && !cw.isDestroyed()) cw.setAlwaysOnTop(updated.alwaysOnTop);
    }

    if (partial.startOnLogin !== undefined) {
      applyLoginItem(updated.startOnLogin);
    }

    return updated;
  });

  ipcMain.on(IPC.DISMISS_STRETCH, () => send(IPC.CAT_SPEECH, null));

  ipcMain.on(IPC.SNOOZE_STRETCH, (_event, minutes: number) => {
    getStretchTimer()?.snooze(minutes);
    send(IPC.CAT_SPEECH, null);
  });

  ipcMain.on(IPC.OPEN_SETTINGS, () => createSettingsWindow());
  ipcMain.on(IPC.QUIT_APP, () => quitApp());

  ipcMain.on(IPC.ONBOARDING_DONE, (_event, settings) => {
    saveSettings(settings);
    setFirstRunDone();
    deps.closeOnboarding();
    deps.startServices();
  });

  ipcMain.on(IPC.SET_IGNORE_MOUSE, (_event, ignore: boolean) => {
    const cw = getCatWindow();
    if (cw && !cw.isDestroyed()) cw.setIgnoreMouseEvents(ignore, { forward: true });
  });

  ipcMain.on(IPC.SHOW_CONTEXT_MENU, () => {
    const s = getSettings();
    const cw = getCatWindow();
    const menu = Menu.buildFromTemplate([
      {
        label: s.lockedPosition ? 'Unpin position' : 'Pin here',
        click: () => {
          const updated = saveSettings({ lockedPosition: !s.lockedPosition });
          send(IPC.CAT_SETTINGS, updated);
        },
      },
      {
        label: s.stickyNoteEnabled ? 'Remove hover note' : 'Add hover note...',
        click: () => {
          if (s.stickyNoteEnabled) {
            const updated = saveSettings({ stickyNoteEnabled: false });
            send(IPC.CAT_SETTINGS, updated);
          } else {
            createSettingsWindow();
          }
        },
      },
      { type: 'separator' },
      { label: 'Settings...', click: createSettingsWindow },
      {
        label: cw?.isVisible() ? 'Hide cat' : 'Show cat',
        click: () => {
          if (cw?.isVisible()) cw.hide();
          else cw?.show();
        },
      },
      { type: 'separator' },
      { label: 'Quit NekoDrift', click: quitApp },
    ]);
    menu.popup({ window: cw ?? undefined });
  });

  ipcMain.on(IPC.TOGGLE_LOCK, () => {
    const s = getSettings();
    const updated = saveSettings({ lockedPosition: !s.lockedPosition });
    send(IPC.CAT_SETTINGS, updated);
  });

  ipcMain.on(IPC.DRAG_CAT, (_event, dx: number, dy: number) => {
    const cw = getCatWindow();
    if (!cw || cw.isDestroyed()) return;
    const [x, y] = cw.getPosition();
    const newX = x + Math.round(dx);
    const newY = y + Math.round(dy);
    const display = screen.getDisplayNearestPoint({ x: newX, y: newY });
    const { bounds } = display;
    const [w, h] = cw.getSize();
    cw.setPosition(
      Math.max(bounds.x, Math.min(bounds.x + bounds.width - w, newX)),
      Math.max(bounds.y, Math.min(bounds.y + bounds.height - h, newY)),
      false,
    );
  });

  ipcMain.on(IPC.POMODORO_CONTROL, (_event, action: 'start' | 'pause' | 'reset') => {
    if (!getPomodoroTimer()) {
      const s = getSettings();
      setPomodoroTimer(new PomodoroTimer(
        s.pomodoroFocusMin, s.pomodoroBreakMin,
        (state) => send(IPC.POMODORO_STATE, state),
      ));
    }
    const pt = getPomodoroTimer()!;
    if (action === 'start') pt.start();
    else if (action === 'pause') pt.pause();
    else { pt.reset(); setPomodoroTimer(null); }
  });

  // ─── Sprite management ─────────────────────────────────────
  ipcMain.handle(IPC.SPRITE_ADD, (_event, type: SpriteType) => addSprite(type));
  ipcMain.handle(IPC.SPRITE_REMOVE, (_event, id: string) => removeSprite(id));
  ipcMain.handle(IPC.SPRITE_LIST, () => listSprites());
  ipcMain.on(IPC.OPEN_MANAGER, () => createManagerWindow());
}
