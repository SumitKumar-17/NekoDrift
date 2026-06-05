import { CatSettings, CatColor, CatPattern } from '../../shared/types';

declare global {
  interface Window {
    nekodrift: {
      getSettings: () => Promise<CatSettings>;
      saveSettings: (s: Partial<CatSettings>) => Promise<CatSettings>;
      dismissStretch: () => void;
      snoozeStretch: (min: number) => void;
      openSettings: () => void;
      quit: () => void;
      onboardingDone: (s: Partial<CatSettings>) => void;
      setIgnoreMouse: (ignore: boolean) => void;
      dragCat: (dx: number, dy: number) => void;
      pomodoroControl: (action: 'start' | 'pause' | 'reset') => void;
      onCatSettings: (cb: (s: CatSettings) => void) => void;
      onCatSpeech: (cb: (msg: string | null) => void) => void;
      onStretchReminder: (cb: (msg: string) => void) => void;
      onIdleChanged: (cb: (isIdle: boolean) => void) => void;
      onTypingChanged: (cb: (isTyping: boolean) => void) => void;
      onMouseVelocity: (cb: (vel: number) => void) => void;
      onEyeDir: (cb: (dir: { dx: number; dy: number }) => void) => void;
      onPomodoroState: (cb: (s: { mode: string; remainingMs: number; session: number }) => void) => void;
      onAiState: (cb: (s: { thinking: boolean; done: boolean }) => void) => void;
      onScrollEvent: (cb: () => void) => void;
      onReminderTrigger: (cb: (msg: string) => void) => void;
    };
  }
}

const SIZE_LABELS: Record<number, string> = {
  1: 'Small (1×)',
  2: 'Medium (2×)',
  3: 'Large (3×)',
};

const CLAUDE_HOOKS_CONFIG = `{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-thinking 2>/dev/null || true"
      }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-done 2>/dev/null || true"
      }]
    }]
  }
}`;

let currentColor: CatColor = 'orange';
let currentPattern: CatPattern = 'none';

