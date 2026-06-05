import { CatColor, CatPattern, CatAnimation, EyeDir } from '../../shared/types';
import { CAT_COLORS } from '../../shared/constants';

export interface DrawOptions {
  color: CatColor;
  pattern?: CatPattern;
  animation: CatAnimation;
  frame: number;
  scale: number;
  eyeDir?: EyeDir;
  heatLevel?: number; // 0-3
}

const GRID = 16;

export function drawCat(ctx: CanvasRenderingContext2D, opts: DrawOptions): void {
  const { color, animation, frame, scale, eyeDir, heatLevel = 0, pattern = 'none' } = opts;
  const pal = CAT_COLORS[color];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = false;

  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = c;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    ctx.globalAlpha = 1;
  };

  const line = (x1: number, y1: number, x2: number, y2: number, c: string, a = 0.6) => {
    ctx.globalAlpha = a;
    ctx.strokeStyle = c;
    ctx.lineWidth = scale * 0.5;
    ctx.beginPath();
    ctx.moveTo(x1 * scale, y1 * scale);
    ctx.lineTo(x2 * scale, y2 * scale);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const t = frame;
  let bobY = 0;
  let tailSwing = 0;
  let blinkOpen = true;
  let legOffset = 0;
  let bodySquish = 1;

  switch (animation) {
    case 'idle':
      bobY = Math.sin(t * 0.04) * 0.4;
      tailSwing = Math.sin(t * 0.06) * 15;
      blinkOpen = !((t % 180) > 170 && (t % 180) < 180);
      break;

    case 'walk':
    case 'run': {
      const speed = animation === 'run' ? 0.25 : 0.15;
      bobY = Math.abs(Math.sin(t * speed)) * 0.6;
      tailSwing = Math.sin(t * speed * 2) * 20;
      legOffset = Math.sin(t * speed) * 2;
      break;
    }

    case 'hunt': {
      // Low stalking pose
      bobY = 2 + Math.abs(Math.sin(t * 0.3)) * 0.5;
      tailSwing = Math.sin(t * 0.08) * 5; // slow deliberate tail
      legOffset = Math.sin(t * 0.4) * 1.5;
      blinkOpen = !((t % 60) > 55); // rapid blinking focus
      break;
    }

    case 'purr':
      bobY = Math.sin(t * 0.06) * 0.3;
      tailSwing = Math.sin(t * 0.08) * 20;
      blinkOpen = !((t % 80) > 65); // slow content blink
      break;

    case 'overheat':
      bobY = Math.sin(t * 0.35) * 0.5;
      tailSwing = Math.sin(t * 0.4) * 10;
      legOffset = Math.sin(t * 0.5) * 1;
      break;

    case 'paper':
      bobY = Math.sin(t * 0.08) * 0.3;
      tailSwing = Math.sin(t * 0.12) * 12;
      break;

    case 'think':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.04) * 8;
      blinkOpen = !((t % 120) > 100);
      break;

    case 'jump':
      bobY = -Math.abs(Math.sin(t * 0.2)) * 3; // upward
      tailSwing = Math.sin(t * 0.4) * 30;
      bodySquish = 0.85 + Math.abs(Math.sin(t * 0.2)) * 0.2;
      break;

    case 'sit':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.05) * 10;
      blinkOpen = !((t % 200) > 190);
      break;

    case 'sleep':
      bobY = Math.sin(t * 0.02) * 0.25;
      blinkOpen = false;
      break;

    case 'type':
      bobY = Math.sin(t * 0.3) * 0.35;
      tailSwing = Math.sin(t * 0.3) * 8;
      break;

    case 'stretch':
      tailSwing = Math.sin(t * 0.05) * 5;
      blinkOpen = !((t % 200) > 195);
      break;

    case 'happy':
      bobY = Math.abs(Math.sin(t * 0.2)) * 1.5;
      tailSwing = Math.sin(t * 0.25) * 25;
      break;

    case 'surprised':
      tailSwing = Math.sin(t * 0.4) * 5;
      break;
  }

  const by = bobY;

  // ── TAIL ──
  if (animation !== 'sleep') {
    ctx.save();
    const tailX = (animation === 'stretch') ? 2 : (animation === 'hunt') ? 12 : 10;
    const tailAngle = (animation === 'hunt') ? 0 : (tailSwing * Math.PI) / 180;
    ctx.translate(tailX * scale, (9 + by) * scale);
    ctx.rotate(tailAngle);
    // Straight tail for hunt, curled for others
    if (animation === 'hunt') {
      px(0, 0, 2, 5, pal.body); // straight back tail
    } else {
      px(0, 0, 2, 4, pal.body);
      px(1, 3, 3, 2, pal.body);
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
    // Low crouching body
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

  // ── PATTERN overlay on body ──
  drawPattern(ctx, scale, pattern, by, animation, pal.body);

  // ── HEAD ──
  if (animation === 'sleep') {
    px(5, 4 + by, 7, 5, pal.body);
    px(6, 5 + by, 5, 4, pal.body);
    px(5, 3 + by, 2, 2, pal.body);
    px(10, 3 + by, 2, 2, pal.body);
  } else if (animation === 'hunt') {
    // Head low, horizontal
    px(3, 3 + by, 10, 5, pal.body);
    px(2, 4 + by, 12, 4, pal.body);
    px(2, 2 + by, 3, 2, pal.body); // ears low
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
  const ey = (animation === 'sleep') ? 6 : (animation === 'hunt') ? 4 : 3;

  if (animation === 'sleep') {
    const eyeColor = pal.body === '#f0ece8' ? '#9eaabb' : '#2d1b0e';
    px(6, ey + by, 2, 1, eyeColor);
    px(10, ey + by, 2, 1, eyeColor);
  } else if (!blinkOpen) {
    px(5, ey + by, 2, 1, pal.eye);
    px(9, ey + by, 2, 1, pal.eye);
  } else if (animation === 'surprised') {
    px(5, ey - 1 + by, 3, 4, pal.eye);
    px(9, ey - 1 + by, 3, 4, pal.eye);
    px(5, ey - 1 + by, 1, 1, '#ffffff');
    px(9, ey - 1 + by, 1, 1, '#ffffff');
  } else if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
    // ^ ^ happy squint
    line(5, ey + by + 1, 7, ey + by - 0.5, pal.eye, 1);
    line(9, ey + by + 1, 11, ey + by - 0.5, pal.eye, 1);
  } else if (animation === 'think') {
    // Thoughtful eyes - slightly narrowed
    px(5, ey + by, 2, 1, pal.eye);
    px(9, ey + by, 2, 1, pal.eye);
    // Thinking brow
    line(5, ey + by - 1, 7, ey + by - 1.5, pal.eye, 0.5);
    line(9, ey + by - 1, 11, ey + by - 1.5, pal.eye, 0.5);
  } else if (animation === 'hunt') {
    // Slit pupils - narrow focus
    px(5, ey + by, 1, 2, pal.eye);
    px(10, ey + by, 1, 2, pal.eye);
  } else if (animation === 'overheat') {
    // Wide stressed eyes
    px(5, ey + by - 1, 2, 3, pal.eye);
    px(9, ey + by - 1, 2, 3, pal.eye);
    px(5, ey + by - 1, 1, 1, '#ff4444');
    px(9, ey + by - 1, 1, 1, '#ff4444');
  } else {
    // Normal eyes with eye direction
    px(5, ey + by, 2, 2, pal.eye);
    px(9, ey + by, 2, 2, pal.eye);
    // Shine/pupil shifted by eyeDir
    const ex = eyeDir ? Math.round(eyeDir.dx) : 0;
    const eyd = eyeDir ? Math.round(eyeDir.dy * 0.5) : 0;
    px(5 + ex, ey + by + eyd, 1, 1, '#ffffff');
    px(9 + ex, ey + by + eyd, 1, 1, '#ffffff');
  }

  // Nose
  const ny = (animation === 'sleep') ? 8 : (animation === 'hunt') ? 6 : 5;
  px(7, ny + by, 2, 1, pal.nose);

  // Mouth
  if (animation !== 'sleep') {
    if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
      px(6, 6 + by, 1, 1, pal.eye);
      px(9, 6 + by, 1, 1, pal.eye);
    } else if (animation === 'overheat') {
      // Open panting mouth
      px(6, 6 + by, 4, 1, pal.eye);
      px(7, 7 + by, 2, 1, '#ff9999');
    } else {
      px(7, 6 + by, 1, 1, pal.eye);
      px(8, 6 + by, 1, 1, pal.eye);
    }
  }

  // Whiskers
  if (animation !== 'sleep') {
    line(1, 5 + by, 5, 5.5 + by, '#7a5c48', 0.5);
    line(1, 6 + by, 5, 5.5 + by, '#7a5c48', 0.5);
    line(15, 5 + by, 11, 5.5 + by, '#7a5c48', 0.5);
    line(15, 6 + by, 11, 5.5 + by, '#7a5c48', 0.5);
  }

  // Thinking paw raised to face
  if (animation === 'think') {
    px(4, 3 + by, 2, 2, pal.body); // paw near chin
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
  } else if (animation === 'sit' || animation === 'purr') {
    px(5, 10 + by, 2, 3, pal.body);
    px(9, 10 + by, 2, 3, pal.body);
  } else if (animation === 'hunt') {
    // Crouching - legs splayed low
    px(3, 12 + by, 2, 1, pal.body);
    px(11, 12 + by, 2, 1, pal.body);
    px(5, 12 + by, 2, 2 + Math.round(legOffset), pal.body);
    px(9, 12 + by, 2, 2 - Math.round(legOffset), pal.body);
  } else if (animation === 'paper') {
    // Front paws stretched forward on desk
    px(2, 12 + by, 4, 2, pal.body);
    px(10, 12 + by, 4, 2, pal.body);
    // Paper unroll motion
    const scrollF = Math.sin(t * 0.3) * 2;
    px(3, 11 + by + Math.round(scrollF), 2, 1, pal.belly);
    px(11, 11 + by - Math.round(scrollF), 2, 1, pal.belly);
  } else if (animation === 'jump') {
    // Tucked legs mid-jump
    px(5, 9 + by, 2, 2, pal.body);
    px(9, 9 + by, 2, 2, pal.body);
    px(6, 11 + by, 4, 1, pal.body);
  } else if (animation === 'think') {
    px(5, 10 + by, 2, 3, pal.body);
    px(9, 10 + by, 2, 3, pal.body);
    px(3, 9 + by, 2, 2, pal.body); // raised paw
  } else {
    px(4, 11 + by, 2, 2 + Math.round(legOffset), pal.body);
    px(10, 11 + by, 2, 2 - Math.round(legOffset), pal.body);
    px(6, 11 + by, 2, 2 - Math.round(legOffset * 0.5), pal.body);
    px(8, 11 + by, 2, 2 + Math.round(legOffset * 0.5), pal.body);
  }

  // ── OVERHEAT TINT ──
  if (animation === 'overheat' || heatLevel > 0) {
    const alpha = Math.min(0.35, heatLevel * 0.12 + 0.1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(0, by * scale, GRID * scale, GRID * scale);
    ctx.globalAlpha = 1;
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  scale: number,
  pattern: CatPattern,
  by: number,
  animation: CatAnimation,
  bodyColor: string
): void {
  if (pattern === 'none') return;
  const px = (x: number, y: number, w: number, h: number, c: string, a = 1) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = c;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    ctx.globalAlpha = 1;
  };

  if (pattern === 'tuxedo') {
    // White chest bib + white paws
    px(5, 7 + by, 6, 3, '#ffffff', 0.7);
    px(4, 11 + by, 2, 2, '#ffffff', 0.8);
    px(10, 11 + by, 2, 2, '#ffffff', 0.8);
  } else if (pattern === 'calico') {
    // Orange + black patches
    px(4, 1 + by, 4, 3, '#e8894a', 0.7);
    px(8, 6 + by, 4, 3, '#2c2c3e', 0.7);
    px(4, 9 + by, 3, 3, '#e8894a', 0.6);
  } else if (pattern === 'spotted') {
    // Dark spots
    const dark = '#00000033';
    px(5, 7 + by, 2, 2, dark, 0.6);
    px(9, 8 + by, 2, 2, dark, 0.6);
    px(6, 3 + by, 2, 1, dark, 0.4);
  } else if (pattern === 'bicolor') {
    // Right half lighter
    px(8, 1 + by, 8, 12, '#ffffff', 0.35);
  } else if (pattern === 'tabby') {
    // Extra stripes (adds to existing)
    px(5, 7 + by, 1, 4, bodyColor, 0.4);
    px(7, 7 + by, 1, 4, bodyColor, 0.4);
    px(9, 7 + by, 1, 4, bodyColor, 0.4);
    px(11, 7 + by, 1, 4, bodyColor, 0.4);
  }
}

// Draw steam puffs above cat head (overheat)
export function drawSteam(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, scale: number): void {
  const t = frame;
  for (let i = 0; i < 3; i++) {
    const offset = (i * 24 + t * 1.5) % 48;
    const alpha = (1 - offset / 48) * 0.6;
    const size = (scale * 2) + (offset / 48) * scale * 3;
    const px = x + (i - 1) * scale * 4;
    const py = y - offset * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffccaa';
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Draw "z z z" for sleeping
export function drawZzz(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, scale: number): void {
  const t = frame;
  ctx.font = `bold ${scale * 4}px monospace`;
  ctx.fillStyle = '#9eaabb';
  const zs = ['z', 'z', 'Z'];
  zs.forEach((z, i) => {
    const off = ((t + i * 30) % 90) / 90;
    ctx.globalAlpha = Math.sin(off * Math.PI) * 0.7;
    ctx.fillText(z, x + i * scale * 3, y - off * scale * 8);
  });
  ctx.globalAlpha = 1;
}

// Draw floating pixel pomodoro timer
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
  const text = `${mode === 'focus' ? '🍅' : '☕'} ${min}:${String(sec).padStart(2, '0')}`;
  const fontSize = Math.max(10, scale * 3);
  ctx.font = `700 ${fontSize}px 'Inter', monospace`;
  const w = ctx.measureText(text).width + 12;
  const h = fontSize + 8;

  ctx.fillStyle = mode === 'focus' ? 'rgba(255,80,60,0.85)' : 'rgba(100,180,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Draw speech bubble above cat
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  catX: number,
  catY: number,
  scale: number,
  isPinned = false
): void {
  const padding = 8;
  const fontSize = Math.max(11, scale * 3.5);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

  const maxW = 200;
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW - padding * 2) {
      if (cur) lines.push(cur);
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
  const bY = catY - bH - 14;
  const r = 8;

  ctx.fillStyle = isPinned ? 'rgba(255,240,200,0.97)' : '#ffffff';
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

  ctx.strokeStyle = isPinned ? '#f4c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(catX - 6, bY + bH);
  ctx.lineTo(catX, bY + bH + 10);
  ctx.lineTo(catX + 6, bY + bH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isPinned ? '#f4c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isPinned ? '#8b5e00' : '#e8607a';
  lines.forEach((l, i) => {
    ctx.fillText(l, bX + padding, bY + padding + fontSize + i * lineH);
  });
}
