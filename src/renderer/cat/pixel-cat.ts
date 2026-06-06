import { CatColor, CatPattern, CatAnimation, EyeDir } from '../../shared/types';
import { CAT_COLORS } from '../../shared/constants';
import { computeAnimState } from './drawing/animations';

// Re-export overlays and particles so cat.ts/settings.ts keep the same import path
export { drawSteam, drawZzz, drawHearts } from './drawing/particles';
export { drawPomodoroTimer, drawSpeechBubble, drawCatGhost } from './drawing/overlays';

export interface DrawOptions {
  color: CatColor;
  pattern?: CatPattern;
  customPixels?: string;
  animation: CatAnimation;
  frame: number;
  scale: number;
  eyeDir?: EyeDir;
  heatLevel?: number;
  wobble?: number;
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

  const { bobY: by, tailSwing, blinkOpen, legOffset, bodySquish } =
    computeAnimState(animation, frame, mood);

  // ── TAIL ──
  if (animation !== 'sleep') {
    ctx.save();
    const tailX = animation === 'stretch' ? 2 : animation === 'hunt' ? 12 : 10;
    ctx.translate((tailX + wobbleOff) * scale, (9 + by) * scale);
    ctx.rotate(animation === 'hunt' ? 0 : (tailSwing * Math.PI) / 180);
    if (animation === 'hunt') {
      px(-wobbleOff, 0, 2, 5, pal.body);
      px(-wobbleOff, 4, 2, 1, pal.belly);   // tail tip
    } else {
      px(-wobbleOff, 0, 2, 4, pal.body);
      px(-wobbleOff + 1, 3, 3, 2, pal.body);
      px(-wobbleOff + 2, 4, 2, 1, pal.belly);  // tail tip
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
    // Soft side + bottom ambient occlusion for a rounder body
    px(4, 6 + by, 1, 6, shade(pal.body, -0.14));
    px(11, 6 + by, 1, 6, shade(pal.body, -0.14));
    px(4, 11 + by, 8, 1, shade(pal.body, -0.14));
    // Top highlight rim
    px(5, 6 + by, 6, 1, shade(pal.body, 0.16));
    px(5, 7 + by, 6, 4, pal.belly);
    if (pal.stripe) {
      px(4, 6 + by, 1, 5, pal.stripe);
      px(11, 6 + by, 1, 5, pal.stripe);
    }
  }
  ctx.restore();

  // ── PATTERN overlay ──
  drawPattern(ctx, scale, pattern, by, wobbleOff, pal.body);

  // ── CUSTOM PIXEL overlay ──
  if (customPixels && customPixels.length === 256) {
    drawCustomPixels(ctx, customPixels, scale, wobbleOff);
  }

  // ── HEAD ──────────────────────────────────────────────────────
  if (animation === 'sleep') {
    // Curled sideways
    px(4, 4 + by, 8, 5, pal.body);
    px(3, 5 + by, 10, 3, pal.body);
    px(4, 3 + by, 3, 3, pal.body);   // left ear
    px(9, 3 + by, 3, 3, pal.body);   // right ear
    px(5, 3 + by, 1, 1, pal.ear);
    px(10, 3 + by, 1, 1, pal.ear);
  } else if (animation === 'hunt') {
    px(2, 3 + by, 12, 5, pal.body);
    px(3, 2 + by, 10, 4, pal.body);
    px(2, 1 + by, 3, 3, pal.body);
    px(11, 1 + by, 3, 3, pal.body);
    px(3, 1 + by, 1, 1, pal.ear);
    px(12, 1 + by, 1, 1, pal.ear);
  } else {
    // Oval head — tapered top/bottom, widest in the middle
    px(4, 1 + by, 8, 1, pal.body);    // top (cols 4-11)
    px(3, 2 + by, 10, 1, pal.body);   // upper-mid (cols 3-12)
    px(2, 3 + by, 12, 2, pal.body);   // widest (cols 2-13)
    px(3, 5 + by, 10, 1, pal.body);   // lower-mid
    px(4, 6 + by, 8, 1, pal.body);    // chin (cols 4-11)
    // Depth: top highlight rim + side/chin ambient occlusion
    px(5, 1 + by, 6, 1, shade(pal.body, 0.16));
    px(2, 3 + by, 1, 2, shade(pal.body, -0.12));
    px(13, 3 + by, 1, 2, shade(pal.body, -0.12));
    px(4, 6 + by, 8, 1, shade(pal.body, -0.1));
    // Ears
    px(2, 0 + by, 3, 3, pal.body);
    px(11, 0 + by, 3, 3, pal.body);
    px(3, 0 + by, 1, 2, pal.ear);
    px(12, 0 + by, 1, 2, pal.ear);
    if (pal.stripe) {
      px(5, 1 + by, 1, 2, pal.stripe);
      px(7, 1 + by, 1, 2, pal.stripe);
      px(9, 1 + by, 1, 2, pal.stripe);
    }
  }

  // ── FACE ──────────────────────────────────────────────────────
  const ey = animation === 'sleep' ? 6 : animation === 'hunt' ? 4 : 3;

  if (animation === 'sleep') {
    const ec = color === 'white' ? '#9eaabb' : '#2d1b0e';
    // Sleeping: single-pixel curved closed eye
    px(5, ey + by, 3, 1, ec);
    px(9, ey + by, 3, 1, ec);
    // Small curve above
    px(5, ey - 1 + by, 1, 1, ec, 0.5);
    px(11, ey - 1 + by, 1, 1, ec, 0.5);
  } else if (!blinkOpen) {
    px(5, ey + 1 + by, 3, 1, pal.eye);
    px(9, ey + 1 + by, 3, 1, pal.eye);
  } else if (animation === 'surprised') {
    px(4, ey - 1 + by, 4, 4, pal.eye);
    px(9, ey - 1 + by, 4, 4, pal.eye);
    // Large shine dots
    px(4, ey - 1 + by, 2, 2, '#ffffff');
    px(9, ey - 1 + by, 2, 2, '#ffffff');
    // Pupils
    px(5, ey + 1 + by, 2, 2, pal.eye);
    px(10, ey + 1 + by, 2, 2, pal.eye);
  } else if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
    line(4, ey + 2 + by, 7, ey - 0.2 + by, pal.eye, 1);
    line(9, ey + 2 + by, 12, ey - 0.2 + by, pal.eye, 1);
  } else if (animation === 'think') {
    px(5, ey + by, 3, 2, pal.iris);
    px(9, ey + by, 3, 2, pal.iris);
    px(5, ey + by, 1, 1, '#ffffff');
    px(9, ey + by, 1, 1, '#ffffff');
    px(6, ey + 1 + by, 1, 1, pal.eye);
    px(10, ey + 1 + by, 1, 1, pal.eye);
    line(5, ey - 1 + by, 7, ey - 1.5 + by, pal.eye, 0.55);
    line(9, ey - 1 + by, 11, ey - 1.5 + by, pal.eye, 0.55);
  } else if (animation === 'hunt') {
    // Narrow slit eyes
    px(4, ey + by, 2, 2, pal.eye);
    px(10, ey + by, 2, 2, pal.eye);
    px(5, ey + by, 1, 2, '#000000');
    px(11, ey + by, 1, 2, '#000000');
  } else if (animation === 'overheat') {
    px(5, ey - 1 + by, 3, 3, pal.eye);
    px(9, ey - 1 + by, 3, 3, pal.eye);
    // X pattern
    px(5, ey - 1 + by, 1, 1, '#ff4444');
    px(7, ey - 1 + by, 1, 1, '#ff4444');
    px(6, ey + by, 1, 1, '#ff4444');
    px(9, ey - 1 + by, 1, 1, '#ff4444');
    px(11, ey - 1 + by, 1, 1, '#ff4444');
    px(10, ey + by, 1, 1, '#ff4444');
    px(5, ey + 1 + by, 1, 1, '#ff4444');
    px(7, ey + 1 + by, 1, 1, '#ff4444');
    px(9, ey + 1 + by, 1, 1, '#ff4444');
    px(11, ey + 1 + by, 1, 1, '#ff4444');
  } else if (animation === 'type') {
    // Half-lidded: iris visible in lower half only
    px(5, ey + by, 3, 2, pal.iris);
    px(9, ey + by, 3, 2, pal.iris);
    px(5, ey + by, 3, 1, pal.body);    // top lid
    px(9, ey + by, 3, 1, pal.body);
    const ex = eyeDir ? Math.round(eyeDir.dx * 0.5) : 0;
    px(5 + ex + 1, ey + 1 + by, 1, 1, pal.eye);   // pupil
    px(9 + ex + 1, ey + 1 + by, 1, 1, pal.eye);
  } else {
    // Iris (breed-specific color) + dark pupil + shine
    px(5, ey + by, 3, 2, pal.iris);
    px(9, ey + by, 3, 2, pal.iris);
    // Pupil (dark, tracks eye direction)
    const ex  = eyeDir ? Math.round(eyeDir.dx) : 0;
    const eyd = eyeDir ? Math.round(eyeDir.dy * 0.5) : 0;
    px(5 + ex + 1, ey + 1 + by + eyd, 1, 1, pal.eye);
    px(9 + ex + 1, ey + 1 + by + eyd, 1, 1, pal.eye);
    // Shine (top-left)
    px(5, ey + by, 1, 1, '#ffffff');
    px(9, ey + by, 1, 1, '#ffffff');
  }

