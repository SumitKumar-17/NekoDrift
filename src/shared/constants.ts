import { CatSettings } from './types';

export const DEFAULT_SETTINGS: CatSettings = {
  color: 'orange',
  pattern: 'none',
  name: 'hooman',
  catName: 'NekoDrift',
  stretchIntervalMin: 30,
  stretchEnabled: true,
  soundEnabled: false,
  size: 2,
  alwaysOnTop: true,
  showOnAllDesktops: true,
  startOnLogin: false,
  lockedPosition: false,
  stickyNote: '',
  stickyNoteEnabled: false,
  pomodoroEnabled: false,
  pomodoroFocusMin: 25,
  pomodoroBreakMin: 5,
  fixedMessage: '',
  fixedMessageEnabled: false,
  reminderEnabled: false,
  reminderMessage: 'Hey! Check in time! 🐱',
  reminderHour: 15,
  reminderMinute: 0,
  claudeIntegration: true,
  customPixels: '0'.repeat(256),
};

// Named cat breed presets
export const CAT_PRESETS = [
  { id: 'orange',   label: 'Orange',   color: 'orange' as const, pattern: 'none'   as const },
  { id: 'siamese',  label: 'Siamese',  color: 'white'  as const, pattern: 'tabby'  as const },
  { id: 'mackerel', label: 'Mackerel', color: 'gray'   as const, pattern: 'tabby'  as const },
  { id: 'tuxedo',   label: 'Tuxedo',   color: 'black'  as const, pattern: 'tuxedo' as const },
  { id: 'calico',   label: 'Calico',   color: 'white'  as const, pattern: 'calico' as const },
  { id: 'sakura',   label: 'Sakura',   color: 'pink'   as const, pattern: 'none'   as const },
] as const;

export const IDLE_THRESHOLD_MS = 60_000 * 3;
export const TYPING_COOLDOWN_MS = 1_500;
export const OVERHEAT_WPM = 160;
export const HUNT_VELOCITY_PX_S = 300;

export const CAT_GRID = 16;
export const CAT_SCALE = 3;

export const CAT_COLORS = {
  orange: { body: '#e8894a', belly: '#f9c89b', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#c96a2a', eye: '#2d1b0e' },
  gray:   { body: '#9eaabb', belly: '#d4dde8', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#7a8fa8', eye: '#2d1b0e' },
  black:  { body: '#2c2c3e', belly: '#4a4a62', ear: '#c5b4e3', nose: '#f4a7b9', stripe: null,      eye: '#f5f5f5' },
  white:  { body: '#f0ece8', belly: '#ffffff', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#ddd5cc', eye: '#2d1b0e' },
  brown:  { body: '#8b5e3c', belly: '#c4956a', ear: '#f4a7b9', nose: '#c96a2a', stripe: '#6b4228', eye: '#2d1b0e' },
  pink:   { body: '#f4a7b9', belly: '#ffd6e0', ear: '#ff8fa8', nose: '#e8607a', stripe: '#e8899e', eye: '#5c2a3a' },
} as const;

export const STRETCH_MESSAGES = [
  (name: string) => `Hey ${name}! Time to stretch! 🧘`,
  (name: string) => `${name}, stand up and shake it out! 🕺`,
  (name: string) => `Roll your shoulders, ${name}! 💪`,
  (name: string) => `Look away from the screen for 20s, ${name}! 👀`,
  (name: string) => `Deep breath, ${name}! You've got this! 😮‍💨`,
  (name: string) => `${name}, your back will thank you later! 🌟`,
];

export const IDLE_MESSAGES = [
  'zzz... purr...',
  '*sleeping soundly*',
  'meow... zzzz...',
];

export const GREETING_MESSAGES = [
  (name: string) => `Welcome back, ${name}! meow~ ♡`,
  (name: string) => `${name}! You're here! *purring intensifies*`,
  (name: string) => `nyaa~ hello ${name}!`,
];

export const OVERHEAT_MESSAGES = [
  'too... fast... overheating... 🔥',
  'keyboard goes brrrrr 💨',
  'steam coming out of ears! 😤',
];

export const AI_THINK_MESSAGES = [
  'hmm... thinking along... 🤔',
  '*concentrated face* ...',
  'ooh ooh what is Claude doing? 👀',
];

export const AI_DONE_MESSAGES = [
  (name: string) => `Claude is done, ${name}! 🎉`,
  (name: string) => `Yay! Task complete! ♡ ${name}`,
  (name: string) => `Go check your screen, ${name}! ✨`,
];
