import { CatColor, CatAnimation, CatSettings, EyeDir, PomodoroState, AiState } from '../../shared/types';
import { drawCat, drawSpeechBubble, drawSteam, drawZzz, drawPomodoroTimer } from './pixel-cat';

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
      onCatSettings: (cb: (s: CatSettings) => void) => void;
      onCatSpeech: (cb: (msg: string | null) => void) => void;
      onStretchReminder: (cb: (msg: string) => void) => void;
      onIdleChanged: (cb: (isIdle: boolean) => void) => void;
      onTypingChanged: (cb: (isTyping: boolean) => void) => void;
      onMouseVelocity: (cb: (vel: number) => void) => void;
      onEyeDir: (cb: (dir: EyeDir) => void) => void;
      onPomodoroState: (cb: (s: PomodoroState) => void) => void;
      onAiState: (cb: (s: AiState) => void) => void;
      onScrollEvent: (cb: () => void) => void;
      onReminderTrigger: (cb: (msg: string) => void) => void;
      setIgnoreMouse: (ignore: boolean) => void;
      dragCat: (dx: number, dy: number) => void;
      pomodoroControl: (action: 'start' | 'pause' | 'reset') => void;
    };
  }
}

// ─── State ─────────────────────────────────────────────────────
let settings: CatSettings = {
  color: 'orange', pattern: 'none', name: 'hooman', catName: 'NekoDrift',
  stretchIntervalMin: 30, stretchEnabled: true, soundEnabled: false,
  size: 2, alwaysOnTop: true, showOnAllDesktops: true, startOnLogin: false,
  pomodoroEnabled: false, pomodoroFocusMin: 25, pomodoroBreakMin: 5,
  fixedMessage: '', fixedMessageEnabled: false,
  reminderEnabled: false, reminderMessage: '', reminderHour: 15, reminderMinute: 0,
  claudeIntegration: true,
};

let currentAnim: CatAnimation = 'idle';
let forcedAnim: CatAnimation | null = null;
let forcedAnimTimer: ReturnType<typeof setTimeout> | null = null;
let isIdle = false;
let isTyping = false;
let heatLevel = 0;
let speechText: string | null = null;
let speechTimer: ReturnType<typeof setTimeout> | null = null;
let isPinnedSpeech = false;
let eyeDir: EyeDir = { dx: 0, dy: 0 };
let pomodoroState: PomodoroState = { mode: 'idle', remainingMs: 0, session: 0 };
let frame = 0;

// Mochi drag
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isHoveringCat = false;

// ─── Canvas setup ──────────────────────────────────────────────
const canvas = document.getElementById('cat-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
  const scale = settings.size;
  const catPx = 16 * (scale * 4);
  const extra = 160;
  canvas.width = catPx + extra;
  canvas.height = catPx + extra;
  canvas.style.width = `${catPx + extra}px`;
  canvas.style.height = `${catPx + extra}px`;
}

// ─── Animation priority ────────────────────────────────────────
function getAnimation(): CatAnimation {
  if (forcedAnim) return forcedAnim;
  if (isIdle) return 'sleep';
  if (heatLevel >= 2) return 'overheat';
  if (isTyping) return 'type';
  return currentAnim;
}

function forceAnim(anim: CatAnimation, durationMs: number) {
  forcedAnim = anim;
  if (forcedAnimTimer) clearTimeout(forcedAnimTimer);
  forcedAnimTimer = setTimeout(() => { forcedAnim = null; }, durationMs);
}

// ─── Render loop ───────────────────────────────────────────────
function render() {
  const scale = settings.size * 4;
  const catSize = 16 * scale;
  const offsetX = 60;
  const offsetY = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const anim = getAnimation();

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawCat(ctx, {
    color: settings.color as CatColor,
    pattern: settings.pattern,
    animation: anim,
    frame,
    scale,
    eyeDir,
    heatLevel,
  });
  ctx.restore();

  // Steam for overheat
  if (anim === 'overheat' || heatLevel >= 2) {
    drawSteam(ctx, offsetX + catSize / 2, offsetY + 4, frame, scale / 4);
  }

  // Zzz for sleep
  if (anim === 'sleep') {
    drawZzz(ctx, offsetX + catSize - scale * 2, offsetY + scale * 2, frame, scale / 4);
  }

  // Pomodoro timer
  if (settings.pomodoroEnabled && pomodoroState.mode !== 'idle') {
    drawPomodoroTimer(
      ctx,
      offsetX + catSize / 2,
      offsetY - 32,
      pomodoroState.remainingMs,
      pomodoroState.mode,
      scale / 4
    );
  }

  // Fixed pinned message
  if (settings.fixedMessageEnabled && settings.fixedMessage && !speechText) {
    drawSpeechBubble(ctx, settings.fixedMessage, offsetX + catSize / 2, offsetY, scale, true);
  }

  // Speech bubble (transient)
  if (speechText) {
    drawSpeechBubble(ctx, speechText, offsetX + catSize / 2, offsetY, scale, false);
  }

  frame++;
  requestAnimationFrame(render);
}

// ─── Speech helpers ────────────────────────────────────────────
function showSpeech(text: string, durationMs = 3000) {
  isPinnedSpeech = false;
  speechText = text;
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => { speechText = null; }, durationMs);
}