async function init() {
  const settings = await window.nekodrift.getSettings();

  // Populate identity
  (document.getElementById('input-name') as HTMLInputElement).value = settings.name;
  (document.getElementById('input-cat-name') as HTMLInputElement).value = settings.catName;

  // Appearance
  currentColor = settings.color;
  currentPattern = settings.pattern || 'none';
  updateSwatches();
  updatePatternChips();
  (document.getElementById('input-size') as HTMLInputElement).value = String(settings.size);
  (document.getElementById('size-label') as HTMLElement).textContent = SIZE_LABELS[settings.size];

  // Stretch
  (document.getElementById('toggle-stretch') as HTMLInputElement).checked = settings.stretchEnabled;
  (document.getElementById('input-interval') as HTMLInputElement).value = String(settings.stretchIntervalMin);

  // Pomodoro
  (document.getElementById('toggle-pomodoro') as HTMLInputElement).checked = settings.pomodoroEnabled;
  (document.getElementById('input-pomo-focus') as HTMLInputElement).value = String(settings.pomodoroFocusMin);
  (document.getElementById('input-pomo-break') as HTMLInputElement).value = String(settings.pomodoroBreakMin);

  // Fixed message
  (document.getElementById('toggle-fixed-msg') as HTMLInputElement).checked = settings.fixedMessageEnabled;
  (document.getElementById('input-fixed-msg') as HTMLInputElement).value = settings.fixedMessage || '';

  // Daily reminder
  (document.getElementById('toggle-reminder') as HTMLInputElement).checked = settings.reminderEnabled;
  (document.getElementById('input-reminder-hour') as HTMLInputElement).value = String(settings.reminderHour ?? 15);
  (document.getElementById('input-reminder-min') as HTMLInputElement).value = String(settings.reminderMinute ?? 0);
  (document.getElementById('input-reminder-msg') as HTMLInputElement).value = settings.reminderMessage || '';

  // Claude integration
  (document.getElementById('toggle-claude') as HTMLInputElement).checked = settings.claudeIntegration ?? true;

  // System
  (document.getElementById('toggle-ontop') as HTMLInputElement).checked = settings.alwaysOnTop;
  (document.getElementById('toggle-login') as HTMLInputElement).checked = settings.startOnLogin;
  (document.getElementById('toggle-sound') as HTMLInputElement).checked = settings.soundEnabled;

  // ── Swatch click ──
  document.querySelectorAll('.swatch').forEach((el) => {
    el.addEventListener('click', () => {
      currentColor = (el as HTMLElement).dataset.color as CatColor;
      updateSwatches();
    });
  });

  // ── Pattern chip click ──
  document.querySelectorAll('.pattern-chip').forEach((el) => {
    el.addEventListener('click', () => {
      currentPattern = (el as HTMLElement).dataset.pattern as CatPattern;
      updatePatternChips();
    });
  });

  // ── Size slider ──
  const sizeInput = document.getElementById('input-size') as HTMLInputElement;
  sizeInput.addEventListener('input', () => {
    (document.getElementById('size-label') as HTMLElement).textContent =
      SIZE_LABELS[Number(sizeInput.value)];
  });

  // ── Pomodoro controls ──
  document.getElementById('btn-pomo-start')!.addEventListener('click', () =>
    window.nekodrift.pomodoroControl('start'));
  document.getElementById('btn-pomo-pause')!.addEventListener('click', () =>
    window.nekodrift.pomodoroControl('pause'));
  document.getElementById('btn-pomo-reset')!.addEventListener('click', () =>
    window.nekodrift.pomodoroControl('reset'));

  // ── Copy Claude hooks config ──
  document.getElementById('btn-copy-hooks')!.addEventListener('click', () => {
    navigator.clipboard.writeText(CLAUDE_HOOKS_CONFIG).then(() => {
      const btn = document.getElementById('btn-copy-hooks')!;
      btn.textContent = 'Copied! ✓';
      setTimeout(() => { btn.textContent = 'Copy config'; }, 2000);
    });
  });

  // ── Save ──
  document.getElementById('btn-save')!.addEventListener('click', async () => {
    const updated: Partial<CatSettings> = {
      name: (document.getElementById('input-name') as HTMLInputElement).value.trim() || 'hooman',
      catName: (document.getElementById('input-cat-name') as HTMLInputElement).value.trim() || 'NekoDrift',
      color: currentColor,
      pattern: currentPattern,
      size: Number((document.getElementById('input-size') as HTMLInputElement).value),
      stretchEnabled: (document.getElementById('toggle-stretch') as HTMLInputElement).checked,
      stretchIntervalMin: Number((document.getElementById('input-interval') as HTMLInputElement).value),
      pomodoroEnabled: (document.getElementById('toggle-pomodoro') as HTMLInputElement).checked,
      pomodoroFocusMin: Number((document.getElementById('input-pomo-focus') as HTMLInputElement).value),
      pomodoroBreakMin: Number((document.getElementById('input-pomo-break') as HTMLInputElement).value),
      fixedMessageEnabled: (document.getElementById('toggle-fixed-msg') as HTMLInputElement).checked,
      fixedMessage: (document.getElementById('input-fixed-msg') as HTMLInputElement).value.trim(),
      reminderEnabled: (document.getElementById('toggle-reminder') as HTMLInputElement).checked,
      reminderHour: Number((document.getElementById('input-reminder-hour') as HTMLInputElement).value),
      reminderMinute: Number((document.getElementById('input-reminder-min') as HTMLInputElement).value),
      reminderMessage: (document.getElementById('input-reminder-msg') as HTMLInputElement).value.trim() || 'Hey! Check in time! 🐱',
      claudeIntegration: (document.getElementById('toggle-claude') as HTMLInputElement).checked,
      alwaysOnTop: (document.getElementById('toggle-ontop') as HTMLInputElement).checked,
      startOnLogin: (document.getElementById('toggle-login') as HTMLInputElement).checked,
      soundEnabled: (document.getElementById('toggle-sound') as HTMLInputElement).checked,
    };

    await window.nekodrift.saveSettings(updated);

    const msg = document.getElementById('saved-msg')!;
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2500);
  });
}

function updateSwatches() {
  document.querySelectorAll('.swatch').forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.color === currentColor);
  });
}

function updatePatternChips() {
  document.querySelectorAll('.pattern-chip').forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.pattern === currentPattern);
  });
}

init();
