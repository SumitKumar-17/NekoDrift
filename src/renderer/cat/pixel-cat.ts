import { CatColor, CatPattern, CatAnimation, EyeDir } from '../../shared/types';
import { CAT_COLORS } from '../../shared/constants';

export interface DrawOptions {
  color: CatColor;
  pattern?: CatPattern;
  customPixels?: string;
  animation: CatAnimation;
  frame: number;
  scale: number;
  eyeDir?: EyeDir;
  heatLevel?: number;   // 0-3
  wobble?: number;      // -1 to 1, horizontal shake offset in grid units
  mood?: 'happy' | 'content' | 'tired' | 'lonely';
}

// 9-color editor palette (index 0 = transparent)
export const EDITOR_PALETTE = [
  null,        // 0 transparent
  '#1a1a2e',   // 1 dark
  '#4a4a62',   // 2 mid-dark
  '#9eaabb',   // 3 gray
  '#e8894a',   // 4 orange
  '#8b5e3c',   // 5 brown
  '#f0ece8',   // 6 cream
  '#f4a7b9',   // 7 pink
  '#f4c06a',   // 8 gold
  '#2a9d8a',   // 9 teal
];

export function drawCat(ctx: CanvasRenderingContext2D, opts: DrawOptions): void {
  const {
    color, animation, frame, scale,
    eyeDir, heatLevel = 0, pattern = 'none',
    customPixels = '', wobble = 0,
    mood = 'content',
  } = opts;
  const pal = CAT_COLORS[color];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = false;

  // Wobble offset (for shake animation)
  const wobbleOff = Math.round(wobble * 2);

  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    if (!c) return;
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = c;
    ctx.fillRect((x + wobbleOff) * scale, y * scale, w * scale, h * scale);
    ctx.globalAlpha = 1;
  };

  const line = (x1: number, y1: number, x2: number, y2: number, c: string, a = 0.6) => {
    ctx.globalAlpha = a;
    ctx.strokeStyle = c;
    ctx.lineWidth = scale * 0.5;
    ctx.beginPath();
    ctx.moveTo((x1 + wobbleOff) * scale, y1 * scale);
    ctx.lineTo((x2 + wobbleOff) * scale, y2 * scale);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const t = frame;
  let bobY = 0;
  let tailSwing = 0;
  let blinkOpen = true;
  let legOffset = 0;
  let bodySquish = 1;

  // Mood modifiers
  const moodTailMult = mood === 'happy' ? 1.4 : mood === 'lonely' ? 0.5 : 1;
  const moodBlinkRate = mood === 'tired' ? 60 : mood === 'happy' ? 220 : 180;

  switch (animation) {
    case 'idle':
      bobY = Math.sin(t * 0.04) * (mood === 'tired' ? 0.6 : 0.35);
      tailSwing = Math.sin(t * 0.06) * 15 * moodTailMult;
      blinkOpen = !((t % moodBlinkRate) > (moodBlinkRate - 10));
      break;

    case 'walk':
    case 'run': {
      const speed = animation === 'run' ? 0.25 : 0.15;
      bobY = Math.abs(Math.sin(t * speed)) * 0.6;
      tailSwing = Math.sin(t * speed * 2) * 20 * moodTailMult;
      legOffset = Math.sin(t * speed) * 2;
      break;
    }

    case 'type': {
      // Kneading: rhythmic paw-press, content tail, half-closed eyes
      bobY = Math.sin(t * 0.18) * 0.4;
      tailSwing = Math.sin(t * 0.14) * 22;
      blinkOpen = !((t % 70) > 55); // dreamy slow blink while kneading
      break;
    }

    case 'hunt':
      bobY = 2 + Math.abs(Math.sin(t * 0.3)) * 0.5;
      tailSwing = Math.sin(t * 0.08) * 5;
      legOffset = Math.sin(t * 0.4) * 1.5;
      blinkOpen = !((t % 60) > 55);
      break;

    case 'purr':
      bobY = Math.sin(t * 0.06) * 0.3;
      tailSwing = Math.sin(t * 0.08) * 22 * moodTailMult;
      blinkOpen = !((t % 90) > 75);
      break;

    case 'overheat':
      bobY = Math.sin(t * 0.35) * 0.6;
      tailSwing = Math.sin(t * 0.4) * 12;
      legOffset = Math.sin(t * 0.5) * 1;
      break;

    case 'paper':
      bobY = Math.sin(t * 0.08) * 0.3;
      tailSwing = Math.sin(t * 0.12) * 14;
      break;

    case 'think':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.04) * 8;
      blinkOpen = !((t % 120) > 105);
      break;

    case 'jump':
      bobY = -Math.abs(Math.sin(t * 0.2)) * 3.5;
      tailSwing = Math.sin(t * 0.4) * 30;
      bodySquish = 0.85 + Math.abs(Math.sin(t * 0.2)) * 0.22;
      break;

    case 'sit':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.05) * 12 * moodTailMult;
      blinkOpen = !((t % moodBlinkRate) > (moodBlinkRate - 10));
      break;

    case 'sleep':
      bobY = Math.sin(t * 0.02) * 0.3;
      blinkOpen = false;
      break;

    case 'stretch':
      tailSwing = Math.sin(t * 0.05) * 5;
      blinkOpen = !((t % 200) > 195);
      break;

    case 'happy':
      bobY = Math.abs(Math.sin(t * 0.22)) * 1.8;
      tailSwing = Math.sin(t * 0.26) * 28;
      break;

    case 'surprised':
      tailSwing = Math.sin(t * 0.4) * 5;
      break;
  }

  const by = bobY;

  // ── TAIL ──
  if (animation !== 'sleep') {
    ctx.save();
    const tailX = animation === 'stretch' ? 2 : animation === 'hunt' ? 12 : 10;
    ctx.translate((tailX + wobbleOff) * scale, (9 + by) * scale);
    ctx.rotate(animation === 'hunt' ? 0 : (tailSwing * Math.PI) / 180);
    if (animation === 'hunt') {
      px(-wobbleOff, 0, 2, 5, pal.body);
    } else {
      px(-wobbleOff, 0, 2, 4, pal.body);
      px(-wobbleOff + 1, 3, 3, 2, pal.body);
    }
    ctx.restore();
  }

  // ── BODY ──
  ctx.save();
  if (bodySquish !== 1) {
    ctx.translate(8 * scale, (8 + by) * scale);
    ctx.scale(1, bodySquish);
    ctx.translate(-8 * scale, -(8 + by) * scale);
  }

  if (animation === 'sleep') {
    px(3, 7 + by, 10, 5, pal.body);
    px(5, 8 + by, 8, 3, pal.belly);
    px(2, 9 + by, 2, 3, pal.body);
    px(3, 11 + by, 10, 2, pal.body);
  } else if (animation === 'stretch') {
    px(1, 9 + by, 14, 4, pal.body);
    px(2, 10 + by, 12, 2, pal.belly);
  } else if (animation === 'hunt') {
    px(3, 8 + by, 10, 4, pal.body);
    px(4, 9 + by, 8, 2, pal.belly);
    if (pal.stripe) {
      px(3, 8 + by, 1, 3, pal.stripe);
      px(12, 8 + by, 1, 3, pal.stripe);
    }
  } else if (animation === 'paper') {
    px(4, 7 + by, 8, 5, pal.body);
    px(5, 8 + by, 6, 3, pal.belly);
  } else {
    px(4, 6 + by, 8, 6, pal.body);
    px(5, 7 + by, 6, 4, pal.belly);
    if (pal.stripe) {
      px(4, 6 + by, 1, 5, pal.stripe);
      px(11, 6 + by, 1, 5, pal.stripe);
    }
  }
  ctx.restore();

  // ── PREDEFINED PATTERN overlay ──
  drawPattern(ctx, scale, pattern, by, wobbleOff, pal.body);

  // ── CUSTOM PIXEL overlay ──
  if (customPixels && customPixels.length === 256) {
    drawCustomPixels(ctx, customPixels, scale, wobbleOff);
  }

  // ── HEAD ──
  if (animation === 'sleep') {
    px(5, 4 + by, 7, 5, pal.body);
    px(6, 5 + by, 5, 4, pal.body);
    px(5, 3 + by, 2, 2, pal.body);
    px(10, 3 + by, 2, 2, pal.body);
  } else if (animation === 'hunt') {
    px(3, 3 + by, 10, 5, pal.body);
    px(2, 4 + by, 12, 4, pal.body);
    px(2, 2 + by, 3, 2, pal.body);
    px(11, 2 + by, 3, 2, pal.body);
    px(3, 2 + by, 1, 1, pal.ear);
    px(12, 2 + by, 1, 1, pal.ear);
  } else {
    px(4, 1 + by, 8, 6, pal.body);
    px(3, 2 + by, 10, 5, pal.body);
    px(3, 0 + by, 3, 3, pal.body);
    px(10, 0 + by, 3, 3, pal.body);
    px(4, 0 + by, 1, 1, pal.ear);
    px(11, 0 + by, 1, 1, pal.ear);
    if (pal.stripe) {
      px(4, 1 + by, 1, 2, pal.stripe);
      px(6, 1 + by, 1, 2, pal.stripe);
      px(8, 1 + by, 1, 2, pal.stripe);
    }
  }

  // ── FACE ──
  const ey = animation === 'sleep' ? 6 : animation === 'hunt' ? 4 : 3;

  if (animation === 'sleep') {
    const ec = pal.body === '#f0ece8' ? '#9eaabb' : '#2d1b0e';
    px(6, ey + by, 2, 1, ec);
    px(10, ey + by, 2, 1, ec);
  } else if (!blinkOpen) {
    px(5, ey + by, 2, 1, pal.eye);
    px(9, ey + by, 2, 1, pal.eye);
  } else if (animation === 'surprised') {
    px(5, ey - 1 + by, 3, 4, pal.eye);
    px(9, ey - 1 + by, 3, 4, pal.eye);
    px(5, ey - 1 + by, 1, 1, '#ffffff');
    px(9, ey - 1 + by, 1, 1, '#ffffff');
  } else if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
    line(5, ey + by + 1, 7, ey + by - 0.5, pal.eye, 1);
    line(9, ey + by + 1, 11, ey + by - 0.5, pal.eye, 1);
  } else if (animation === 'think') {
    px(5, ey + by, 2, 1, pal.eye);
    px(9, ey + by, 2, 1, pal.eye);
    line(5, ey + by - 1, 7, ey + by - 1.5, pal.eye, 0.5);
    line(9, ey + by - 1, 11, ey + by - 1.5, pal.eye, 0.5);
  } else if (animation === 'hunt') {
    px(5, ey + by, 1, 2, pal.eye);
    px(10, ey + by, 1, 2, pal.eye);
  } else if (animation === 'overheat') {
    px(5, ey + by - 1, 2, 3, pal.eye);
    px(9, ey + by - 1, 2, 3, pal.eye);
    px(5, ey + by - 1, 1, 1, '#ff4444');
    px(9, ey + by - 1, 1, 1, '#ff4444');
  } else if (animation === 'type') {
    // Half-closed dreamy kneading eyes
    px(5, ey + by, 2, 2, pal.eye);
    px(9, ey + by, 2, 2, pal.eye);
    px(5, ey + by, 2, 1, pal.body); // top half covered = half-closed
    px(9, ey + by, 2, 1, pal.body);
    const ex = eyeDir ? Math.round(eyeDir.dx * 0.5) : 0;
    px(5 + ex, ey + by + 1, 1, 1, '#ffffff');
    px(9 + ex, ey + by + 1, 1, 1, '#ffffff');
  } else {
    // Normal eyes with eye direction
    px(5, ey + by, 2, 2, pal.eye);
    px(9, ey + by, 2, 2, pal.eye);
    const ex = eyeDir ? Math.round(eyeDir.dx) : 0;
    const eyd = eyeDir ? Math.round(eyeDir.dy * 0.5) : 0;
    px(5 + ex, ey + by + eyd, 1, 1, '#ffffff');
    px(9 + ex, ey + by + eyd, 1, 1, '#ffffff');
  }

  // Nose
  const ny = animation === 'sleep' ? 8 : animation === 'hunt' ? 6 : 5;
  px(7, ny + by, 2, 1, pal.nose);

  // Mouth
  if (animation !== 'sleep') {
    if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
      px(6, 6 + by, 1, 1, pal.eye);
      px(9, 6 + by, 1, 1, pal.eye);
    } else if (animation === 'overheat') {
      px(6, 6 + by, 4, 1, pal.eye);
      px(7, 7 + by, 2, 1, '#ff9999');
    } else {
      px(7, 6 + by, 1, 1, pal.eye);
      px(8, 6 + by, 1, 1, pal.eye);
    }
  }

  // Whiskers
  if (animation !== 'sleep') {
    line(1, 5 + by, 5, 5.5 + by, '#7a5c48', 0.45);
    line(1, 6 + by, 5, 5.5 + by, '#7a5c48', 0.45);
    line(15, 5 + by, 11, 5.5 + by, '#7a5c48', 0.45);
    line(15, 6 + by, 11, 5.5 + by, '#7a5c48', 0.45);
  }

  // Thinking paw raised to chin
  if (animation === 'think') {
    px(4, 3 + by, 2, 2, pal.body);
  }

  // ── LEGS / PAWS ──
  if (animation === 'sleep') {
    px(4, 11 + by, 4, 2, pal.body);
    px(9, 11 + by, 4, 2, pal.body);
  } else if (animation === 'stretch') {
    px(0, 11 + by, 3, 2, pal.body);
    px(14, 11 + by, 3, 2, pal.body);
    px(5, 9 + by, 2, 3, pal.body);
    px(9, 9 + by, 2, 3, pal.body);
  } else if (animation === 'sit' || animation === 'purr' || animation === 'think') {
    px(5, 10 + by, 2, 3, pal.body);
    px(9, 10 + by, 2, 3, pal.body);
  } else if (animation === 'type') {
    // ── KNEADING PAWS ── alternating press, very visible
    const k = Math.sin(t * 0.45);    // oscillates -1 to 1
    const leftDown = Math.round(Math.max(0, k) * 2.5);   // 0-2px down
    const rightDown = Math.round(Math.max(0, -k) * 2.5); // opposite
    // Front paws kneading
    px(4, 11 + by, 2, 2 + leftDown, pal.body);
    px(10, 11 + by, 2, 2 + rightDown, pal.body);
    // Tiny toe details on extended paw
    if (leftDown > 1) px(4, 13 + by + leftDown - 1, 1, 1, pal.belly);
    if (rightDown > 1) px(10, 13 + by + rightDown - 1, 1, 1, pal.belly);
    // Back legs steady
    px(6, 11 + by, 2, 2, pal.body);
    px(8, 11 + by, 2, 2, pal.body);
  } else if (animation === 'hunt') {
    px(3, 12 + by, 2, 1, pal.body);
    px(11, 12 + by, 2, 1, pal.body);
    px(5, 12 + by, 2, 2 + Math.round(legOffset), pal.body);
    px(9, 12 + by, 2, 2 - Math.round(legOffset), pal.body);
  } else if (animation === 'paper') {
    px(2, 12 + by, 4, 2, pal.body);
    px(10, 12 + by, 4, 2, pal.body);
    const scrollF = Math.sin(t * 0.3) * 2;
    px(3, 11 + by + Math.round(scrollF), 2, 1, pal.belly);
    px(11, 11 + by - Math.round(scrollF), 2, 1, pal.belly);
  } else if (animation === 'jump') {
    px(5, 9 + by, 2, 2, pal.body);
    px(9, 9 + by, 2, 2, pal.body);
    px(6, 11 + by, 4, 1, pal.body);
  } else {
    px(4, 11 + by, 2, 2 + Math.round(legOffset), pal.body);
    px(10, 11 + by, 2, 2 - Math.round(legOffset), pal.body);
    px(6, 11 + by, 2, 2 - Math.round(legOffset * 0.5), pal.body);
    px(8, 11 + by, 2, 2 + Math.round(legOffset * 0.5), pal.body);
  }

  // ── OVERHEAT TINT ──
  if (heatLevel > 0) {
    ctx.globalAlpha = Math.min(0.4, heatLevel * 0.14);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(wobbleOff * scale, 0, 16 * scale, 16 * scale);
    ctx.globalAlpha = 1;
  }

  // ── LONELY tint (slight blue desaturation) ──
  if (mood === 'lonely') {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#6699cc';
    ctx.fillRect(wobbleOff * scale, 0, 16 * scale, 16 * scale);
    ctx.globalAlpha = 1;
  }
}