// ─── Per-pixel hit test → toggle ignoreMouseEvents ────────────
function hitTestCat(clientX: number, clientY: number): boolean {
  const d = ctx.getImageData(clientX, clientY, 1, 1).data;
  return d[3] > 30; // alpha > 30/255 = over cat
}

function updateIgnoreMouse(x: number, y: number) {
  const over = hitTestCat(x, y);
  if (over !== isHoveringCat) {
    isHoveringCat = over;
    window.nekodrift.setIgnoreMouse(!over);
  }
}

// Pointer tracking on the canvas (receives events even when ignoreMouseEvents=true because forward:true)
canvas.addEventListener('pointermove', (e) => {
  updateIgnoreMouse(e.clientX, e.clientY);

  // Purring: cursor slow + over cat = purr
  const vel = Math.hypot(e.movementX, e.movementY);
  if (isHoveringCat && vel < 3 && !isIdle && !forcedAnim) {
    if (currentAnim !== 'purr') {
      currentAnim = 'purr';
      showSpeech('purr purr purr... ♡', 2000);
    }
  } else if (currentAnim === 'purr' && vel > 8) {
    currentAnim = 'idle';
  }

  // Mochi drag
  if (isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    window.nekodrift.dragCat(dx, dy);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
});

canvas.addEventListener('pointerdown', (e) => {
  if (!isHoveringCat) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  forceAnim('surprised', 200);
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', () => {
  if (isDragging) {
    isDragging = false;
    // Spring release: quick happy bounce
    forceAnim('jump', 800);
    setTimeout(() => { forceAnim('happy', 1000); }, 800);
  }
});

canvas.addEventListener('pointerleave', () => {
  if (currentAnim === 'purr') currentAnim = 'idle';
  if (!isDragging) {
    isHoveringCat = false;
    window.nekodrift.setIgnoreMouse(true);
  }
});

// ─── Stretch banner ────────────────────────────────────────────
const stretchBanner = document.getElementById('stretch-banner')!;
const stretchMsg = document.getElementById('stretch-msg')!;
const btnDismiss = document.getElementById('btn-dismiss')!;
const btnSnooze = document.getElementById('btn-snooze')!;

btnDismiss.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.dismissStretch();
  showSpeech('yay, good job! ♡', 2000);
  forceAnim('happy', 3000);
});

btnSnooze.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.snoozeStretch(5);
  showSpeech('ok, 5 more mins... 😴', 2000);
});

// ─── IPC listeners ─────────────────────────────────────────────
window.nekodrift.onCatSettings((s) => {
  settings = s;
  resize();
  // Update alwaysOnTop is handled by main
});

window.nekodrift.onCatSpeech((msg) => {
  if (msg) showSpeech(msg, 4000);
  else speechText = null;
});

window.nekodrift.onStretchReminder((msg) => {
  stretchMsg.textContent = msg;
  stretchBanner.classList.add('visible');
  forceAnim('stretch', 5000);
});

window.nekodrift.onIdleChanged((idle) => {
  isIdle = idle;
  if (!idle) {
    forceAnim('happy', 3000);
  }
});

window.nekodrift.onTypingChanged((typing) => {
  isTyping = typing;
  // Typing → slowly increase heat
  if (typing) {
    heatLevel = Math.min(3, heatLevel + 0.5);
  } else {
    heatLevel = Math.max(0, heatLevel - 1);
  }
});

window.nekodrift.onMouseVelocity((vel) => {
  if (vel > 300 && !isIdle && !forcedAnim) {
    forceAnim('hunt', 2000);
  }
});

window.nekodrift.onEyeDir((dir) => {
  eyeDir = dir;
});

window.nekodrift.onPomodoroState((s) => {
  const prev = pomodoroState;
  pomodoroState = s;
  if (prev.mode === 'focus' && s.mode === 'break') {
    forceAnim('happy', 2000);
    showSpeech('break time! take a breather ♡', 4000);
  } else if (prev.mode === 'break' && s.mode === 'focus') {
    forceAnim('surprised', 1000);
    showSpeech(`focus time! let's go ${settings.name}! 🍅`, 3000);
  }
});

window.nekodrift.onAiState((s) => {
  if (s.thinking) {
    forcedAnim = 'think'; // hold until done — no timer
    if (forcedAnimTimer) { clearTimeout(forcedAnimTimer); forcedAnimTimer = null; }
    showSpeech('hmm... thinking along... 🤔', 30000);
  } else if (s.done) {
    forcedAnim = null;
    forceAnim('jump', 1500);
    setTimeout(() => { forceAnim('happy', 2000); }, 1500);
    showSpeech(`Claude is done, ${settings.name}! ✨`, 4000);
  }
});

window.nekodrift.onScrollEvent(() => {
  if (!isIdle && !forcedAnim) {
    forceAnim('paper', 2000);
  }
});

window.nekodrift.onReminderTrigger((msg) => {
  forceAnim('surprised', 1000);
  showSpeech(msg, 6000);
});

// ─── Heat decay (typing stops → cool down) ────────────────────
setInterval(() => {
  if (!isTyping && heatLevel > 0) {
    heatLevel = Math.max(0, heatLevel - 0.2);
  }
}, 2000);

// ─── Boot ──────────────────────────────────────────────────────
async function boot() {
  settings = await window.nekodrift.getSettings();
  resize();

  forceAnim('happy', 4000);
  showSpeech(`meow! i'm ${settings.catName}! ♡`, 4000);

  render();
}

boot();
