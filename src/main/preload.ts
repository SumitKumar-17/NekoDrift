import { contextBridge, ipcRenderer } from 'electron';
import { IPC, CatSettings, EyeDir, PomodoroState, AiState } from '../shared/types';

contextBridge.exposeInMainWorld('nekodrift', {
  // Settings
  getSettings: (): Promise<CatSettings> =>
    ipcRenderer.invoke(IPC.GET_SETTINGS),

  saveSettings: (settings: Partial<CatSettings>): Promise<CatSettings> =>
    ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),

  // Stretch
  dismissStretch: () => ipcRenderer.send(IPC.DISMISS_STRETCH),
  snoozeStretch: (minutes: number) => ipcRenderer.send(IPC.SNOOZE_STRETCH, minutes),

  // Window
  openSettings: () => ipcRenderer.send(IPC.OPEN_SETTINGS),
  quit: () => ipcRenderer.send(IPC.QUIT_APP),
  onboardingDone: (settings: Partial<CatSettings>) =>
    ipcRenderer.send(IPC.ONBOARDING_DONE, settings),

  // Mouse
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send(IPC.SET_IGNORE_MOUSE, ignore),
  dragCat: (dx: number, dy: number) => ipcRenderer.send(IPC.DRAG_CAT, dx, dy),

  // Pomodoro
  pomodoroControl: (action: 'start' | 'pause' | 'reset') =>
    ipcRenderer.send(IPC.POMODORO_CONTROL, action),

  // Listeners
  onCatSettings: (cb: (s: CatSettings) => void) => {
    ipcRenderer.on(IPC.CAT_SETTINGS, (_e, s) => cb(s));
  },
  onCatSpeech: (cb: (msg: string | null) => void) => {
    ipcRenderer.on(IPC.CAT_SPEECH, (_e, msg) => cb(msg));
  },
  onStretchReminder: (cb: (msg: string) => void) => {
    ipcRenderer.on(IPC.STRETCH_REMINDER, (_e, msg) => cb(msg));
  },
  onIdleChanged: (cb: (isIdle: boolean) => void) => {
    ipcRenderer.on(IPC.IDLE_CHANGED, (_e, isIdle) => cb(isIdle));
  },
  onTypingChanged: (cb: (isTyping: boolean) => void) => {
    ipcRenderer.on(IPC.TYPING_CHANGED, (_e, isTyping) => cb(isTyping));
  },
  onMouseVelocity: (cb: (vel: number) => void) => {
    ipcRenderer.on(IPC.MOUSE_VELOCITY, (_e, vel) => cb(vel));
  },
  onEyeDir: (cb: (dir: EyeDir) => void) => {
    ipcRenderer.on(IPC.EYE_DIR, (_e, dir) => cb(dir));
  },
  onPomodoroState: (cb: (s: PomodoroState) => void) => {
    ipcRenderer.on(IPC.POMODORO_STATE, (_e, s) => cb(s));
  },
  onAiState: (cb: (s: AiState) => void) => {
    ipcRenderer.on(IPC.AI_STATE, (_e, s) => cb(s));
  },
  onScrollEvent: (cb: () => void) => {
    ipcRenderer.on(IPC.SCROLL_EVENT, () => cb());
  },
  onReminderTrigger: (cb: (msg: string) => void) => {
    ipcRenderer.on(IPC.REMINDER_TRIGGER, (_e, msg) => cb(msg));
  },
});
