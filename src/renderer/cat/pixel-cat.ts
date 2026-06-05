import { CatColor, CatAnimation } from '../../shared/types';
import { CAT_COLORS } from '../../shared/constants';

export interface DrawOptions {
  color: CatColor;
  animation: CatAnimation;
  frame: number;
  scale: number;
}

const GRID = 16;

export function drawCat(ctx: CanvasRenderingContext2D, opts: DrawOptions): void {
  const { color, animation, frame, scale } = opts;
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

  // ── Animation-specific offsets ──
  const t = frame;
  let bobY = 0;
  let tailSwing = 0;
  let blinkOpen = true;
  let legOffset = 0;

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

  const by = bobY; // base Y offset

  // ── TAIL ──
  if (animation !== 'sleep') {
    ctx.save();
    const tailX = (animation === 'stretch') ? 2 : 10;
    ctx.translate(tailX * scale, (9 + by) * scale);
    ctx.rotate((tailSwing * Math.PI) / 180);
    px(0, 0, 2, 4, pal.body);
    px(1, 3, 3, 2, pal.body); // tip curl
    ctx.restore();
  }

  // ── BODY ──
  if (animation === 'sleep') {
    // Curled body
    px(3, 7 + by, 10, 5, pal.body);
    px(5, 8 + by, 8, 3, pal.belly);
    // Tail wraps around
    px(2, 9 + by, 2, 3, pal.body);
    px(3, 11 + by, 10, 2, pal.body);
  } else if (animation === 'stretch') {
    // Stretched out flat
    px(1, 9 + by, 14, 4, pal.body);
    px(2, 10 + by, 12, 2, pal.belly);
  } else {
    // Normal body
    px(4, 6 + by, 8, 6, pal.body);
    px(5, 7 + by, 6, 4, pal.belly);
    if (pal.stripe) {
      px(4, 6 + by, 1, 5, pal.stripe);
      px(11, 6 + by, 1, 5, pal.stripe);
    }
  }

  // ── HEAD ──
  if (animation === 'sleep') {
    px(5, 4 + by, 7, 5, pal.body);
    px(6, 5 + by, 5, 4, pal.body);
    // Ears flat
    px(5, 3 + by, 2, 2, pal.body);
    px(10, 3 + by, 2, 2, pal.body);
  } else {
    px(4, 1 + by, 8, 6, pal.body);
    px(3, 2 + by, 10, 5, pal.body);
    // Ears
    px(3, 0 + by, 3, 3, pal.body);
    px(10, 0 + by, 3, 3, pal.body);
    px(4, 0 + by, 1, 1, pal.ear);
    px(11, 0 + by, 1, 1, pal.ear);
    if (pal.stripe) {
      // Head stripes
      px(4, 1 + by, 1, 2, pal.stripe);
      px(6, 1 + by, 1, 2, pal.stripe);
      px(8, 1 + by, 1, 2, pal.stripe);
    }
  }

  // ── FACE ──
  const ey = (animation === 'sleep') ? 6 : 3;

  if (animation === 'sleep') {
    // Shut eyes (curved lines)
    px(6, ey + by, 2, 1, pal.body === '#f0ece8' ? '#9eaabb' : '#2d1b0e');
    px(10, ey + by, 2, 1, pal.body === '#f0ece8' ? '#9eaabb' : '#2d1b0e');
  } else if (!blinkOpen) {
    px(5, ey + by, 2, 1, pal.eye);
    px(9, ey + by, 2, 1, pal.eye);
  } else if (animation === 'surprised') {
    // Big eyes
    px(5, ey - 1 + by, 3, 4, pal.eye);
    px(9, ey - 1 + by, 3, 4, pal.eye);
    px(5, ey - 1 + by, 1, 1, '#ffffff');
    px(9, ey - 1 + by, 1, 1, '#ffffff');
  } else if (animation === 'happy') {
    // Happy squint ^ ^
    line(5, ey + by + 1, 7, ey + by - 0.5, pal.eye, 1);
    line(9, ey + by + 1, 11, ey + by - 0.5, pal.eye, 1);
  } else {
    // Normal eyes
    px(5, ey + by, 2, 2, pal.eye);
    px(9, ey + by, 2, 2, pal.eye);
    // Shine
    px(5, ey + by, 1, 1, '#ffffff');
    px(9, ey + by, 1, 1, '#ffffff');
  }

  // Nose
  const ny = (animation === 'sleep') ? 8 : 5;
  px(7, ny + by, 2, 1, pal.nose);

  // Mouth
  if (animation !== 'sleep') {
    if (animation === 'happy') {
      px(6, 6 + by, 1, 1, pal.eye);
      px(9, 6 + by, 1, 1, pal.eye);
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

  // ── LEGS / PAWS ──
  if (animation === 'sleep') {
    px(4, 11 + by, 4, 2, pal.body);
    px(9, 11 + by, 4, 2, pal.body);
  } else if (animation === 'stretch') {
    // Front paws stretched way out
    px(0, 11 + by, 3, 2, pal.body);
    px(14, 11 + by, 3, 2, pal.body);
    // Back haunches up
    px(5, 9 + by, 2, 3, pal.body);
    px(9, 9 + by, 2, 3, pal.body);
  } else if (animation === 'sit') {
    // Paws in front, sitting
    px(5, 10 + by, 2, 3, pal.body);
    px(9, 10 + by, 2, 3, pal.body);
  } else {
    // Walking/idle legs
    px(4, 11 + by, 2, 2 + Math.round(legOffset), pal.body);
    px(10, 11 + by, 2, 2 - Math.round(legOffset), pal.body);
    px(6, 11 + by, 2, 2 - Math.round(legOffset * 0.5), pal.body);
    px(8, 11 + by, 2, 2 + Math.round(legOffset * 0.5), pal.body);
  }
}

// Draw speech bubble above cat
export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  catX: number,
  catY: number,
  scale: number
): void {
  const padding = 8;
  const fontSize = Math.max(11, scale * 3.5);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

  const textW = ctx.measureText(text).width;
  const bW = textW + padding * 2;
  const bH = fontSize + padding * 2;
  const bX = catX - bW / 2;
  const bY = catY - bH - 12;
  const r = 8;

  // Bubble background
  ctx.fillStyle = '#ffffff';
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

  // Border
  ctx.strokeStyle = '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tail of bubble
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(catX - 6, bY + bH);
  ctx.lineTo(catX, bY + bH + 10);
  ctx.lineTo(catX + 6, bY + bH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#e8607a';
  ctx.fillText(text, bX + padding, bY + bH - padding);
}
