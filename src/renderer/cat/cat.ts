import { CatColor, CatAnimation, CatSettings } from '../../shared/types';
import { drawCat, drawSpeechBubble } from './pixel-cat';

declare global {
  interface Window {
    comnyang: {
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
    };
  }
}

// ─── State ────────────────────────────────────────────────────
let settings: CatSettings = {
  color: 'orange',
  name: 'hooman',
  catName: 'Comnyang',
  stretchIntervalMin: 30,
  stretchEnabled: true,
  soundEnabled: false,
  size: 2,
  alwaysOnTop: true,
  showOnAllDesktops: true,
  startOnLogin: false,
};

let currentAnim: CatAnimation = 'idle';
let isIdle = false;
let isTyping = false;
let speechText: string | null = null;
let speechTimer: ReturnType<typeof setTimeout> | null = null;
let frame = 0;

// ─── Canvas setup ────────────────────────────────────────────
const canvas = document.getElementById('cat-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
  const scale = settings.size;
  const catPx = 16 * (scale * 4);  // 16 grid cells * pixel scale
  const extra = 120;  // speech bubble room
  canvas.width = catPx + extra;
  canvas.height = catPx + extra;
  canvas.style.width = `${catPx + extra}px`;
  canvas.style.height = `${catPx + extra}px`;
}

// ─── Animation loop ──────────────────────────────────────────
function getAnimation(): CatAnimation {
  if (isIdle) return 'sleep';
  if (isTyping) return 'type';
  return currentAnim;
}

function render() {
  const scale = settings.size * 4;
  const catSize = 16 * scale;
  const offsetX = 60;  // center in canvas with room for speech bubble
  const offsetY = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save/restore for position
  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawCat(ctx, {
    color: settings.color as CatColor,
    animation: getAnimation(),
    frame,
    scale,
  });
  ctx.restore();

  // Speech bubble
  if (speechText) {
    drawSpeechBubble(
      ctx,
      speechText,
      offsetX + catSize / 2,
      offsetY,
      scale
    );
  }

  frame++;
  requestAnimationFrame(render);
}

// ─── Speech helpers ──────────────────────────────────────────
function showSpeech(text: string, durationMs = 3000) {
  speechText = text;
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    speechText = null;
  }, durationMs);
}

// ─── Stretch banner ──────────────────────────────────────────
const stretchBanner = document.getElementById('stretch-banner')!;
const stretchMsg = document.getElementById('stretch-msg')!;
const btnDismiss = document.getElementById('btn-dismiss')!;
const btnSnooze = document.getElementById('btn-snooze')!;

btnDismiss.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.comnyang.dismissStretch();
  showSpeech('yay, good job! ♡', 2000);
  currentAnim = 'happy';
  setTimeout(() => { currentAnim = 'idle'; }, 3000);
});

btnSnooze.addEventListener('click', () => {
  stretchBanner.classList.remove('visible');
  window.comnyang.snoozeStretch(5);
  showSpeech('ok, 5 more mins... 😴', 2000);
});

// ─── Context menu (right-click) ───────────────────────────────
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  // Show quick actions speech
  showSpeech('right-click → tray menu!', 2000);
});

// ─── IPC listeners ───────────────────────────────────────────
window.comnyang.onCatSettings((s) => {
  settings = s;
  resize();
});

window.comnyang.onCatSpeech((msg) => {
  if (msg) showSpeech(msg, 4000);
  else speechText = null;
});

window.comnyang.onStretchReminder((msg) => {
  stretchMsg.textContent = msg;
  stretchBanner.classList.add('visible');
  currentAnim = 'stretch';
  setTimeout(() => { currentAnim = 'idle'; }, 5000);
});

window.comnyang.onIdleChanged((idle) => {
  isIdle = idle;
  if (!idle) {
    currentAnim = 'happy';
    setTimeout(() => { currentAnim = 'idle'; }, 3000);
  }
});

window.comnyang.onTypingChanged((typing) => {
  isTyping = typing;
});

// ─── Boot ────────────────────────────────────────────────────
async function boot() {
  settings = await window.comnyang.getSettings();
  resize();

  // Intro animation
  currentAnim = 'happy';
  showSpeech(`meow! i'm ${settings.catName}! ♡`, 4000);
  setTimeout(() => { currentAnim = 'idle'; }, 4000);

  render();
}

boot();
