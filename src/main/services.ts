import { BrowserWindow } from 'electron';
import { getSettings } from './store';
import { applyLoginItem } from './platform';
import { IdleDetector } from './idle-detector';
import { KeyboardTracker } from './keyboard-tracker';
import { StretchTimer } from './stretch-timer';
import { PomodoroTimer } from './pomodoro-timer';
import { MessageReminder } from './message-reminder';
import { NekoDriftHttpServer } from './http-server';
import { IPC } from '../shared/types';
import { GREETING_MESSAGES, IDLE_MESSAGES, AI_DONE_MESSAGES } from '../shared/constants';

let idleDetector: IdleDetector;
let keyboardTracker: KeyboardTracker;
let stretchTimer: StretchTimer | undefined;
let pomodoroTimer: PomodoroTimer | null = null;
let messageReminder: MessageReminder | null = null;
let httpServer: NekoDriftHttpServer | null = null;

export function getStretchTimer() { return stretchTimer; }
export function setStretchTimer(t: StretchTimer | undefined) { stretchTimer = t; }
export function getPomodoroTimer() { return pomodoroTimer; }
export function setPomodoroTimer(t: PomodoroTimer | null) { pomodoroTimer = t; }
export function getMessageReminder() { return messageReminder; }
export function setMessageReminder(r: MessageReminder | null) { messageReminder = r; }

export function startServices(getCatWindow: () => BrowserWindow | null): void {
  const settings = getSettings();
  const send = (channel: string, ...args: unknown[]) =>
    getCatWindow()?.webContents.send(channel, ...args);

  idleDetector = new IdleDetector((isIdle) => {
    send(IPC.IDLE_CHANGED, isIdle);
    if (!isIdle) {
      const msg = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setTimeout(() => send(IPC.CAT_SPEECH, msg(settings.name)), 500);
    } else {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      send(IPC.CAT_SPEECH, msg);
    }
  });
  idleDetector.start();

  keyboardTracker = new KeyboardTracker(
    (isTyping) => send(IPC.TYPING_CHANGED, isTyping),
    (level) => send(IPC.HEAT_LEVEL, level),
    () => send(IPC.SCROLL_EVENT),
  );
  keyboardTracker.start();

  if (settings.stretchEnabled) {
    stretchTimer = new StretchTimer(
      (msg) => { send(IPC.STRETCH_REMINDER, msg); send(IPC.CAT_SPEECH, msg); },
      settings.stretchIntervalMin,
      settings.name,
    );
    stretchTimer.start();
  }

  if (settings.pomodoroEnabled) {
    pomodoroTimer = new PomodoroTimer(
      settings.pomodoroFocusMin,
      settings.pomodoroBreakMin,
      (state) => send(IPC.POMODORO_STATE, state),
    );
  }

  if (settings.reminderEnabled) {
    messageReminder = new MessageReminder(
      settings.reminderHour, settings.reminderMinute, settings.reminderMessage,
      (msg) => send(IPC.REMINDER_TRIGGER, msg),
    );
    messageReminder.start();
  }

  if (settings.claudeIntegration) {
    httpServer = new NekoDriftHttpServer();
    httpServer.start((thinking, done) => {
      send(IPC.AI_STATE, { thinking, done });
      if (done) {
        const s = getSettings();
        const msg = AI_DONE_MESSAGES[Math.floor(Math.random() * AI_DONE_MESSAGES.length)](s.name);
        setTimeout(() => send(IPC.CAT_SPEECH, msg), 200);
      }
    });
  }

  applyLoginItem(settings.startOnLogin);
}

export function stopAll(): void {
  try { idleDetector?.stop(); } catch (_) {}
  try { keyboardTracker?.stop(); } catch (_) {}
  try { stretchTimer?.stop(); } catch (_) {}
  try { pomodoroTimer?.stop(); } catch (_) {}
  try { messageReminder?.stop(); } catch (_) {}
  try { httpServer?.stop(); } catch (_) {}
}
