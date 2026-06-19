import { CatColor, CatAnimation, CatSettings, EyeDir, PomodoroState, AiState } from '../../shared/types';
import { drawCat, drawSpeechBubble, drawSteam, drawZzz, drawPomodoroTimer, drawHearts, drawSparkles, drawCatGhost, drawSeasonalParticles } from './pixel-cat';
import { SoundEngine } from './sound';
import { MoodSystem } from './mood';
import {
  OVERHEAT_MESSAGES, AI_THINK_MESSAGES, AI_DONE_MESSAGES,
  BOOT_MESSAGES, STRETCH_DONE_MESSAGES, STRETCH_SNOOZE_MESSAGES, CAT_RANDOM_THOUGHTS,
  POMODORO_BREAK_MESSAGES, POMODORO_FOCUS_MESSAGES, POMODORO_DONE_MESSAGES, SHAKE_MESSAGES,
  TIME_OF_DAY_MESSAGES, RUN_MESSAGES, TYPING_MARATHON_MESSAGES, COFFEE_MESSAGES,
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
      pushCatStats: (stats: Record<string, unknown>) => void;
      onCatRemoteAction: (cb: (action: string) => void) => void;
      windowBounce: (heightPx: number) => void;
      getCatBounds: () => Promise<{ x: number; y: number; w: number; h: number; displayX: number; displayY: number; displayW: number; displayH: number } | null>;
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
let isAiSpeech = false;
let eyeDir: EyeDir = { dx: 0, dy: 0 };
let pomodoroState: PomodoroState = { mode: 'idle', remainingMs: 0, session: 0 };
let frame = 0;
let showHearts = false;
let heartsTimer: ReturnType<typeof setTimeout> | null = null;
let showSparklesBurst = false;
let sparklesTimer: ReturnType<typeof setTimeout> | null = null;
let wobble = 0;
let wobbleDecay = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isHoveringCat = false;
let catFacing = 1; // 1 = right (default), -1 = left

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

  if (anim === 'jump' && !settings.lockedPosition) {
    const jumpH = settings.size * 18;
    (window.nekodrift as any).windowBounce?.(jumpH);
  }
}

function showHeartsBurst(durationMs = 2500) {
  showHearts = true;
  if (heartsTimer) clearTimeout(heartsTimer);
  heartsTimer = setTimeout(() => { showHearts = false; }, durationMs);
}

function showSparkleEffect(durationMs = 1800) {
  showSparklesBurst = true;
  if (sparklesTimer) clearTimeout(sparklesTimer);
  sparklesTimer = setTimeout(() => { showSparklesBurst = false; }, durationMs);
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
  if (catFacing === -1) {
    ctx.translate(catSize, 0);
    ctx.scale(-1, 1);
  }
  drawCat(ctx, {
    color: settings.color as CatColor,
    pattern: settings.pattern,
    customPixels: settings.customPixels,
    animation: anim,
    frame,
    scale,
    eyeDir: catFacing === -1 ? { dx: -eyeDir.dx, dy: eyeDir.dy } : eyeDir,
    heatLevel,
    wobble,
    mood: catMood,
    hat: (settings as any).hat ?? 'none',
  });
  ctx.restore();

  if (anim === 'overheat' || heatLevel >= 2) {
    drawSteam(ctx, offsetX + catSize / 2, offsetY + 4, frame, scale / 5);
  }

  if (anim === 'sleep') {
    drawZzz(ctx, offsetX + catSize - scale, offsetY + scale * 2, frame, scale / 5);

    // Deep sleep ghost — floats up after 3 minutes idle
    const deepSleepMs = 3 * 60 * 1000;
    if (idleStartTime > 0 && Date.now() - idleStartTime > deepSleepMs) {
      const ghostY = offsetY - Math.sin(frame * 0.02) * scale * 2;
      ctx.save();
      ctx.translate(0, ghostY - offsetY - catSize * 0.6);
      drawCatGhost(ctx, settings.color as CatColor, scale / 5);
      ctx.restore();
    }
  }

  if (showHearts || anim === 'purr' || anim === 'happy') {
    drawHearts(ctx, offsetX + catSize / 2, offsetY - scale * 2, frame, scale / 5);
  }

  if (showSparklesBurst) {
    drawSparkles(ctx, offsetX + catSize / 2, offsetY + catSize / 3, frame, scale / 5);
  }

  // Seasonal ambient particles (snow, hearts, ghosts)
  drawSeasonalParticles(ctx, canvas.width, canvas.height, frame, scale / 5);

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
  tickWander();

  // Ambient purr: start when sitting/happy, stop when not
  const shouldPurr = settings.soundEnabled && (anim === 'sit' || anim === 'purr') && catMood !== 'tired';
  if (shouldPurr && frame % 30 === 0) sound.startAmbientPurr();
  else if (!shouldPurr && frame % 30 === 0) sound.stopAmbientPurr();

  requestAnimationFrame(render);
}