// ── PREDEFINED PATTERNS ──
function drawPattern(
  ctx: CanvasRenderingContext2D,
  scale: number,
  pattern: CatPattern,
  by: number,
  wobbleOff: number,
  bodyColor: string
): void {
  if (pattern === 'none') return;
  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = c;
    ctx.fillRect((x + wobbleOff) * scale, y * scale, w * scale, h * scale);
    ctx.globalAlpha = 1;
  };

  if (pattern === 'tuxedo') {
    px(5, 7 + by, 6, 3, '#ffffff', 0.72);
    px(4, 11 + by, 2, 2, '#ffffff', 0.82);
    px(10, 11 + by, 2, 2, '#ffffff', 0.82);
  } else if (pattern === 'calico') {
    px(4, 1 + by, 4, 3, '#e8894a', 0.7);
    px(8, 6 + by, 4, 3, '#2c2c3e', 0.65);
    px(4, 9 + by, 3, 3, '#e8894a', 0.6);
  } else if (pattern === 'spotted') {
    px(5, 7 + by, 2, 2, '#00000033', 0.55);
    px(9, 8 + by, 2, 2, '#00000033', 0.55);
    px(6, 3 + by, 2, 1, '#00000033', 0.4);
  } else if (pattern === 'bicolor') {
    px(8, 1 + by, 8, 12, '#ffffff', 0.32);
  } else if (pattern === 'tabby') {
    px(5, 7 + by, 1, 4, bodyColor, 0.45);
    px(7, 7 + by, 1, 4, bodyColor, 0.45);
    px(9, 7 + by, 1, 4, bodyColor, 0.45);
    px(11, 7 + by, 1, 4, bodyColor, 0.45);
  }
}

