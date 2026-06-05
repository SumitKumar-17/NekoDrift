export type CatColor = 'orange' | 'gray' | 'black' | 'white' | 'brown' | 'pink';

export type CatAnimation =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'sleep'
  | 'type'
  | 'stretch'
  | 'happy'
  | 'surprised';

export interface CatSettings {
  color: CatColor;
  name: string;           // user's name
  catName: string;        // cat's name
  stretchIntervalMin: number;  // minutes between stretch reminders
  stretchEnabled: boolean;
  soundEnabled: boolean;
  size: number;           // scale multiplier 1-3
  alwaysOnTop: boolean;
  showOnAllDesktops: boolean;
  startOnLogin: boolean;
}

export interface AppState {
  settings: CatSettings;
  lastActivity: number;   // timestamp
  isIdle: boolean;
  isTyping: boolean;
}

export const IPC = {
  // Main → Renderer
  CAT_ANIMATE:        'cat:animate',
  CAT_SPEECH:         'cat:speech',
  CAT_SETTINGS:       'cat:settings',
  STRETCH_REMINDER:   'stretch:reminder',
  IDLE_CHANGED:       'idle:changed',
  TYPING_CHANGED:     'typing:changed',

  // Renderer → Main
  GET_SETTINGS:       'settings:get',
  SAVE_SETTINGS:      'settings:save',
  DISMISS_STRETCH:    'stretch:dismiss',
  SNOOZE_STRETCH:     'stretch:snooze',
  OPEN_SETTINGS:      'window:open-settings',
  QUIT_APP:           'app:quit',
  ONBOARDING_DONE:    'onboarding:done',
} as const;
