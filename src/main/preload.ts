import { contextBridge, ipcRenderer } from 'electron';
import { IPC, CatSettings } from '../shared/types';

contextBridge.exposeInMainWorld('comnyang', {
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

  // Listeners (cat window)
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
});
