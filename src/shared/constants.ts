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
  dndEnabled: false,
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
  // iris: true eye color visible in the iris ring around the pupil
  orange: { body: '#e8894a', belly: '#f9c89b', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#c96a2a', eye: '#2d1b0e', iris: '#22b030' },
  gray:   { body: '#9eaabb', belly: '#d4dde8', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#7a8fa8', eye: '#2d1b0e', iris: '#4a88d8' },
  black:  { body: '#2c2c3e', belly: '#4a4a62', ear: '#c5b4e3', nose: '#f4a7b9', stripe: null,      eye: '#f5f5f5', iris: '#d4c018' },
  white:  { body: '#f0ece8', belly: '#ffffff', ear: '#f4a7b9', nose: '#f4a7b9', stripe: '#ddd5cc', eye: '#2d1b0e', iris: '#3c80d0' },
  brown:  { body: '#8b5e3c', belly: '#c4956a', ear: '#f4a7b9', nose: '#c96a2a', stripe: '#6b4228', eye: '#2d1b0e', iris: '#c88020' },
  pink:   { body: '#f4a7b9', belly: '#ffd6e0', ear: '#ff8fa8', nose: '#e8607a', stripe: '#e8899e', eye: '#5c2a3a', iris: '#8880d8' },
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
  '*dreaming of fish* 🐟',
  'purrrr... do not disturb...',
  '*curls into a perfect circle*',
  'nap time ♡ wake me when snacks',
  '...zzzZZZ...',
];

export const GREETING_MESSAGES = [
  (name: string) => `Welcome back, ${name}! meow~ ♡`,
  (name: string) => `${name}! You're here! *purring intensifies*`,
  (name: string) => `nyaa~ hello ${name}!`,
  (name: string) => `${name}! I missed you so much! 🥰`,
  (name: string) => `oh! you're back! *stretches dramatically* hi ${name}!`,
  (name: string) => `mrrrow~ good to see you, ${name}! ♡`,
  (name: string) => `*yawns and blinks* oh! ${name}! you woke me!`,
  (name: string) => `there you are, ${name}! I was just... not waiting. nope.`,
];

export const OVERHEAT_MESSAGES = [
  'too... fast... overheating... 🔥',
  'keyboard goes brrrrr 💨',
  'steam coming out of ears! 😤',
  'my paws can\'t keep up!! 🐾',
  'you type like the keyboard owes you money',
  'ERROR: cat.exe is running too hot 🔥',
];

export const AI_THINK_MESSAGES = [
  'hmm... thinking along... 🤔',
  '*concentrated face* ...',
  'ooh ooh what is Claude doing? 👀',
  'shhh... big brain moment happening',
  'Claude is thinking... I can feel it 🧠',
  '*watches screen intensely*',
];

export const AI_DONE_MESSAGES = [
  (name: string) => `Claude is done, ${name}! 🎉`,
  (name: string) => `Yay! Task complete! ♡ ${name}`,
  (name: string) => `Go check your screen, ${name}! ✨`,
  (name: string) => `*happy dance* Claude did the thing! ${name}! 🎊`,
  (name: string) => `done done done!! check it, ${name}! 🐾`,
  (name: string) => `ooh looks like something finished! ${name}!`,
];

export const BOOT_MESSAGES = [
  (catName: string) => `meow! i'm ${catName}! ♡`,
  (catName: string) => `nyaa~ ${catName} reporting for duty! 🐾`,
  (catName: string) => `*stretches* hi!! i'm ${catName}!`,
  (catName: string) => `${catName} has arrived! pet me immediately ♡`,
  (catName: string) => `mrrrow! ${catName} online! ready to supervise! 🐱`,
];

export const STRETCH_DONE_MESSAGES = [
  (name: string) => `good stretch! ♡ keep it up, ${name}!`,
  (name: string) => `yayyy! your body thanks you, ${name}! 🌟`,
  (name: string) => `proud of you, ${name}! stretch complete! ♡`,
  (name: string) => `nice one! ${name}, your back will love this 💪`,
];

export const STRETCH_SNOOZE_MESSAGES = [
  'ok, 5 more mins... 😴',
  'fine fine, 5 mins. don\'t forget! 🐾',
  '*sighs* ok, snoozing... for now 😒',
  'just 5 more mins! promise me! ♡',
];

export const CAT_RANDOM_THOUGHTS = [
  '*stares into the void*',
  'what if... birds? 🐦',
  '*pretends not to notice you*',
  'meow? meow. meow! 🐾',
  '...is that a snack I smell? 👀',
  '*judges you silently*',
  'I wonder if I\'m a good cat... (I am)',
  '*yawns dramatically*',
  'do you ever just... stare at a wall? ...no? just me.',
];