// ── CUSTOM PIXEL OVERLAY ──
function drawCustomPixels(
  ctx: CanvasRenderingContext2D,
  pixels: string,
  scale: number,
  wobbleOff: number
): void {
  for (let i = 0; i < 256 && i < pixels.length; i++) {
    const idx = parseInt(pixels[i], 10);
    if (!idx || idx < 1 || idx > 9) continue;
    const color = EDITOR_PALETTE[idx];
    if (!color) continue;
    const gx = i % 16;
    const gy = Math.floor(i / 16);
    ctx.fillStyle = color;
    ctx.fillRect((gx + wobbleOff) * scale, gy * scale, scale, scale);
  }
}

// ── STEAM PUFFS (overheat) ──
export function drawSteam(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number
): void {
  const t = frame;
  for (let i = 0; i < 4; i++) {
    const offset = (i * 20 + t * 1.8) % 56;
    const alpha = (1 - offset / 56) * 0.65;
    const size = scale * 1.5 + (offset / 56) * scale * 3.5;
    const px = x + (i - 1.5) * scale * 3.5;
    const py = y - offset * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? '#ffbb88' : '#ffddbb';
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── ZZZ FLOATS (sleeping) ──
export function drawZzz(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number
): void {
  const t = frame;
  ctx.font = `bold ${scale * 5}px monospace`;
  const zs = ['z', 'z', 'Z'];
  zs.forEach((z, i) => {
    const off = ((t + i * 35) % 105) / 105;
    ctx.globalAlpha = Math.sin(off * Math.PI) * 0.65;
    ctx.fillStyle = '#7a8fa8';
    ctx.fillText(z, x + i * scale * 4, y - off * scale * 10);
  });
  ctx.globalAlpha = 1;
}

// ── HEART PARTICLES (purring / happy) ──
export function drawHearts(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number
): void {
  const t = frame;
  for (let i = 0; i < 3; i++) {
    const off = ((t + i * 28) % 70) / 70;
    const alpha = Math.sin(off * Math.PI) * 0.75;
    if (alpha < 0.05) continue;
    const px = x + (i - 1) * scale * 5 + Math.sin(off * Math.PI * 2) * scale * 1.5;
    const py = y - off * scale * 10;
    const sz = scale * 1.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f4a7b9';
    ctx.font = `${Math.round(sz * 2.5)}px serif`;
    ctx.fillText('♡', px - sz, py);
  }
  ctx.globalAlpha = 1;
}

// ── POMODORO TIMER DISPLAY ──
export function drawPomodoroTimer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  remainingMs: number,
  mode: 'focus' | 'break' | 'idle',
  scale: number
): void {
  if (mode === 'idle') return;
  const min = Math.floor(remainingMs / 60000);
  const sec = Math.floor((remainingMs % 60000) / 1000);
  const emoji = mode === 'focus' ? '🍅' : '☕';
  const text = `${emoji} ${min}:${String(sec).padStart(2, '0')}`;
  const fontSize = Math.max(11, scale * 3.2);
  ctx.font = `700 ${fontSize}px 'Inter', monospace`;
  const tw = ctx.measureText(text).width + 14;
  const th = fontSize + 10;

  // Pulsing border when almost done
  const urgent = remainingMs < 60_000;
  const pulse = urgent ? 0.6 + 0.4 * Math.sin(Date.now() / 300) : 1;

  ctx.globalAlpha = 0.92 * pulse;
  ctx.fillStyle = mode === 'focus' ? '#e85d3f' : '#4a90d9';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - tw / 2, y - th / 2, tw, th, 8);
  else ctx.rect(x - tw / 2, y - th / 2, tw, th);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── SPEECH BUBBLE ──
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  catX: number,
  catY: number,
  scale: number,
  isPinned = false
): void {
  const padding = 9;
  const fontSize = Math.max(11, scale * 3.5);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

  // Word-wrap to max 200px
  const maxW = 200;
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW - padding * 2 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const lineH = fontSize + 4;
  const textW = Math.min(maxW - padding * 2, Math.max(...lines.map(l => ctx.measureText(l).width)));
  const bW = textW + padding * 2;
  const bH = lines.length * lineH + padding * 1.5;
  const bX = catX - bW / 2;
  const bY = catY - bH - 16;
  const r = 9;

  ctx.fillStyle = isPinned ? 'rgba(255,245,200,0.97)' : 'rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.moveTo(bX + r, bY);
  ctx.lineTo(bX + bW - r, bY);
  ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + r);
  ctx.lineTo(bX + bW, bY + bH - r);
  ctx.quadraticCurveTo(bX + bW, bY + bH, bX + bW - r, bY + bH);
  ctx.lineTo(bX + r, bY + bH);
  ctx.quadraticCurveTo(bX, bY + bH, bX, bY + bH - r);
  ctx.lineTo(bX, bY + r);
  ctx.quadraticCurveTo(bX, bY, bX + r, bY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isPinned ? '#e8c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tail
  ctx.fillStyle = isPinned ? 'rgba(255,245,200,0.97)' : 'rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.moveTo(catX - 7, bY + bH);
  ctx.lineTo(catX, bY + bH + 12);
  ctx.lineTo(catX + 7, bY + bH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isPinned ? '#e8c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isPinned ? '#8b6200' : '#d94f70';
  lines.forEach((l, i) => {
    ctx.fillText(l, bX + padding, bY + padding + fontSize + i * lineH);
  });
}

// ── CAT EDITOR: draw reference ghost for pattern editor ──
export function drawCatGhost(
  ctx: CanvasRenderingContext2D,
  color: CatColor,
  cellSize: number
): void {
  const pal = CAT_COLORS[color];
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * cellSize, y * cellSize, w * cellSize, h * cellSize);
  };
  // Simplified ghost reference (just the main shapes at 50% opacity)
  ctx.globalAlpha = 0.3;
  px(4, 1, 8, 6, pal.body);
  px(3, 2, 10, 5, pal.body);
  px(3, 0, 3, 3, pal.body);
  px(10, 0, 3, 3, pal.body);
  px(4, 6, 8, 6, pal.body);
  px(5, 7, 6, 4, pal.belly);
  px(4, 11, 2, 3, pal.body);
  px(10, 11, 2, 3, pal.body);
  px(6, 11, 2, 3, pal.body);
  px(8, 11, 2, 3, pal.body);
  px(10, 9, 2, 4, pal.body);
  ctx.globalAlpha = 1;
}

