import { ipcMain, Menu, screen, BrowserWindow, Notification } from 'electron';
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
  isDndActive,
  getKeyboardTracker,
} from './services';
import { NekoDriftHttpServer } from './http-server';
import {
  addSprite,
  removeSprite,
  listSprites,
  resizeSprite,
  dragSprite,
  setSpriteIgnoreMouse,
  setSpritesAlwaysOnTop,
  setSpritesVisibleOnAllWorkspaces,
} from './sprite-manager';
import { SpriteType } from '../shared/types';
import { getManagerWindow, getTray } from './window-manager';
import { updateTrayMood } from './tray';
import { incrementLifetimePets, getCatAgeDays, getCatBirthday } from './store';

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

  // Birthday notification on launch
  (() => {
    try {
      const birthday = new Date(getCatBirthday());
      const now = new Date();
      const ageDays = getCatAgeDays();
      if (ageDays > 0 && birthday.getDate() === now.getDate() && birthday.getMonth() === now.getMonth()) {
        const name = getSettings().catName || 'your cat';
        if (Notification.isSupported()) {
          new Notification({
            title: `Happy Birthday, ${name}! 🎂`,
            body: `${name} is ${ageDays} day${ageDays !== 1 ? 's' : ''} old today!`,
            silent: false,
          }).show();
        }
      }
    } catch (_) {}
  })();

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

  const restartStretchTimer = (updated: import('../shared/types').CatSettings) => {
    getStretchTimer()?.stop();
    setStretchTimer(undefined);
    if (!updated.stretchEnabled || isDndActive()) return;

    const st = new StretchTimer(
      (msg) => {
        send(IPC.STRETCH_REMINDER, msg);
        send(IPC.CAT_SPEECH, msg);
        if (Notification.isSupported()) {
          new Notification({ title: 'NekoDrift 🐱', body: msg, silent: true }).show();
        }
      },
      updated.stretchIntervalMin,
      updated.name,
    );
    st.start();
    setStretchTimer(st);
  };

  const restartPomodoroTimer = (updated: import('../shared/types').CatSettings) => {
    getPomodoroTimer()?.stop();
    setPomodoroTimer(null);
    if (!updated.pomodoroEnabled) return;

    setPomodoroTimer(new PomodoroTimer(
      updated.pomodoroFocusMin,
      updated.pomodoroBreakMin,
      (state) => send(IPC.POMODORO_STATE, state),
    ));
  };

  const restartMessageReminder = (updated: import('../shared/types').CatSettings) => {
    getMessageReminder()?.stop();
    setMessageReminder(null);
    if (!updated.reminderEnabled || isDndActive()) return;

    const mr = new MessageReminder(
      updated.reminderHour,
      updated.reminderMinute,
      updated.reminderMessage,
      (msg) => {
        send(IPC.REMINDER_TRIGGER, msg);
        if (Notification.isSupported()) {
          new Notification({ title: 'NekoDrift 🐱', body: msg, silent: true }).show();
        }
      },
    );
    mr.start();
    setMessageReminder(mr);
  };

  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings());

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, partial) => {
    const updated = saveSettings(partial);
    send(IPC.CAT_SETTINGS, updated);

    if (partial.stretchIntervalMin !== undefined || partial.stretchEnabled !== undefined || partial.name !== undefined) {
      restartStretchTimer(updated);
    }

    if (partial.pomodoroEnabled !== undefined || partial.pomodoroFocusMin !== undefined || partial.pomodoroBreakMin !== undefined) {
      restartPomodoroTimer(updated);
    }

    if (partial.reminderEnabled !== undefined || partial.reminderHour !== undefined
      || partial.reminderMinute !== undefined || partial.reminderMessage !== undefined) {
      restartMessageReminder(updated);
    }

    if (partial.dndEnabled !== undefined || partial.dndScheduleEnabled !== undefined
        || partial.dndStartHour !== undefined || partial.dndEndHour !== undefined) {
      restartStretchTimer(updated);
      restartMessageReminder(updated);
    }

    if (partial.alwaysOnTop !== undefined) {
      const cw = getCatWindow();
      if (cw && !cw.isDestroyed()) cw.setAlwaysOnTop(updated.alwaysOnTop);
      setSpritesAlwaysOnTop(updated.alwaysOnTop);
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
      setSpritesVisibleOnAllWorkspaces(updated.showOnAllDesktops);
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
    restartStretchTimer(updated);
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
      { label: 'Control Panel...', click: createManagerWindow },
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

  let lastEdgeBump = 0;
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
    const clampedX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - w, newX));
    const clampedY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - h, newY));
    cw.setPosition(clampedX, clampedY, false);

    // Trigger edge-bump surprise once per second when cat is pushed against any edge
    const now = Date.now();
    const atEdge = clampedX !== newX || clampedY !== newY;
    if (atEdge && now - lastEdgeBump > 1000) {
      lastEdgeBump = now;
      cw.webContents.send(IPC.SHAKE_EVENT);
    }
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
  ipcMain.on(IPC.SPRITE_DRAG, (_event, id: string, dx: number, dy: number) => dragSprite(id, dx, dy));
  ipcMain.on(IPC.SPRITE_SET_IGNORE_MOUSE, (_event, id: string, ignore: boolean) => setSpriteIgnoreMouse(id, ignore));
  ipcMain.on(IPC.OPEN_MANAGER, () => createManagerWindow());
  ipcMain.handle(IPC.POMO_GET, () => lastPomoState);

  // ─── Cat stats (pushed from renderer, served to manager) ───
  let cachedCatStats: Record<string, unknown> | null = null;
  let lastPetCount = 0;
  // Mood history: up to 48 samples (one per 30 min = 24 h), rotates daily
  const moodHistory: { hour: number; mood: string }[] = [];
  let moodHistoryDate = new Date().toDateString();
  let lastRecordedMoodHour = -1;
  ipcMain.on(IPC.CAT_STATS_PUSH, (_event, stats) => {
    const incoming = stats as Record<string, unknown>;
    // Increment lifetime pets when session petCount grows
    const newPets = (incoming?.petCount as number) ?? 0;
    if (newPets > lastPetCount) {
      const diff = newPets - lastPetCount;
      const total = incrementLifetimePets(diff);
      const milestones = [10, 25, 50, 100, 250, 500, 1000];
      if (milestones.includes(total) && Notification.isSupported()) {
        new Notification({
          title: 'NekoDrift 🎉',
          body: `${total} lifetime pets! Your cat loves you! ♡`,
          silent: true,
        }).show();
      }
    }
    lastPetCount = newPets;
    if (incoming?.__lonelyCry && Notification.isSupported()) {
      const n = getSettings().catName || 'your cat';
      new Notification({ title: 'NekoDrift 🥺', body: `${n} is feeling lonely... come say hi!`, silent: false }).show();
    }
    // Hunger notification
    if (incoming?.hunger === 'hungry' && incoming?.__hungerNotified !== true) {
      const n = getSettings().catName || 'your cat';
      if (Notification.isSupported()) {
        new Notification({ title: 'NekoDrift 🍣', body: `${n} is getting hungry! Open the manager to feed.`, silent: true }).show();
      }
    }
    cachedCatStats = { ...incoming, lifetimePets: lastPetCount };

    // Record mood into hourly history
    const now = new Date();
    const today = now.toDateString();
    if (today !== moodHistoryDate) {
      moodHistory.length = 0;
      moodHistoryDate = today;
      lastRecordedMoodHour = -1;
    }
    const currentHour = now.getHours();
    if (currentHour !== lastRecordedMoodHour && incoming?.mood) {
      moodHistory.push({ hour: currentHour, mood: incoming.mood as string });
      if (moodHistory.length > 48) moodHistory.shift();
      lastRecordedMoodHour = currentHour;
    }

    const tray = getTray?.();
    if (tray && incoming?.mood && getSettings().catName) {
      updateTrayMood(tray, incoming.mood as string, getSettings().catName);
    }
  });
  ipcMain.handle(IPC.CAT_STATS_GET, () => ({
    ...cachedCatStats,
    keysToday: getKeyboardTracker()?.getTodayKeyCount() ?? 0,
    moodHistory: [...moodHistory],
    catAgeDays: getCatAgeDays(),
  }));

  // ─── Remote cat actions (manager → main → cat) ─────────────
  ipcMain.on(IPC.CAT_REMOTE_ACTION, (_event, action: string) => {
    const cw = getCatWindow();
    if (cw && !cw.isDestroyed()) {
      cw.webContents.send(IPC.CAT_REMOTE_ACTION_FWD, action);
    }
  });

  // ─── Get cat window bounds for wander ────────────────────────
  ipcMain.handle(IPC.GET_CAT_BOUNDS, () => {
    const cw = getCatWindow();
    if (!cw || cw.isDestroyed()) return null;
    const [x, y] = cw.getPosition();
    const [w, h] = cw.getSize();
    const display = screen.getDisplayNearestPoint({ x, y });
    const b = display.bounds;
    return { x, y, w, h, displayX: b.x, displayY: b.y, displayW: b.width, displayH: b.height };
  });

  // ─── Window bounce (cat jumps — hop window up then back) ─────
  ipcMain.on(IPC.CAT_WINDOW_BOUNCE, (_event, heightPx: number) => {
    const cw = getCatWindow();
    if (!cw || cw.isDestroyed() || getSettings().lockedPosition) return;
    const [x, y] = cw.getPosition();
    const display = screen.getDisplayNearestPoint({ x, y });
    const minY = display.bounds.y;
    const jumpY = Math.max(minY, y - heightPx);
    cw.setPosition(x, jumpY, false);
    setTimeout(() => {
      if (!cw.isDestroyed()) cw.setPosition(x, y, false);
    }, 400);
  });
}