  // Muzzle + cheeks (normal/type/think poses)
  const ny = animation === 'sleep' ? 8 : animation === 'hunt' ? 6 : 5;
  if (animation !== 'sleep' && animation !== 'hunt') {
    px(6, ny + by, 4, 2, pal.belly);               // muzzle bump (belly-colored)
    px(4, ny + by, 2, 1, pal.ear, 0.32);           // left cheek blush
    px(10, ny + by, 2, 1, pal.ear, 0.32);          // right cheek blush
  }
  // Nose (on top of muzzle)
  px(7, ny + by, 2, 1, pal.nose);

  // Mouth
  if (animation !== 'sleep') {
    if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
      px(6, ny + 1 + by, 1, 1, pal.eye);
      px(9, ny + 1 + by, 1, 1, pal.eye);
    } else if (animation === 'overheat') {
      px(5, ny + 1 + by, 6, 1, pal.eye);
      px(6, ny + 2 + by, 4, 1, '#ff9999');
    } else {
      px(7, ny + 1 + by, 1, 1, pal.eye);
      px(8, ny + 1 + by, 1, 1, pal.eye);
    }
  }

  // Whiskers — longer and more visible
  if (animation !== 'sleep') {
    const wy = (animation === 'hunt' ? 6 : 5) + by;
    line(0,  wy,       5, wy + 0.5, '#7a5c48', 0.58);
    line(0,  wy + 1,   5, wy + 0.5, '#7a5c48', 0.58);
    line(16, wy,      11, wy + 0.5, '#7a5c48', 0.58);
    line(16, wy + 1,  11, wy + 0.5, '#7a5c48', 0.58);
  }

  if (animation === 'think') {
    px(3, 2 + by, 2, 2, pal.body); // thought bubble start
  }

  // ── LEGS / PAWS ───────────────────────────────────────────────
  // Round the bob for the lower body so paws stay crisp on the pixel grid.
  const byr = Math.round(by);
  if (animation === 'sleep') {
    // Curled paws tucked under — one soft row
    px(3, 11 + byr, 10, 2, pal.body);
    px(4, 12 + byr, 3, 1, pal.belly);
    px(9, 12 + byr, 3, 1, pal.belly);
  } else if (animation === 'stretch') {
    px(0, 11 + byr, 3, 2, pal.body);
    px(13, 11 + byr, 3, 2, pal.body);
    px(4, 9 + byr, 2, 4, pal.body);
    px(10, 9 + byr, 2, 4, pal.body);
  } else if (animation === 'sit' || animation === 'purr' || animation === 'think') {
    // Two front paws side by side, center gap (cols 7-8)
    px(4, 10 + byr, 3, 3, pal.body);
    px(9, 10 + byr, 3, 3, pal.body);
    px(4, 12 + byr, 3, 1, pal.belly);   // paw tips
    px(9, 12 + byr, 3, 1, pal.belly);
  } else if (animation === 'type') {
    // ── KEYBOARD TYPING: alternating paw press + 3D keys ────────
    const phase  = Math.sin(frame * 0.32);
    const lPress = phase > 0.15;
    const rPress = phase < -0.15;
    const lOff   = lPress ? 1 : 0;
    const rOff   = rPress ? 1 : 0;

    // Arms reaching down to the keyboard
    px(3, 10 + byr, 3, 2, pal.body);    // left arm
    px(10, 10 + byr, 3, 2, pal.body);   // right arm
    px(5, 11 + byr, 6, 1, pal.body);    // chest base between arms
    // Paws press down onto the keys
    px(3, 12 + byr + lOff, 3, 1, pal.belly);
    px(10, 12 + byr + rOff, 3, 1, pal.belly);

    // 3D keyboard keys (highlight / face / shadow). Pressed = drops + darkens.
    drawKey(px, 3, 13 + byr, lPress);
    drawKey(px, 10, 13 + byr, rPress);
  } else if (animation === 'hunt') {
    px(2, 12 + byr, 3, 1, pal.body);
    px(11, 12 + byr, 3, 1, pal.body);
    px(4, 12 + byr, 3, 2 + Math.round(legOffset), pal.body);
    px(9, 12 + byr, 3, 2 - Math.round(legOffset), pal.body);
  } else if (animation === 'paper') {
    px(4, 11 + byr, 3, 2, pal.body);
    px(9, 11 + byr, 3, 2, pal.body);
    const scrollF = Math.round(Math.sin(frame * 0.3) * 2);
    px(4, 13 + byr + scrollF, 3, 1, pal.belly);
    px(9, 13 + byr - scrollF, 3, 1, pal.belly);
  } else if (animation === 'jump') {
    px(4, 9 + byr, 3, 2, pal.body);
    px(9, 9 + byr, 3, 2, pal.body);
    px(5, 11 + byr, 6, 1, pal.body);
  } else {
    // Walk / run / idle — two clean front legs, alternating for walk.
    // Clamp the swing so a leg never shrinks to zero height.
    const lo = Math.max(-1, Math.min(1, Math.round(legOffset * 0.5)));
    px(4, 11 + byr, 3, 2 + lo, pal.body);   // left leg
    px(9, 11 + byr, 3, 2 - lo, pal.body);   // right leg
    px(4, 13 + byr + lo, 3, 1, pal.belly);  // paw tips track each leg
    px(9, 13 + byr - lo, 3, 1, pal.belly);
  }

  // ── OVERHEAT TINT ──
  if (heatLevel > 0) {
    ctx.globalAlpha = Math.min(0.4, heatLevel * 0.14);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(wobbleOff * scale, 0, 16 * scale, 16 * scale);
    ctx.globalAlpha = 1;
  }

  // ── LONELY TINT ──
  if (mood === 'lonely') {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#6699cc';
    ctx.fillRect(wobbleOff * scale, 0, 16 * scale, 16 * scale);
    ctx.globalAlpha = 1;
  }
}

// ── PREDEFINED PATTERNS ──
type PxFn = (x: number, y: number, w: number, h: number, c: string, a?: number) => void;

// Multiply a #rrggbb colour toward black (amt<0) or white (amt>0).
// Used for subtle pixel-art ambient occlusion / highlights.
function shade(hex: string, amt: number): string {
  if (hex[0] !== '#' || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// A 4-wide 3D keyboard key. Pressed → face drops a row and darkens,
// highlight disappears (the visual "click" the user asked for).
function drawKey(px: PxFn, x: number, y: number, pressed: boolean): void {
  if (pressed) {
    px(x, y + 1, 4, 1, '#8e96a0');   // face (dropped down a row)
    px(x, y + 2, 4, 1, '#555d68');   // shadow
  } else {
    px(x, y, 4, 1, '#dfe4ec');       // highlight (top)
    px(x, y + 1, 4, 1, '#aab4be');   // face
    px(x, y + 2, 4, 1, '#555d68');   // shadow
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  scale: number,
  pattern: CatPattern,
  by: number,
  wobbleOff: number,
  bodyColor: string,
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
  wobbleOff: number,
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
