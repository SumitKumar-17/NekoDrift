import { CatSettings, CatColor, CatPattern } from '../../shared/types';
import { CAT_PRESETS } from '../../shared/constants';
import { EDITOR_PALETTE, drawCat, drawCatGhost } from '../cat/pixel-cat';

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
      showContextMenu: () => void;
      toggleLock: () => void;
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

const CLAUDE_HOOKS_CONFIG = `{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-thinking 2>/dev/null || true" }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-done 2>/dev/null || true" }]
    }]
  }
}`;

const SIZE_LABELS: Record<number, string> = { 1: 'Small (1×)', 2: 'Medium (2×)', 3: 'Large (3×)' };

let currentColor: CatColor = 'orange';
let currentPattern: CatPattern = 'none';

// ─── Pixel Pattern Editor ─────────────────────────────────────
const CELL = 12;

class PatternEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pixels: number[];
  private selectedIdx = 0;
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

  clear() { this.pixels.fill(0); this.render(); }

  setColor(idx: number) {
    this.selectedIdx = idx;
    document.querySelectorAll('.pal-swatch').forEach(el => {
      el.classList.toggle('active', Number((el as HTMLElement).dataset.idx) === idx);
    });
  }

  private cellAt(cx: number, cy: number) {
    const rect = this.canvas.getBoundingClientRect();
    const gx = Math.floor((cx - rect.left) / CELL);
    const gy = Math.floor((cy - rect.top) / CELL);
    if (gx < 0 || gx >= 16 || gy < 0 || gy >= 16) return null;
    return { gx, gy };
  }

  private paint(cx: number, cy: number, erase = false) {
    const cell = this.cellAt(cx, cy);
    if (!cell) return;
    this.pixels[cell.gy * 16 + cell.gx] = erase ? 0 : this.selectedIdx;
    this.render();
  }

  private setupEvents() {
    this.canvas.addEventListener('mousedown', e => { this.painting = true; this.paint(e.clientX, e.clientY, e.button === 2); });
    this.canvas.addEventListener('mousemove', e => { if (this.painting) this.paint(e.clientX, e.clientY, e.buttons === 2); });
    this.canvas.addEventListener('mouseup', () => { this.painting = false; });
    this.canvas.addEventListener('mouseleave', () => { this.painting = false; });
    this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this.paint(e.clientX, e.clientY, true); });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    drawCatGhost(ctx, currentColor, CELL);
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
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 16 * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(16 * CELL, i * CELL); ctx.stroke();
    }
  }
}

// ─── Breed preset preview canvases ────────────────────────────
function buildBreedGrid() {
  const grid = document.getElementById('breed-grid')!;
  grid.innerHTML = '';

  CAT_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'breed-btn';
    btn.dataset.id = preset.id;

    const cv = document.createElement('canvas');
    cv.className = 'breed-canvas';
    cv.width = 64;
    cv.height = 64;
    const bctx = cv.getContext('2d')!;
    drawCat(bctx, { color: preset.color, pattern: preset.pattern, animation: 'idle', frame: 30, scale: 4 });

    const lbl = document.createElement('div');
    lbl.className = 'breed-label';
    lbl.textContent = preset.label;

    btn.append(cv, lbl);
    btn.addEventListener('click', () => {
      currentColor = preset.color;
      currentPattern = preset.pattern;
      updateColorSwatches();
      updatePatternChips();
      updateBreedButtons(preset.id);
      editor.render();
    });
    grid.appendChild(btn);
  });
}

function updateBreedButtons(activeId?: string) {
  document.querySelectorAll('.breed-btn').forEach(el => {
    const btn = el as HTMLElement;
    const isActive = activeId
      ? btn.dataset.id === activeId
      : false;
    btn.classList.toggle('active', isActive);
  });
}

function updateColorSwatches() {
  document.querySelectorAll('.swatch').forEach(el => {
    el.classList.toggle('active', (el as HTMLElement).dataset.color === currentColor);
  });
}

function updatePatternChips() {
  document.querySelectorAll('.chip').forEach(el => {
    el.classList.toggle('active', (el as HTMLElement).dataset.pattern === currentPattern);
  });
}

// ─── Sidebar navigation ───────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const pageId = (el as HTMLElement).dataset.page!;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      document.getElementById(`page-${pageId}`)?.classList.add('active');
    });
  });
}

