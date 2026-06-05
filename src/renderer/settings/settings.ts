import { CatSettings, CatColor, CatPattern } from '../../shared/types';
import { EDITOR_PALETTE, drawCatGhost } from '../cat/pixel-cat';

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

// ─── Pixel Pattern Editor ─────────────────────────────────────
const CELL = 12; // px per grid cell — 12 × 16 = 192px canvas

class PatternEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixels: number[]; // 256 values (16×16), index into EDITOR_PALETTE
  private selectedIdx = 0;  // 0 = eraser
  private painting = false;

  constructor() {
    this.canvas = document.getElementById('pattern-editor-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.pixels = new Array(256).fill(0);
    this.setupEvents();
    this.render();
  }

  load(pixelStr: string) {
    this.pixels = new Array(256).fill(0);
    for (let i = 0; i < Math.min(256, pixelStr.length); i++) {
      this.pixels[i] = parseInt(pixelStr[i], 10) || 0;
    }
    this.render();
  }

  export(): string {
    return this.pixels.map(v => v.toString()).join('');
  }

  clear() {
    this.pixels.fill(0);
    this.render();
  }

  setColor(idx: number) {
    this.selectedIdx = idx;
    document.querySelectorAll('.pal-swatch').forEach(el => {
      el.classList.toggle('active', Number((el as HTMLElement).dataset.idx) === idx);
    });
  }

  private cellAt(clientX: number, clientY: number): { gx: number; gy: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    if (gx < 0 || gx >= 16 || gy < 0 || gy >= 16) return null;
    return { gx, gy };
  }

  private paint(clientX: number, clientY: number, erase = false) {
    const cell = this.cellAt(clientX, clientY);
    if (!cell) return;
    this.pixels[cell.gy * 16 + cell.gx] = erase ? 0 : this.selectedIdx;
    this.render();
  }

  private setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.painting = true;
      this.paint(e.clientX, e.clientY, e.button === 2);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.painting) return;
      this.paint(e.clientX, e.clientY, e.buttons === 2);
    });
    this.canvas.addEventListener('mouseup', () => { this.painting = false; });
    this.canvas.addEventListener('mouseleave', () => { this.painting = false; });
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.paint(e.clientX, e.clientY, true);
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Ghost cat reference
    drawCatGhost(ctx, currentColor, CELL);

    // Painted pixels
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 256; i++) {
      const idx = this.pixels[i];
      if (!idx) continue;
      const color = EDITOR_PALETTE[idx];
      if (!color) continue;
      const gx = i % 16;
      const gy = Math.floor(i / 16);
      ctx.fillStyle = color;
      ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
    }

    // Grid overlay
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, 16 * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(16 * CELL, i * CELL);
      ctx.stroke();
    }
  }
}

let editor: PatternEditor;

async function init() {
  // Init pixel editor first (needs DOM ready)
  editor = new PatternEditor();

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

  // Load pixel pattern editor
  if (settings.customPixels && settings.customPixels.length === 256) {
    editor.load(settings.customPixels);
  }

  // Pixel editor controls
  document.querySelectorAll('.pal-swatch').forEach((el) => {
    el.addEventListener('click', () => editor.setColor(Number((el as HTMLElement).dataset.idx)));
  });
  document.getElementById('btn-editor-clear')!.addEventListener('click', () => editor.clear());
  document.getElementById('btn-editor-load-base')!.addEventListener('click', () => {
    editor.clear(); // reload ghost with current color
    editor.render();
  });
  document.getElementById('btn-editor-apply')!.addEventListener('click', async () => {
    const updated = await window.nekodrift.saveSettings({ customPixels: editor.export() });
    const btn = document.getElementById('btn-editor-apply')!;
    btn.textContent = 'Applied! ✓';
    setTimeout(() => { btn.textContent = 'Apply to cat ✓'; }, 2000);
  });

  // System
  (document.getElementById('toggle-ontop') as HTMLInputElement).checked = settings.alwaysOnTop;
  (document.getElementById('toggle-login') as HTMLInputElement).checked = settings.startOnLogin;
  (document.getElementById('toggle-sound') as HTMLInputElement).checked = settings.soundEnabled;

  // ── Swatch click ──
  document.querySelectorAll('.swatch').forEach((el) => {
    el.addEventListener('click', () => {
      currentColor = (el as HTMLElement).dataset.color as CatColor;
      updateSwatches();
      editor.render(); // refresh ghost reference
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
      customPixels: editor.export(),
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
