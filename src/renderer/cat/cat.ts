import { CatColor, CatAnimation, CatSettings, EyeDir, PomodoroState, AiState } from '../../shared/types';
import { drawCat, drawSpeechBubble, drawSteam, drawZzz, drawPomodoroTimer, drawHearts } from './pixel-cat';
import { SoundEngine } from './sound';
import { MoodSystem } from './mood';
import {
  OVERHEAT_MESSAGES, AI_THINK_MESSAGES, AI_DONE_MESSAGES,
  BOOT_MESSAGES, STRETCH_DONE_MESSAGES, STRETCH_SNOOZE_MESSAGES, CAT_RANDOM_THOUGHTS,
} from '../../shared/constants';

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
      onEyeDir: (cb: (dir: EyeDir) => void) => void;
      onPomodoroState: (cb: (s: PomodoroState) => void) => void;
      onAiState: (cb: (s: AiState) => void) => void;
      onScrollEvent: (cb: () => void) => void;
      onReminderTrigger: (cb: (msg: string) => void) => void;
      onShakeEvent: (cb: () => void) => void;
      onHeatLevel: (cb: (level: number) => void) => void;
    };
  }
}

const sound = new SoundEngine();
const mood = new MoodSystem();

// ─── State ─────────────────────────────────────────────────────
let settings: CatSettings = {
  color: 'orange', pattern: 'none', customPixels: '0'.repeat(256),
  name: 'hooman', catName: 'NekoDrift',
  stretchIntervalMin: 30, stretchEnabled: true, soundEnabled: false,
  size: 2, alwaysOnTop: true, showOnAllDesktops: true, startOnLogin: false,
  pomodoroEnabled: false, pomodoroFocusMin: 25, pomodoroBreakMin: 5,
  fixedMessage: '', fixedMessageEnabled: false,
  reminderEnabled: false, reminderMessage: '', reminderHour: 15, reminderMinute: 0,
  claudeIntegration: true,
  lockedPosition: false, stickyNote: '', stickyNoteEnabled: false,
  dndEnabled: false,
};

let currentAnim: CatAnimation = 'idle';
let forcedAnim: CatAnimation | null = null;
let forcedAnimTimer: ReturnType<typeof setTimeout> | null = null;
let isIdle = false;
let isTyping = false;
let heatLevel = 0;
let speechText: string | null = null;
let speechTimer: ReturnType<typeof setTimeout> | null = null;
let eyeDir: EyeDir = { dx: 0, dy: 0 };
let pomodoroState: PomodoroState = { mode: 'idle', remainingMs: 0, session: 0 };
let frame = 0;
let showHearts = false;
let heartsTimer: ReturnType<typeof setTimeout> | null = null;
let wobble = 0;
let wobbleDecay = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isHoveringCat = false;

// ─── Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('cat-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
  const scale = settings.size;
  const catPx = 16 * (scale * 4);
  const extra = 180;
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

function showHeartsBurst(durationMs = 2500) {
  showHearts = true;
  if (heartsTimer) clearTimeout(heartsTimer);
  heartsTimer = setTimeout(() => { showHearts = false; }, durationMs);
}

// ─── Render ────────────────────────────────────────────────────
function render() {
  const scale = settings.size * 4;
  const catSize = 16 * scale;
  const offsetX = 70;
  const offsetY = 90;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const anim = getAnimation();
  const catMood = mood.getMood();

  if (wobbleDecay && Math.abs(wobble) > 0.01) {
    wobble *= 0.82;
    if (Math.abs(wobble) < 0.02) { wobble = 0; wobbleDecay = false; }
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawCat(ctx, {
    color: settings.color as CatColor,
    pattern: settings.pattern,
    customPixels: settings.customPixels,
    animation: anim,
    frame,
    scale,
    eyeDir,
    heatLevel,
    wobble,
    mood: catMood,
  });
  ctx.restore();

  if (anim === 'overheat' || heatLevel >= 2) {
    drawSteam(ctx, offsetX + catSize / 2, offsetY + 4, frame, scale / 5);
  }

  if (anim === 'sleep') {
    drawZzz(ctx, offsetX + catSize - scale, offsetY + scale * 2, frame, scale / 5);
  }

  if (showHearts || anim === 'purr' || anim === 'happy') {
    drawHearts(ctx, offsetX + catSize / 2, offsetY - scale * 2, frame, scale / 5);
  }

  if (settings.pomodoroEnabled && pomodoroState.mode !== 'idle') {
    drawPomodoroTimer(
      ctx, offsetX + catSize / 2, offsetY - 42,
      pomodoroState.remainingMs, pomodoroState.mode, scale / 5,
    );
  }

  // Sticky note — pinned yellow bubble only while hovering (hidden if speech active)
  if (settings.stickyNoteEnabled && settings.stickyNote && isHoveringCat && !speechText) {
    drawSpeechBubble(ctx, settings.stickyNote, offsetX + catSize / 2, offsetY, scale, true);
  }

  // Fixed pinned message
  if (settings.fixedMessageEnabled && settings.fixedMessage && !speechText
    && !(settings.stickyNoteEnabled && isHoveringCat)) {
    drawSpeechBubble(ctx, settings.fixedMessage, offsetX + catSize / 2, offsetY, scale, true);
  }

  // Transient speech bubble
  if (speechText) {
    drawSpeechBubble(ctx, speechText, offsetX + catSize / 2, offsetY, scale, false);
  }

  frame++;
  requestAnimationFrame(render);
}

// ─── Speech ────────────────────────────────────────────────────
function showSpeech(text: string, durationMs = 3500) {
  speechText = text;
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => { speechText = null; }, durationMs);
}