// ─── Toast ────────────────────────────────────────────────────
function showToast() {
  const t = document.getElementById('saved-toast')!;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ─── Collect all settings from form ──────────────────────────
function collectSettings(): Partial<CatSettings> {
  const v = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
  const checked = (id: string) => (document.getElementById(id) as HTMLInputElement).checked;
  return {
    name:               v('input-name').trim() || 'hooman',
    catName:            v('input-cat-name').trim() || 'NekoDrift',
    color:              currentColor,
    pattern:            currentPattern,
    size:               Number(v('input-size')),
    soundEnabled:       checked('toggle-sound'),
    lockedPosition:     checked('toggle-lock'),
    stickyNoteEnabled:  checked('toggle-sticky'),
    stickyNote:         v('input-sticky-note').trim(),
    fixedMessageEnabled: checked('toggle-fixed-msg'),
    fixedMessage:       v('input-fixed-msg').trim(),
    stretchEnabled:     checked('toggle-stretch'),
    stretchIntervalMin: Number(v('input-interval')),
    pomodoroEnabled:    checked('toggle-pomodoro'),
    pomodoroFocusMin:   Number(v('input-pomo-focus')),
    pomodoroBreakMin:   Number(v('input-pomo-break')),
    reminderEnabled:    checked('toggle-reminder'),
    reminderHour:       Number(v('input-reminder-hour')),
    reminderMinute:     Number(v('input-reminder-min')),
    reminderMessage:    v('input-reminder-msg').trim() || 'Hey! Check in time!',
    claudeIntegration:  checked('toggle-claude'),
    alwaysOnTop:        checked('toggle-ontop'),
    startOnLogin:       checked('toggle-login'),
    customPixels:       editor.export(),
  };
}

let editor: PatternEditor;

async function init() {
  setupNav();
  buildBreedGrid();
  editor = new PatternEditor();

  const s = await window.nekodrift.getSettings();

  currentColor = s.color;
  currentPattern = s.pattern || 'none';
  updateColorSwatches();
  updatePatternChips();
  updateBreedButtons();
  if (s.customPixels?.length === 256) editor.load(s.customPixels);

  // Identity
  (document.getElementById('input-name') as HTMLInputElement).value = s.name;
  (document.getElementById('input-cat-name') as HTMLInputElement).value = s.catName;
  (document.getElementById('input-size') as HTMLInputElement).value = String(s.size);
  (document.getElementById('size-label') as HTMLElement).textContent = SIZE_LABELS[s.size];

  // Position
  (document.getElementById('toggle-lock') as HTMLInputElement).checked = s.lockedPosition ?? false;

  // Notes
  (document.getElementById('toggle-sticky') as HTMLInputElement).checked = s.stickyNoteEnabled ?? false;
  (document.getElementById('input-sticky-note') as HTMLInputElement).value = s.stickyNote || '';
  (document.getElementById('toggle-fixed-msg') as HTMLInputElement).checked = s.fixedMessageEnabled ?? false;
  (document.getElementById('input-fixed-msg') as HTMLInputElement).value = s.fixedMessage || '';

  // Timers
  (document.getElementById('toggle-stretch') as HTMLInputElement).checked = s.stretchEnabled;
  (document.getElementById('input-interval') as HTMLInputElement).value = String(s.stretchIntervalMin);
  (document.getElementById('toggle-pomodoro') as HTMLInputElement).checked = s.pomodoroEnabled;
  (document.getElementById('input-pomo-focus') as HTMLInputElement).value = String(s.pomodoroFocusMin);
  (document.getElementById('input-pomo-break') as HTMLInputElement).value = String(s.pomodoroBreakMin);
  (document.getElementById('toggle-reminder') as HTMLInputElement).checked = s.reminderEnabled;
  (document.getElementById('input-reminder-hour') as HTMLInputElement).value = String(s.reminderHour ?? 15);
  (document.getElementById('input-reminder-min') as HTMLInputElement).value = String(s.reminderMinute ?? 0);
  (document.getElementById('input-reminder-msg') as HTMLInputElement).value = s.reminderMessage || '';

  // Claude
  (document.getElementById('toggle-claude') as HTMLInputElement).checked = s.claudeIntegration ?? true;

  // System
  (document.getElementById('toggle-ontop') as HTMLInputElement).checked = s.alwaysOnTop;
  (document.getElementById('toggle-login') as HTMLInputElement).checked = s.startOnLogin;
  (document.getElementById('toggle-sound') as HTMLInputElement).checked = s.soundEnabled;

  // Size slider label
  document.getElementById('input-size')!.addEventListener('input', (e) => {
    (document.getElementById('size-label') as HTMLElement).textContent =
      SIZE_LABELS[Number((e.target as HTMLInputElement).value)];
  });

  // Color swatches
  document.querySelectorAll('.swatch').forEach(el => {
    el.addEventListener('click', () => {
      currentColor = (el as HTMLElement).dataset.color as CatColor;
      updateColorSwatches();
      updateBreedButtons();
      editor.render();
    });
  });

  // Pattern chips
  document.querySelectorAll('.chip').forEach(el => {
    el.addEventListener('click', () => {
      currentPattern = (el as HTMLElement).dataset.pattern as CatPattern;
      updatePatternChips();
      updateBreedButtons();
    });
  });

  // Pixel editor palette
  document.querySelectorAll('.pal-swatch').forEach(el => {
    el.addEventListener('click', () => editor.setColor(Number((el as HTMLElement).dataset.idx)));
  });
  document.getElementById('btn-editor-clear')!.addEventListener('click', () => editor.clear());
  document.getElementById('btn-editor-load-base')!.addEventListener('click', () => { editor.clear(); editor.render(); });
  document.getElementById('btn-editor-apply')!.addEventListener('click', async () => {
    await window.nekodrift.saveSettings({ customPixels: editor.export() });
    showToast();
  });

  // Pomodoro controls
  document.getElementById('btn-pomo-start')!.addEventListener('click', () => window.nekodrift.pomodoroControl('start'));
  document.getElementById('btn-pomo-pause')!.addEventListener('click', () => window.nekodrift.pomodoroControl('pause'));
  document.getElementById('btn-pomo-reset')!.addEventListener('click', () => window.nekodrift.pomodoroControl('reset'));

  // Copy Claude hooks config
  document.getElementById('btn-copy-hooks')!.addEventListener('click', () => {
    navigator.clipboard.writeText(CLAUDE_HOOKS_CONFIG).then(() => {
      const btn = document.getElementById('btn-copy-hooks')!;
      const orig = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  });

  // Save buttons (all pages share the same logic)
  ['btn-save', 'btn-save-pos', 'btn-save-timers', 'btn-save-notes', 'btn-save-claude', 'btn-save-sys'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', async () => {
      await window.nekodrift.saveSettings(collectSettings());
      showToast();
    });
  });

  // ── Sprites tab (in settings) ────────────────────────────────
  initSpritesSection();
}