// ─── Speech ────────────────────────────────────────────────────
function showSpeech(text: string, durationMs = 3500, ai = false) {
  speechText = text;
  isAiSpeech = ai;
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => { speechText = null; isAiSpeech = false; }, durationMs);
}

// ─── Per-pixel hit test ────────────────────────────────────────
function hitTestCat(clientX: number, clientY: number): boolean {
  try {
    return ctx.getImageData(clientX, clientY, 1, 1).data[3] > 25;
  } catch (_) { return false; }
}

function isBannerVisible(): boolean {
  return stretchBanner.classList.contains('visible');
}

function updateIgnoreMouse(x: number, y: number) {
  // If stretch banner is visible, never go into click-through mode —
  // the user needs to click the Done/Snooze buttons.
  if (isBannerVisible()) {
    if (!isHoveringCat) { isHoveringCat = true; window.nekodrift.setIgnoreMouse(false); }
    return;
  }
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
    if (Math.abs(dx) > 2) catFacing = dx > 0 ? 1 : -1;
    window.nekodrift.dragCat(dx, dy);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
});

canvas.addEventListener('pointerdown', (e) => {
  if (!isHoveringCat) return;
  if (settings.lockedPosition) return;
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
  if (!isDragging && !isBannerVisible()) {
    isHoveringCat = false;
    window.nekodrift.setIgnoreMouse(true);
  }
});

canvas.addEventListener('dblclick', () => {
  if (!isHoveringCat) return;
  mood.onPet();
  forceAnim('happy', 1800);
  showHeartsBurst(1800);
  showSparkleEffect(1600);
  sound.meow();
  const petPhrases = ['♡ ♡ ♡', '*happy squeak*', 'nyaaa!! ♡', 'pet pet pet!! ♡'];
  showSpeech(petPhrases[Math.floor(Math.random() * petPhrases.length)], 1800);
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
function onBannerDismiss() {
  // After hiding the banner, re-evaluate mouse state so the window doesn't
  // remain non-click-through unnecessarily when the cat isn't under cursor.
  isHoveringCat = hitTestCat(0, 0); // will almost always be false (top-left is transparent)
  window.nekodrift.setIgnoreMouse(true);
}

document.getElementById('btn-dismiss')!.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.dismissStretch();
  mood.onStretchDone();
  const msg = STRETCH_DONE_MESSAGES[Math.floor(Math.random() * STRETCH_DONE_MESSAGES.length)];
  showSpeech(msg(settings.name), 2500);
  forceAnim('happy', 3000);
  showHeartsBurst(3000);
  sound.chime();
  onBannerDismiss();
});
document.getElementById('btn-snooze')!.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.nekodrift.snoozeStretch(5);
  const msg = STRETCH_SNOOZE_MESSAGES[Math.floor(Math.random() * STRETCH_SNOOZE_MESSAGES.length)];
  showSpeech(msg, 2000);
  onBannerDismiss();
});