// ─── Per-pixel hit test ────────────────────────────────────────
function hitTestCat(clientX: number, clientY: number): boolean {
  try {
    return ctx.getImageData(clientX, clientY, 1, 1).data[3] > 25;
  } catch (_) { return false; }
}

function updateIgnoreMouse(x: number, y: number) {
  const over = hitTestCat(x, y);
  if (over !== isHoveringCat) {
    isHoveringCat = over;
    window.nekodrift.setIgnoreMouse(!over);
  }
}

// ─── Pointer events ────────────────────────────────────────────
let lastPurr = 0;

canvas.addEventListener('pointermove', (e) => {
  updateIgnoreMouse(e.clientX, e.clientY);

  const vel = Math.hypot(e.movementX, e.movementY);

  if (isHoveringCat && vel < 3 && !isIdle && !forcedAnim) {
    if (currentAnim !== 'purr') {
      currentAnim = 'purr';
      showSpeech('purr purr purr... ♡', 2500);
      showHeartsBurst(2500);
      mood.onPet();
      const now = Date.now();
      if (sound.enabled && now - lastPurr > 1000) {
        sound.purr(0.9);
        lastPurr = now;
      }
    }
  } else if (currentAnim === 'purr' && vel > 10) {
    currentAnim = 'idle';
  }

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
  forceAnim('surprised', 250);
  sound.pop();
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', () => {
  if (isDragging) {
    isDragging = false;
    forceAnim('jump', 900);
    sound.meow();
    setTimeout(() => { forceAnim('happy', 1200); showHeartsBurst(1500); }, 900);
  }
});

canvas.addEventListener('pointerleave', () => {
  if (currentAnim === 'purr') currentAnim = 'idle';
  if (!isDragging) {
    isHoveringCat = false;
    window.nekodrift.setIgnoreMouse(true);
  }
});

canvas.addEventListener('contextmenu', (e) => {
  if (isHoveringCat) {
    e.preventDefault();
    window.nekodrift.showContextMenu();
  }
});

// ─── Stretch banner ────────────────────────────────────────────
const stretchBanner = document.getElementById('stretch-banner')!;
const stretchMsg = document.getElementById('stretch-msg')!;
document.getElementById('btn-dismiss')!.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.dismissStretch();
  mood.onStretchDone();
  const msg = STRETCH_DONE_MESSAGES[Math.floor(Math.random() * STRETCH_DONE_MESSAGES.length)];
  showSpeech(msg(settings.name), 2500);
  forceAnim('happy', 3000);
  showHeartsBurst(3000);
  sound.chime();
});
document.getElementById('btn-snooze')!.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.snoozeStretch(5);
  const msg = STRETCH_SNOOZE_MESSAGES[Math.floor(Math.random() * STRETCH_SNOOZE_MESSAGES.length)];
  showSpeech(msg, 2000);
});

// ─── IPC listeners ─────────────────────────────────────────────
window.nekodrift.onCatSettings((s) => {
  settings = s;
  sound.enabled = s.soundEnabled;
  resize();
});

window.nekodrift.onCatSpeech((msg) => {
  if (msg) showSpeech(msg, 4500);
  else speechText = null;
});

window.nekodrift.onStretchReminder((msg) => {
  stretchMsg.textContent = msg;
  stretchBanner.classList.add('visible');
  forceAnim('stretch', 5000);
  sound.alert();
});

window.nekodrift.onIdleChanged((idle) => {
  isIdle = idle;
  if (!idle) {
    forceAnim('happy', 3000);
    showHeartsBurst(2000);
    setTimeout(() => sound.chime(), 600);
  } else {
    // Cat settles to sleep with a soft purr
    setTimeout(() => sound.purr(1.8), 800);
  }
});

window.nekodrift.onTypingChanged((typing) => {
  isTyping = typing;
  if (typing) mood.onTyping();
  else heatLevel = Math.max(0, heatLevel - 0.8);
});

window.nekodrift.onHeatLevel((level) => {
  const prev = heatLevel;
  heatLevel = level;
  if (level >= 2 && prev < 2) {
    mood.onOverheat();
    showSpeech(OVERHEAT_MESSAGES[Math.floor(Math.random() * OVERHEAT_MESSAGES.length)], 3000);
  }
});