const SPRITE_META: Record<string, { emoji: string; name: string }> = {
  cat:     { emoji: '🐱', name: 'Cat' },
  pikachu: { emoji: '⚡', name: 'Pikachu' },
  eevee:   { emoji: '🦊', name: 'Eevee' },
  gengar:  { emoji: '👻', name: 'Gengar' },
  snorlax: { emoji: '😴', name: 'Snorlax' },
};

function initSpritesSection(): void {
  const api = window.nekodrift as any;
  const listEl = document.getElementById('settings-sprites-list');
  const grid   = document.getElementById('settings-sprites-grid');
  if (!listEl || !grid) return;

  async function refresh(): Promise<void> {
    const sprites = await api.listSprites();
    listEl!.innerHTML = '';
    if (!sprites.length) {
      listEl!.innerHTML = '<div style="padding:12px;color:#888;font-size:12px;text-align:center;">No sprites active</div>';
      return;
    }
    for (const s of sprites) {
      const meta = SPRITE_META[s.type] ?? { emoji: '?', name: s.type };
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <div class="row-left" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">${meta.emoji}</span>
          <div>
            <div class="row-label">${meta.name}</div>
            <div class="row-sub" style="font-family:monospace;">${s.id}</div>
          </div>
        </div>
        <button class="text-btn" data-id="${s.id}" style="color:#ff6b6b;border-color:rgba(255,107,107,0.3)">Remove</button>`;
      row.querySelector('button')!.addEventListener('click', async () => {
        await api.removeSprite(s.id);
        await refresh();
      });
      listEl!.appendChild(row);
    }
  }

  grid.innerHTML = '';
  for (const [type, meta] of Object.entries(SPRITE_META)) {
    const btn = document.createElement('button');
    btn.className = 'breed-btn';
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;';
    btn.innerHTML = `<span style="font-size:24px;">${meta.emoji}</span><span class="breed-label">${meta.name}</span>`;
    btn.addEventListener('click', async () => {
      await api.addSprite(type);
      await refresh();
    });
    grid.appendChild(btn);
  }

  document.getElementById('btn-open-manager')?.addEventListener('click', () => {
    api.openManager?.();
  });

  refresh();
}

init();