// ─── IPC listeners ─────────────────────────────────────────────
window.nekodrift.onCatSettings((s) => {
  settings = s;
  sound.enabled = s.soundEnabled;
  sound.volume = (s.soundVolume ?? 70) / 100;
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

let idleStartTime = 0;
window.nekodrift.onIdleChanged((idle) => {
  const now = Date.now();
  isIdle = idle;
  if (!idle) {
    // Wake-up sequence: stretch → happy
    forceAnim('stretch', 2000);
    setTimeout(() => {
      forceAnim('happy', 2000);
      showHeartsBurst(2000);
    }, 2000);
    setTimeout(() => sound.chime(), 600);

    // If away ≥ 10 min, maybe sniff coffee; otherwise time-of-day greeting
    const awayMs = idleStartTime > 0 ? now - idleStartTime : 0;
    if (awayMs >= 10 * 60 * 1000 && Math.random() < 0.45) {
      const msg = COFFEE_MESSAGES[Math.floor(Math.random() * COFFEE_MESSAGES.length)];
      setTimeout(() => showSpeech(msg, 4000), 2200);
    } else {
      const greetKey = getTimeOfDayKey();
      const msgs = TIME_OF_DAY_MESSAGES[greetKey];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setTimeout(() => showSpeech(msg(settings.catName), 4000), 2200);
    }
  } else {
    // Cat settles to sleep with a soft purr
    idleStartTime = now;
    setTimeout(() => sound.purr(1.8), 800);
  }
});

window.nekodrift.onTypingChanged((typing) => {
  isTyping = typing;
  if (typing) {
    mood.onTyping();
    if (typingStartTime === 0) typingStartTime = Date.now();
  } else {
    heatLevel = Math.max(0, heatLevel - 0.8);
    typingStartTime = 0;
  }
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
  if (vel > 650 && currentAnim !== 'run') {
    currentAnim = 'run';
    if (Math.random() < 0.35) {
      const msg = RUN_MESSAGES[Math.floor(Math.random() * RUN_MESSAGES.length)];
      showSpeech(msg, 1800);
    }
  } else if (vel > 300 && currentAnim !== 'hunt' && currentAnim !== 'run') {
    forceAnim('hunt', 2200);
  } else if (vel > 0 && !forcedAnim && !isTyping && currentAnim === 'idle') {
    currentAnim = 'walk';
  } else if (vel === 0 && (currentAnim === 'walk' || currentAnim === 'run')) {
    currentAnim = 'idle';
  }
});

window.nekodrift.onEyeDir((dir) => {
  // Update facing direction when running/walking to follow the mouse
  if ((currentAnim === 'run' || currentAnim === 'walk') && Math.abs(dir.dx) > 0.3) {
    catFacing = dir.dx > 0 ? 1 : -1;
  }
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
    const msg = POMODORO_BREAK_MESSAGES[Math.floor(Math.random() * POMODORO_BREAK_MESSAGES.length)];
    showSpeech(msg(settings.name), 5000);
    sound.chime();
  } else if (prev.mode === 'break' && s.mode === 'focus') {
    forceAnim('surprised', 1200);
    const msg = POMODORO_FOCUS_MESSAGES[Math.floor(Math.random() * POMODORO_FOCUS_MESSAGES.length)];
    showSpeech(msg(settings.name), 3500);
    sound.alert();
  } else if (prev.mode !== 'idle' && s.mode === 'idle') {
    forceAnim('happy', 2000);
    const msg = POMODORO_DONE_MESSAGES[Math.floor(Math.random() * POMODORO_DONE_MESSAGES.length)];
    showSpeech(msg(settings.name), 4000);
    sound.chime();
  }
});

window.nekodrift.onAiState((s) => {
  if (s.thinking) {
    forcedAnim = 'think';
    if (forcedAnimTimer) { clearTimeout(forcedAnimTimer); forcedAnimTimer = null; }
    const thinkMsg = AI_THINK_MESSAGES[Math.floor(Math.random() * AI_THINK_MESSAGES.length)];
    showSpeech(thinkMsg, 60_000, true);
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
    if (isAiSpeech) { speechText = null; isAiSpeech = false; }
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
  if (Math.random() < 0.45) {
    const msg = SHAKE_MESSAGES[Math.floor(Math.random() * SHAKE_MESSAGES.length)];
    setTimeout(() => showSpeech(msg, 2500), 400);
  }
});

// ─── Heat decay ────────────────────────────────────────────────
setInterval(() => {
  if (!isTyping && heatLevel > 0) heatLevel = Math.max(0, heatLevel - 0.15);
}, 1500);

// ─── Typing marathon detector ──────────────────────────────────
let typingStartTime = 0;
let lastTypingMarathonAlert = 0;

setInterval(() => {
  if (!isTyping) { typingStartTime = 0; return; }
  if (typingStartTime === 0) typingStartTime = Date.now();

  const typingMinutes = (Date.now() - typingStartTime) / 60_000;
  const now = Date.now();

  // Alert every 20 mins of continuous typing
  if (typingMinutes >= 20 && now - lastTypingMarathonAlert > 20 * 60_000) {
    lastTypingMarathonAlert = now;
    const msgs = TYPING_MARATHON_MESSAGES;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    showSpeech(typeof msg === 'function' ? msg(settings.name) : msg, 5000);
  }
}, 30_000);

// ─── Idle behaviours ───────────────────────────────────────────
let lastIdleHour = -1;

function runIdleBehavior() {
  if (isIdle || forcedAnim || isTyping || currentAnim !== 'idle') return;
  const catMood = mood.getMood();
  const r = Math.random();

  if (r < 0.14) {
    if (catMood === 'lonely') { showSpeech(`${settings.name}... pet me please... 🥺`, 4000); }
    else if (catMood === 'happy') { forceAnim('happy', 1500); showHeartsBurst(1500); }
    else if (catMood === 'tired') showSpeech('...so tired... need nap... 😴', 3500);
    else { forceAnim('happy', 1200); }
  } else if (r < 0.28) {
    forceAnim('stretch', 3000);
  } else if (r < 0.38) {
    forceAnim('sit', 4500);
  } else if (r < 0.52) {
    const thought = CAT_RANDOM_THOUGHTS[Math.floor(Math.random() * CAT_RANDOM_THOUGHTS.length)];
    showSpeech(thought, 4000);
  } else if (r < 0.60) {
    forceAnim('purr', 2500);
    showSpeech('*self-grooming intensifies* 🐾', 2500);
  } else if (r < 0.68) {
    // Extra: jump then sit
    forceAnim('jump', 800);
    setTimeout(() => { forceAnim('sit', 3000); }, 800);
  }

  // Hourly time-of-day check-in
  const now = new Date();
  const hr = now.getHours();
  if (hr !== lastIdleHour && now.getMinutes() < 3) {
    lastIdleHour = hr;
    const todKey = getTimeOfDayKey();
    const msgs = TIME_OF_DAY_MESSAGES[todKey];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    setTimeout(() => showSpeech(msg(settings.catName), 4500), 2000);
  }
}

setInterval(runIdleBehavior, 40_000);

// ─── Lonely notification (once per session if unpetted for 5+ min) ──
let lonelySentThisSession = false;
setInterval(() => {
  if (lonelySentThisSession) return;
  if (mood.getMood() === 'lonely') {
    lonelySentThisSession = true;
    (window.nekodrift as any).pushCatStats?.({ __lonelyCry: true });
  }
}, 5 * 60_000);

// ─── Auto-wander ───────────────────────────────────────────────
// Cat occasionally walks to a new X position on screen
let wanderTarget: number | null = null;
let wanderDir = 1; // +1 right, -1 left
let isWandering = false;
let wanderCancelTime = 0;

async function startWander(): Promise<void> {
  if (isWandering || settings.lockedPosition || isIdle || forcedAnim) return;
  const bounds = await (window.nekodrift as any).getCatBounds?.();
  if (!bounds) return;
  const { x, w, displayX, displayW } = bounds;
  const margin = w * 0.2;
  const minX = displayX + margin;
  const maxX = displayX + displayW - w - margin;
  if (maxX <= minX) return;

  wanderTarget = minX + Math.random() * (maxX - minX);
  wanderDir = wanderTarget > x ? 1 : -1;
  catFacing = wanderDir;
  isWandering = true;
  wanderCancelTime = Date.now() + 8000; // max 8s walk
  currentAnim = 'walk';
}

function tickWander(): void {
  if (!isWandering) return;
  if (forcedAnim || isTyping || settings.lockedPosition || Date.now() > wanderCancelTime) {
    isWandering = false;
    wanderTarget = null;
    currentAnim = 'idle';
    return;
  }
  // Move 1px per tick at 60fps → smooth walk
  const speed = settings.size * 0.8;
  window.nekodrift.dragCat(wanderDir * speed, 0);
}

// Check wander arrival asynchronously every 200ms
setInterval(async () => {
  if (!isWandering || wanderTarget === null) return;
  const bounds = await (window.nekodrift as any).getCatBounds?.();
  if (!bounds) return;
  const dist = Math.abs(bounds.x - wanderTarget);
  if (dist < 6 || Date.now() > wanderCancelTime) {
    isWandering = false;
    wanderTarget = null;
    // React when arriving: 30% chance of a sit, 20% chance of a stretch
    const r = Math.random();
    if (r < 0.3) { currentAnim = 'sit'; setTimeout(() => { if (!forcedAnim) currentAnim = 'idle'; }, 3500); }
    else if (r < 0.5) { forceAnim('stretch', 2800); }
    else { currentAnim = 'idle'; }
    return;
  }
  // Edge collision check — if cat is near screen edge, turn around
  const margin = bounds.w * 0.15;
  if (bounds.x <= bounds.displayX + margin && wanderDir < 0) {
    catFacing = 1;
    wanderDir = 1;
    wanderTarget = bounds.displayX + bounds.displayW * 0.5;
    forceAnim('surprised', 600);
  } else if (bounds.x + bounds.w >= bounds.displayX + bounds.displayW - margin && wanderDir > 0) {
    catFacing = -1;
    wanderDir = -1;
    wanderTarget = bounds.displayX + bounds.displayW * 0.5;
    forceAnim('surprised', 600);
  }
}, 200);

// Trigger wander ~every 90s when not busy
setInterval(() => {
  if (!isIdle && !isTyping && !forcedAnim && Math.random() < 0.40) {
    startWander();
  }
}, 90_000);

// Secondary micro-behavior at shorter interval (subtle life signs when sitting)
setInterval(() => {
  if (isIdle || forcedAnim || isTyping || currentAnim !== 'idle') return;
  if (Math.random() < 0.12) {
    showSpeech('...', 1200);
  }
}, 18_000);

function getTimeOfDayKey(): keyof typeof TIME_OF_DAY_MESSAGES {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

// ─── Remote actions (from manager) ─────────────────────────────
(window.nekodrift as any).onCatRemoteAction?.((action: string) => {
  switch (action) {
    case 'pet':
      mood.onPet();
      forceAnim('happy', 2000);
      showHeartsBurst(2000);
      showSparkleEffect(1800);
      sound.meow();
      showSpeech('ooh ooh! pet! ♡', 2000);
      break;
    case 'jump':
      forceAnim('jump', 1200);
      setTimeout(() => forceAnim('happy', 1500), 1200);
      sound.chime();
      break;
    case 'stretch':
      forceAnim('stretch', 3000);
      showSpeech('ahhh~ stretching! 🧘', 2500);
      break;
    case 'surprise':
      forceAnim('surprised', 1200);
      sound.pop();
      break;
    case 'sleep':
      forceAnim('sleep', 5000);
      showSpeech('...zzz... 😴', 4000);
      break;
    case 'feed':
      mood.onFeed();
      forceAnim('happy', 2000);
      sound.chime();
      showSpeech('nom nom! 🍣', 2200);
      break;
  }
});

// ─── Stats push ────────────────────────────────────────────────
function pushStats(): void {
  const stats = mood.getStats();
  (window.nekodrift as any).pushCatStats({ ...stats, currentAnim });
}
setInterval(pushStats, 30_000);

// ─── Boot ──────────────────────────────────────────────────────
async function boot() {
  settings = await window.nekodrift.getSettings();
  sound.enabled = settings.soundEnabled;
  sound.volume = (settings.soundVolume ?? 70) / 100;
  resize();

  forceAnim('happy', 5000);
  showHeartsBurst(4000);
  const bootMsg = BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)];
  showSpeech(bootMsg(settings.catName), 4500);

  // Follow-up with a time-of-day greeting
  const todKey = getTimeOfDayKey();
  const todMsgs = TIME_OF_DAY_MESSAGES[todKey];
  const todMsg = todMsgs[Math.floor(Math.random() * todMsgs.length)];
  setTimeout(() => showSpeech(todMsg(settings.catName), 4000), 5000);

  setTimeout(() => { if (sound.enabled) sound.meow(); }, 300);
  setTimeout(pushStats, 3000);

  render();
}

boot();