window.nekodrift.onMouseVelocity((vel) => {
  if (isIdle) return;
  if (vel > 300 && currentAnim !== 'hunt') {
    forceAnim('hunt', 2200);
  } else if (vel > 0 && !forcedAnim && !isTyping && currentAnim === 'idle') {
    currentAnim = 'walk';
  } else if (vel === 0 && currentAnim === 'walk') {
    currentAnim = 'idle';
  }
});

window.nekodrift.onEyeDir((dir) => {
  eyeDir = {
    dx: eyeDir.dx + (dir.dx - eyeDir.dx) * 0.25,
    dy: eyeDir.dy + (dir.dy - eyeDir.dy) * 0.25,
  };
});

window.nekodrift.onPomodoroState((s) => {
  const prev = pomodoroState;
  pomodoroState = s;
  if (prev.mode === 'focus' && s.mode === 'break') {
    forceAnim('happy', 2500);
    showHeartsBurst(2500);
    showSpeech(`break time! you earned it ♡ ${settings.name}`, 5000);
    sound.chime();
  } else if (prev.mode === 'break' && s.mode === 'focus') {
    forceAnim('surprised', 1200);
    showSpeech(`back to focus! let's go ${settings.name}! 🍅`, 3500);
    sound.alert();
  } else if (prev.mode !== 'idle' && s.mode === 'idle') {
    forceAnim('happy', 2000);
    showSpeech('all sessions done! great work! 🎉', 4000);
    sound.chime();
  }
});

window.nekodrift.onAiState((s) => {
  if (s.thinking) {
    forcedAnim = 'think';
    if (forcedAnimTimer) { clearTimeout(forcedAnimTimer); forcedAnimTimer = null; }
    const thinkMsg = AI_THINK_MESSAGES[Math.floor(Math.random() * AI_THINK_MESSAGES.length)];
    showSpeech(thinkMsg, 60_000);
  } else if (s.done) {
    forcedAnim = null;
    forceAnim('jump', 1600);
    showHeartsBurst(3000);
    setTimeout(() => { forceAnim('happy', 2500); }, 1600);
    sound.meow();
    const donePick = AI_DONE_MESSAGES[Math.floor(Math.random() * AI_DONE_MESSAGES.length)];
    showSpeech(donePick(settings.name), 5000);
  } else {
    if (forcedAnim === 'think') forcedAnim = null;
    if (speechText?.includes('thinking') || speechText?.includes('Claude') || speechText?.includes('ooh')) speechText = null;
  }
});

window.nekodrift.onScrollEvent(() => {
  if (!isIdle && currentAnim !== 'paper') forceAnim('paper', 2200);
});

window.nekodrift.onReminderTrigger((msg) => {
  forceAnim('surprised', 1200);
  setTimeout(() => { forceAnim('happy', 2000); }, 1200);
  showSpeech(msg, 7000);
  sound.meow();
});

window.nekodrift.onShakeEvent(() => {
  let dir = 1;
  let count = 0;
  const wobbleStep = () => {
    wobble = dir * 1.2;
    dir *= -0.8;
    count++;
    if (count < 8) setTimeout(wobbleStep, 60);
    else wobbleDecay = true;
  };
  wobbleStep();
  forceAnim('surprised', 800);
  sound.pop();
});

// ─── Heat decay ────────────────────────────────────────────────
setInterval(() => {
  if (!isTyping && heatLevel > 0) heatLevel = Math.max(0, heatLevel - 0.15);
}, 1500);

// ─── Idle behaviours ───────────────────────────────────────────
setInterval(() => {
  if (isIdle || forcedAnim || isTyping || currentAnim !== 'idle') return;
  const catMood = mood.getMood();
  const r = Math.random();
  if (r < 0.18) {
    if (catMood === 'lonely') showSpeech(`${settings.name}... pet me please... 🥺`, 4000);
    else if (catMood === 'happy') { forceAnim('happy', 1500); showHeartsBurst(1500); }
    else if (catMood === 'tired') showSpeech('...so tired... need nap... 😴', 3500);
  } else if (r < 0.35) {
    forceAnim('stretch', 3000);
  } else if (r < 0.45) {
    forceAnim('sit', 4500);
  } else if (r < 0.58) {
    const thought = CAT_RANDOM_THOUGHTS[Math.floor(Math.random() * CAT_RANDOM_THOUGHTS.length)];
    showSpeech(thought, 4000);
  } else if (r < 0.66) {
    forceAnim('purr', 2500);
    showSpeech('*self-grooming intensifies* 🐾', 2500);
  }
}, 45_000);

// ─── Boot ──────────────────────────────────────────────────────
async function boot() {
  settings = await window.nekodrift.getSettings();
  sound.enabled = settings.soundEnabled;
  resize();

  forceAnim('happy', 5000);
  showHeartsBurst(4000);
  const bootMsg = BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)];
  showSpeech(bootMsg(settings.catName), 4500);

  setTimeout(() => { if (sound.enabled) sound.meow(); }, 300);

  render();
}

boot();
