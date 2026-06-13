// ─── Cat types ─────────────────────────────────────────────────
export type CatColor = 'orange' | 'gray' | 'black' | 'white' | 'brown' | 'pink';

export type CatPattern = 'none' | 'tuxedo' | 'tabby' | 'calico' | 'spotted' | 'bicolor';

export type CatAnimation =
  | 'idle' | 'walk' | 'run' | 'sit' | 'sleep'
  | 'type' | 'stretch' | 'happy' | 'surprised'
  | 'hunt' | 'purr' | 'overheat' | 'paper' | 'think' | 'jump';

export interface EyeDir {
  dx: number; // -1 to 1
  dy: number;
}

export type CatMood = 'happy' | 'content' | 'tired' | 'lonely';

// ─── Settings ──────────────────────────────────────────────────
export interface CatSettings {
  color: CatColor;
  pattern: CatPattern;
  name: string;
  catName: string;
  stretchIntervalMin: number;
  stretchEnabled: boolean;
  soundEnabled: boolean;
  size: number;
  alwaysOnTop: boolean;
  showOnAllDesktops: boolean;
  startOnLogin: boolean;
  // Position lock — stop cursor-follow, stay put
  lockedPosition: boolean;
  // Sticky note — shown when hovering the cat
  stickyNote: string;
  stickyNoteEnabled: boolean;
  // Pomodoro
  pomodoroEnabled: boolean;
  pomodoroFocusMin: number;
  pomodoroBreakMin: number;
  // Pinned message — always visible above cat
  fixedMessage: string;
  fixedMessageEnabled: boolean;
  // Daily reminder
  reminderEnabled: boolean;
  reminderMessage: string;
  reminderHour: number;
  reminderMinute: number;
  // Claude Code integration
  claudeIntegration: boolean;
  // Custom pixel coat (256-char string, each char = palette index 0-9, 0=transparent)
  customPixels: string;
  // Do Not Disturb — pauses stretch + daily reminder notifications
  dndEnabled: boolean;
}

// ─── State objects ─────────────────────────────────────────────
export interface PomodoroState {
  mode: 'focus' | 'break' | 'idle';
  remainingMs: number;
  session: number;
  running: boolean;
}

export interface AiState {
  thinking: boolean;
  done: boolean;
}

// ─── Multi-sprite types ────────────────────────────────────────
export type SpriteType = 'cat' | 'pikachu' | 'eevee' | 'gengar' | 'snorlax';

export interface SpriteConfig {
  id: string;
  type: SpriteType;
  lockedPosition: boolean;
  size: number;
}

export interface SpriteInfo {
  id: string;
  type: SpriteType;
  lockedPosition: boolean;
  size: number;
}

// ─── IPC channel names ─────────────────────────────────────────
export const IPC = {
  // Main → Renderer
  CAT_SPEECH:         'cat:speech',
  CAT_SETTINGS:       'cat:settings',
  STRETCH_REMINDER:   'stretch:reminder',
  IDLE_CHANGED:       'idle:changed',
  TYPING_CHANGED:     'typing:changed',
  MOUSE_VELOCITY:     'mouse:velocity',
  EYE_DIR:            'cat:eye-dir',
  POMODORO_STATE:     'pomodoro:state',
  AI_STATE:           'ai:state',
  SCROLL_EVENT:       'scroll:event',
  REMINDER_TRIGGER:   'reminder:trigger',
  SHAKE_EVENT:        'cat:shake',
  HEAT_LEVEL:         'cat:heat',

  // Renderer → Main
  GET_SETTINGS:       'settings:get',
  SAVE_SETTINGS:      'settings:save',
  DISMISS_STRETCH:    'stretch:dismiss',
  SNOOZE_STRETCH:     'stretch:snooze',
  OPEN_SETTINGS:      'window:open-settings',
  QUIT_APP:           'app:quit',
  ONBOARDING_DONE:    'onboarding:done',
  SET_IGNORE_MOUSE:   'mouse:ignore',
  DRAG_CAT:           'cat:drag',
  POMODORO_CONTROL:   'pomodoro:control',
  SHOW_CONTEXT_MENU:  'cat:context-menu',
  TOGGLE_LOCK:        'cat:toggle-lock',

  // Multi-sprite management
  SPRITE_ADD:         'sprite:add',
  SPRITE_REMOVE:      'sprite:remove',
  SPRITE_LIST:        'sprite:list',
  SPRITE_RESIZE:      'sprite:resize',
  SPRITE_CONFIG:      'sprite:config',
  SPRITE_EYE_DIR:     'sprite:eye-dir',
  OPEN_MANAGER:       'window:open-manager',
  POMO_GET:           'pomodoro:get',
} as const;
