import { ipcMain, Menu, screen, BrowserWindow } from 'electron';
import { getSettings, saveSettings, setFirstRunDone } from './store';
import { applyLoginItem, isMac } from './platform';
import { IPC } from '../shared/types';
import { StretchTimer } from './stretch-timer';
import { PomodoroTimer } from './pomodoro-timer';
import { MessageReminder } from './message-reminder';
import {
  getStretchTimer, setStretchTimer,
  getPomodoroTimer, setPomodoroTimer,
  getMessageReminder, setMessageReminder,
  getHttpServer, setHttpServer,
} from './services';
import { NekoDriftHttpServer } from './http-server';
import { addSprite, removeSprite, listSprites, resizeSprite } from './sprite-manager';
import { SpriteType } from '../shared/types';
import { getManagerWindow } from './window-manager';

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
  let lastPomoState: import('../shared/types').PomodoroState | null = null;

  const send = (channel: string, ...args: unknown[]) => {
    if (channel === IPC.POMODORO_STATE) {
      lastPomoState = args[0] as import('../shared/types').PomodoroState;
    }
    getCatWindow()?.webContents.send(channel, ...args);
    // Mirror pomodoro + reminder events to manager panel
    if (
      channel === IPC.POMODORO_STATE ||
      channel === IPC.REMINDER_TRIGGER ||
      channel === IPC.STRETCH_REMINDER
    ) {
      getManagerWindow()?.webContents.send(channel, ...args);
    }
  };

  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    send(IPC.CAT_SETTINGS, updated);

    if (partial.stretchIntervalMin !== undefined || partial.stretchEnabled !== undefined || partial.name !== undefined) {
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

    if (partial.dndEnabled !== undefined) {
      if (updated.dndEnabled) {
        getStretchTimer()?.stop();
        setStretchTimer(undefined);
        getMessageReminder()?.stop();
        setMessageReminder(null);
      } else {
        if (updated.stretchEnabled && !getStretchTimer()) {
          const st = new StretchTimer(
            (msg) => { send(IPC.STRETCH_REMINDER, msg); send(IPC.CAT_SPEECH, msg); },
            updated.stretchIntervalMin,
            updated.name,
          );
          st.start();
          setStretchTimer(st);
        }
        if (updated.reminderEnabled && !getMessageReminder()) {
          const mr = new MessageReminder(
            updated.reminderHour, updated.reminderMinute, updated.reminderMessage,
            (msg) => send(IPC.REMINDER_TRIGGER, msg),
          );
          mr.start();
          setMessageReminder(mr);
        }
      }
    }

    if (partial.alwaysOnTop !== undefined) {
      const cw = getCatWindow();
      if (cw && !cw.isDestroyed()) cw.setAlwaysOnTop(updated.alwaysOnTop);
    }

    if (partial.showOnAllDesktops !== undefined) {
      const cw = getCatWindow();
      if (cw && !cw.isDestroyed()) {
        if (updated.showOnAllDesktops) {
          cw.setVisibleOnAllWorkspaces(true, isMac ? { visibleOnFullScreen: false } : {});
        } else {
          cw.setVisibleOnAllWorkspaces(false);
        }
      }
    }

    if (partial.startOnLogin !== undefined) {
      applyLoginItem(updated.startOnLogin);
    }

    if (partial.claudeIntegration !== undefined) {
      if (!updated.claudeIntegration) {
        getHttpServer()?.stop();
        setHttpServer(null);
      } else if (!getHttpServer()) {
        const srv = new NekoDriftHttpServer();
        srv.start((thinking, done) => send(IPC.AI_STATE, { thinking, done }));
        setHttpServer(srv);
      }
    }

    return updated;
  });

  ipcMain.on(IPC.DISMISS_STRETCH, () => {
    // Cat renderer already shows a new speech bubble on dismiss — do NOT
    // send CAT_SPEECH:null here or it races and clears the new message.
  });

  ipcMain.on(IPC.SNOOZE_STRETCH, (_event, minutes: number) => {
    getStretchTimer()?.snooze(minutes);
    // Same race: renderer sets its own snooze speech, so don't clear it.
  });

  ipcMain.on(IPC.OPEN_SETTINGS, () => createSettingsWindow());
  ipcMain.on(IPC.QUIT_APP, () => quitApp());

  ipcMain.on(IPC.ONBOARDING_DONE, (_event, onboardingSettings) => {
    const updated = saveSettings(onboardingSettings);
    setFirstRunDone();
    deps.closeOnboarding();
    deps.startServices();
    // Push saved settings to cat renderer so name/color/etc. take effect immediately
    send(IPC.CAT_SETTINGS, updated);
    // Rebuild stretch timer with the user's chosen name & interval
    if (updated.stretchEnabled) {
      getStretchTimer()?.stop();
      setStretchTimer(undefined);
      const st = new StretchTimer(
        (msg) => { send(IPC.STRETCH_REMINDER, msg); send(IPC.CAT_SPEECH, msg); },
        updated.stretchIntervalMin,
        updated.name,
      );
      st.start();
      setStretchTimer(st);
    }
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
    if (getSettings().lockedPosition) return;
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
  ipcMain.handle(IPC.SPRITE_RESIZE, (_event, id: string, size: number) => resizeSprite(id, size));
  ipcMain.on(IPC.OPEN_MANAGER, () => createManagerWindow());
  ipcMain.handle(IPC.POMO_GET, () => lastPomoState);
}
