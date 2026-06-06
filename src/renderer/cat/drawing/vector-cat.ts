import { EyeDir } from '../../../shared/types';
import { CAT_COLORS } from '../../../shared/constants';
import { DrawOptions } from '../pixel-cat';
import { computeAnimState } from './animations';

type C = CanvasRenderingContext2D;

// ── Canvas helpers ────────────────────────────────────────────
function fill(ctx: C, color: string, alpha: number, shape: () => void) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  shape();
  ctx.fill();
  ctx.restore();
}

function stroke(ctx: C, color: string, width: number, alpha: number, shape: () => void) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  shape();
  ctx.stroke();
  ctx.restore();
}

function darkenHex(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 55);
  const g = Math.max(0, ((n >> 8) & 0xff) - 55);
  const b = Math.max(0, (n & 0xff) - 55);
  return `rgb(${r},${g},${b})`;
}

// ── Main export ───────────────────────────────────────────────
export function drawVectorCat(ctx: C, opts: DrawOptions): void {
  const { color, animation, frame, scale: S, eyeDir, heatLevel = 0, wobble = 0, mood = 'content' } = opts;
  const pal = CAT_COLORS[color];
  const u = (n: number) => n * S;
  const earPink = pal.ear ?? '#f4b8c8';

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const { bobY, tailSwing, blinkOpen, legOffset, bodySquish } =
    computeAnimState(animation, frame, mood);
  const by = bobY;

  ctx.save();
  ctx.translate(u(wobble * 2), 0);

  if (animation === 'sleep') {
    _drawSleep(ctx, pal, u, by, earPink);
  } else if (animation === 'stretch') {
    _drawStretch(ctx, pal, u, by, earPink, eyeDir, blinkOpen, S);
  } else if (animation === 'hunt') {
    _drawHunt(ctx, pal, u, by, earPink, eyeDir, blinkOpen, legOffset);
  } else {
    _drawNormal(ctx, pal, u, by, earPink, eyeDir, animation, frame, blinkOpen, legOffset, bodySquish, tailSwing);
  }

  ctx.restore();

  if (heatLevel > 0) {
    ctx.globalAlpha = Math.min(0.38, heatLevel * 0.13);
    ctx.fillStyle = '#ff2200';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }
  if (mood === 'lonely') {
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#6699cc';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }
}

// ── Pose: sleep ───────────────────────────────────────────────
function _drawSleep(ctx: C, pal: any, u: (n: number) => number, by: number, earPink: string) {
  // Curled oval body
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(8), u(9.5 + by), u(5.5), u(3.0), 0, 0, Math.PI * 2); });
  fill(ctx, pal.belly, 1, () => { ctx.ellipse(u(8), u(10.2 + by), u(3.5), u(1.9), 0, 0, Math.PI * 2); });
  // Head tucked to right
  fill(ctx, pal.body, 1, () => { ctx.arc(u(11.2), u(7.8 + by), u(2.5), 0, Math.PI * 2); });
  // Ear on visible side
  fill(ctx, pal.body, 1, () => {
    ctx.moveTo(u(10.0), u(6.2 + by));
    ctx.lineTo(u(10.5), u(4.8 + by));
    ctx.lineTo(u(12.0), u(6.0 + by));
    ctx.closePath();
  });
  fill(ctx, earPink, 0.8, () => {
    ctx.moveTo(u(10.4), u(6.1 + by));
    ctx.lineTo(u(10.6), u(5.2 + by));
    ctx.lineTo(u(11.6), u(6.0 + by));
    ctx.closePath();
  });
  // Tail wrapped left
  stroke(ctx, pal.body, u(0.82), 1, () => {
    ctx.moveTo(u(2.5), u(10 + by));
    ctx.quadraticCurveTo(u(1.2), u(8.5 + by), u(2.8), u(7.5 + by));
  });
  // Closed eyes — simple arcs
  stroke(ctx, pal.eye, u(0.22), 0.85, () => {
    ctx.moveTo(u(10.0), u(7.6 + by));
    ctx.quadraticCurveTo(u(10.8), u(7.2 + by), u(11.8), u(7.6 + by));
  });
  // Nose
  fill(ctx, earPink, 0.85, () => { ctx.ellipse(u(11.4), u(8.3 + by), u(0.35), u(0.25), 0, 0, Math.PI * 2); });
}

// ── Pose: stretch ─────────────────────────────────────────────
function _drawStretch(
  ctx: C, pal: any, u: (n: number) => number, by: number,
  earPink: string, eyeDir: EyeDir | undefined, blinkOpen: boolean, S: number,
) {
  // Wide flat body
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(8), u(10 + by), u(7), u(2.3), 0, 0, Math.PI * 2); });
  fill(ctx, pal.belly, 1, () => { ctx.ellipse(u(8), u(10.6 + by), u(5.2), u(1.5), 0, 0, Math.PI * 2); });
  // Head normal position
  _drawEarsAndHead(ctx, pal, u, by, earPink);
  // Long front paws
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(0.9), u(11.5 + by), u(1.3), u(0.8), -0.25, 0, Math.PI * 2); });
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(15.1), u(11.5 + by), u(1.3), u(0.8), 0.25, 0, Math.PI * 2); });
  // Tail small curl
  stroke(ctx, pal.body, u(0.75), 1, () => {
    ctx.moveTo(u(13), u(9 + by));
    ctx.quadraticCurveTo(u(14.5), u(7.5 + by), u(14), u(6.5 + by));
  });
  _drawFace(ctx, pal, u, by, eyeDir, 'stretch', 0, blinkOpen, earPink);
}

// ── Pose: hunt ────────────────────────────────────────────────
function _drawHunt(
  ctx: C, pal: any, u: (n: number) => number, by: number,
  earPink: string, eyeDir: EyeDir | undefined, blinkOpen: boolean, legOffset: number,
) {
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(8), u(9.8 + by), u(5.2), u(2.4), 0.15, 0, Math.PI * 2); });
  fill(ctx, pal.belly, 1, () => { ctx.ellipse(u(8.5), u(10.3 + by), u(3.4), u(1.6), 0.1, 0, Math.PI * 2); });
  // Head pushed forward
  fill(ctx, pal.body, 1, () => {
    ctx.moveTo(u(6.5), u(3.4 + by)); ctx.lineTo(u(7), u(2.0 + by)); ctx.lineTo(u(8.5), u(3.2 + by)); ctx.closePath();
  });
  fill(ctx, earPink, 0.8, () => {
    ctx.moveTo(u(6.8), u(3.3 + by)); ctx.lineTo(u(7), u(2.4 + by)); ctx.lineTo(u(8.1), u(3.1 + by)); ctx.closePath();
  });
  fill(ctx, pal.body, 1, () => {
    ctx.moveTo(u(9.5), u(3.2 + by)); ctx.lineTo(u(11), u(2.0 + by)); ctx.lineTo(u(11.5), u(3.4 + by)); ctx.closePath();
  });
  fill(ctx, earPink, 0.8, () => {
    ctx.moveTo(u(9.9), u(3.1 + by)); ctx.lineTo(u(11), u(2.4 + by)); ctx.lineTo(u(11.2), u(3.3 + by)); ctx.closePath();
  });
  fill(ctx, pal.body, 1, () => { ctx.arc(u(9.0), u(5.8 + by), u(3.2), 0, Math.PI * 2); });
  // Slit pupil focused eyes
  fill(ctx, pal.eye, 1, () => { ctx.ellipse(u(7.8), u(5.5 + by), u(0.95), u(1.1), 0, 0, Math.PI * 2); });
  fill(ctx, pal.eye, 1, () => { ctx.ellipse(u(10.5), u(5.5 + by), u(0.95), u(1.1), 0, 0, Math.PI * 2); });
  fill(ctx, '#1a1a1a', 1, () => { ctx.ellipse(u(7.8), u(5.5 + by), u(0.32), u(0.9), 0, 0, Math.PI * 2); });
  fill(ctx, '#1a1a1a', 1, () => { ctx.ellipse(u(10.5), u(5.5 + by), u(0.32), u(0.9), 0, 0, Math.PI * 2); });
  fill(ctx, earPink, 0.85, () => { ctx.ellipse(u(9.3), u(6.6 + by), u(0.38), u(0.27), 0, 0, Math.PI * 2); });
  // Low straight tail
  stroke(ctx, pal.body, u(0.78), 1, () => {
    ctx.moveTo(u(13), u(10.5 + by)); ctx.quadraticCurveTo(u(15), u(9 + by), u(15.5), u(8 + by));
  });
  // Crouching paws
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(4.8), u(12 + by), u(1.2), u(0.8), 0, 0, Math.PI * 2); });
  fill(ctx, pal.body, 1, () => { ctx.ellipse(u(10.5 + legOffset * 0.4), u(12 + by), u(1.2), u(0.8), 0, 0, Math.PI * 2); });
}

// ── Pose: normal (idle/walk/type/purr/jump/…) ─────────────────
function _drawNormal(
  ctx: C, pal: any, u: (n: number) => number, by: number,
  earPink: string, eyeDir: EyeDir | undefined,
  animation: string, frame: number, blinkOpen: boolean,
  legOffset: number, bodySquish: number, tailSwing: number,
) {
  // Swinging tail
  ctx.save();
  ctx.translate(u(12.2), u(11.2 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  stroke(ctx, pal.body, u(0.9), 1, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(u(1.8), u(-4.5), u(2.5), u(-7.5), u(0.8), u(-10));
  });
  stroke(ctx, pal.belly, u(0.55), 0.8, () => {
    ctx.moveTo(u(0.6), u(-8.5));
    ctx.bezierCurveTo(u(1.4), u(-9.5), u(1.0), u(-11), u(0.8), u(-10));
  });
  ctx.restore();

  // Body with bodySquish transform
  ctx.save();
  ctx.translate(u(8), u(9.3 + by));
  ctx.scale(1, bodySquish);
  fill(ctx, pal.body, 1, () => { ctx.ellipse(0, 0, u(4.2), u(3.3), 0, 0, Math.PI * 2); });
  fill(ctx, pal.belly, 1, () => { ctx.ellipse(0, u(0.85), u(2.85), u(2.1), 0, 0, Math.PI * 2); });
  stroke(ctx, darkenHex(pal.body), u(0.28), 0.22, () => { ctx.ellipse(0, 0, u(4.2), u(3.3), 0, 0, Math.PI * 2); });
  ctx.restore();

  _drawEarsAndHead(ctx, pal, u, by, earPink);
  _drawFace(ctx, pal, u, by, eyeDir, animation, frame, blinkOpen, earPink);
  _drawPaws(ctx, pal, u, by, animation, frame, legOffset);

  if (animation === 'think') {
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(5.2), u(4.8 + by), u(1.0), u(0.75), -0.5, 0, Math.PI * 2); });
  }
}

// ── Shared: ears + head ───────────────────────────────────────
function _drawEarsAndHead(ctx: C, pal: any, u: (n: number) => number, by: number, earPink: string) {
  // Left ear
  fill(ctx, pal.body, 1, () => {
    ctx.moveTo(u(3.8), u(2.6 + by)); ctx.lineTo(u(4.8), u(-0.5 + by)); ctx.lineTo(u(6.8), u(2.3 + by)); ctx.closePath();
  });
  fill(ctx, earPink, 0.82, () => {
    ctx.moveTo(u(4.3), u(2.3 + by)); ctx.lineTo(u(4.9), u(0.1 + by)); ctx.lineTo(u(6.2), u(2.1 + by)); ctx.closePath();
  });
  // Right ear
  fill(ctx, pal.body, 1, () => {
    ctx.moveTo(u(9.2), u(2.3 + by)); ctx.lineTo(u(11.2), u(-0.5 + by)); ctx.lineTo(u(12.2), u(2.6 + by)); ctx.closePath();
  });
  fill(ctx, earPink, 0.82, () => {
    ctx.moveTo(u(9.8), u(2.1 + by)); ctx.lineTo(u(11.1), u(0.1 + by)); ctx.lineTo(u(11.7), u(2.3 + by)); ctx.closePath();
  });
  // Head
  fill(ctx, pal.body, 1, () => { ctx.arc(u(8), u(4.1 + by), u(3.5), 0, Math.PI * 2); });
  stroke(ctx, darkenHex(pal.body), u(0.28), 0.2, () => { ctx.arc(u(8), u(4.1 + by), u(3.5), 0, Math.PI * 2); });
}

// ── Shared: face (eyes, nose, mouth, whiskers) ────────────────
function _drawFace(
  ctx: C, pal: any, u: (n: number) => number, by: number,
  eyeDir: EyeDir | undefined, animation: string, frame: number,
  blinkOpen: boolean, earPink: string,
) {
  const ey = 3.9 + by;
  const lx = 6.3, rx = 9.7;

  if (!blinkOpen) {
    stroke(ctx, pal.eye, u(0.22), 0.88, () => {
      ctx.moveTo(u(lx - 0.8), u(ey)); ctx.lineTo(u(lx + 0.9), u(ey));
    });
    stroke(ctx, pal.eye, u(0.22), 0.88, () => {
      ctx.moveTo(u(rx - 0.9), u(ey)); ctx.lineTo(u(rx + 0.8), u(ey));
    });
  } else if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
    stroke(ctx, pal.eye, u(0.28), 1, () => {
      ctx.moveTo(u(lx - 0.9), u(ey + 0.4));
      ctx.quadraticCurveTo(u(lx), u(ey - 0.7), u(lx + 0.9), u(ey + 0.4));
    });
    stroke(ctx, pal.eye, u(0.28), 1, () => {
      ctx.moveTo(u(rx - 0.9), u(ey + 0.4));
      ctx.quadraticCurveTo(u(rx), u(ey - 0.7), u(rx + 0.9), u(ey + 0.4));
    });
  } else if (animation === 'surprised') {
    const irisColor = pal.iris ?? pal.eye;
    fill(ctx, irisColor, 1, () => { ctx.arc(u(lx), u(ey), u(1.35), 0, Math.PI * 2); });
    fill(ctx, irisColor, 1, () => { ctx.arc(u(rx), u(ey), u(1.35), 0, Math.PI * 2); });
    fill(ctx, '#ffffff', 1, () => { ctx.arc(u(lx - 0.45), u(ey - 0.42), u(0.48), 0, Math.PI * 2); });
    fill(ctx, '#ffffff', 1, () => { ctx.arc(u(rx - 0.45), u(ey - 0.42), u(0.48), 0, Math.PI * 2); });
  } else if (animation === 'overheat') {
    fill(ctx, '#ff3322', 1, () => { ctx.arc(u(lx), u(ey), u(1.1), 0, Math.PI * 2); });
    fill(ctx, '#ff3322', 1, () => { ctx.arc(u(rx), u(ey), u(1.1), 0, Math.PI * 2); });
    stroke(ctx, '#ffffff', u(0.22), 0.9, () => {
      ctx.moveTo(u(lx - 0.72), u(ey - 0.72)); ctx.lineTo(u(lx + 0.72), u(ey + 0.72));
      ctx.moveTo(u(lx + 0.72), u(ey - 0.72)); ctx.lineTo(u(lx - 0.72), u(ey + 0.72));
    });
    stroke(ctx, '#ffffff', u(0.22), 0.9, () => {
      ctx.moveTo(u(rx - 0.72), u(ey - 0.72)); ctx.lineTo(u(rx + 0.72), u(ey + 0.72));
      ctx.moveTo(u(rx + 0.72), u(ey - 0.72)); ctx.lineTo(u(rx - 0.72), u(ey + 0.72));
    });
  } else if (animation === 'type') {
    const irisColor = pal.iris ?? pal.eye;
    fill(ctx, irisColor, 1, () => { ctx.arc(u(lx), u(ey + 0.3), u(1.0), 0, Math.PI * 2); });
    fill(ctx, irisColor, 1, () => { ctx.arc(u(rx), u(ey + 0.3), u(1.0), 0, Math.PI * 2); });
    // Upper lid covers top half (dreamy)
    fill(ctx, pal.body, 1, () => { ctx.rect(u(lx - 1.2), u(ey - 0.8), u(2.4), u(1.1)); });
    fill(ctx, pal.body, 1, () => { ctx.rect(u(rx - 1.2), u(ey - 0.8), u(2.4), u(1.1)); });
    const ex = eyeDir ? eyeDir.dx * 0.25 : 0;
    fill(ctx, '#ffffff', 0.88, () => { ctx.arc(u(lx + ex), u(ey + 0.25), u(0.32), 0, Math.PI * 2); });
    fill(ctx, '#ffffff', 0.88, () => { ctx.arc(u(rx + ex), u(ey + 0.25), u(0.32), 0, Math.PI * 2); });
  } else if (animation === 'think') {
    const irisColor = pal.iris ?? pal.eye;
    fill(ctx, irisColor, 1, () => { ctx.arc(u(lx), u(ey), u(1.0), 0, Math.PI * 2); });
    fill(ctx, irisColor, 1, () => { ctx.arc(u(rx), u(ey), u(1.0), 0, Math.PI * 2); });
    fill(ctx, '#1a1a1a', 1, () => { ctx.arc(u(lx), u(ey), u(0.52), 0, Math.PI * 2); });
    fill(ctx, '#1a1a1a', 1, () => { ctx.arc(u(rx), u(ey), u(0.52), 0, Math.PI * 2); });
    fill(ctx, 'rgba(255,255,255,0.9)', 1, () => { ctx.arc(u(lx - 0.22), u(ey - 0.26), u(0.23), 0, Math.PI * 2); });
    fill(ctx, 'rgba(255,255,255,0.9)', 1, () => { ctx.arc(u(rx - 0.22), u(ey - 0.26), u(0.23), 0, Math.PI * 2); });
    stroke(ctx, darkenHex(pal.eye), u(0.16), 0.55, () => {
      ctx.moveTo(u(lx - 0.8), u(ey - 1.1)); ctx.lineTo(u(lx + 0.8), u(ey - 1.4));
      ctx.moveTo(u(rx - 0.8), u(ey - 1.4)); ctx.lineTo(u(rx + 0.8), u(ey - 1.1));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.33 : 0;
    const eyd = eyeDir ? eyeDir.dy * 0.22 : 0;
    const irisColor = pal.iris ?? pal.eye;
    // Iris (colored)
    fill(ctx, irisColor, 1, () => { ctx.arc(u(lx), u(ey), u(1.02), 0, Math.PI * 2); });
    fill(ctx, irisColor, 1, () => { ctx.arc(u(rx), u(ey), u(1.02), 0, Math.PI * 2); });
    // Pupil
    fill(ctx, '#1a1a1a', 1, () => { ctx.arc(u(lx + ex), u(ey + eyd), u(0.57), 0, Math.PI * 2); });
    fill(ctx, '#1a1a1a', 1, () => { ctx.arc(u(rx + ex), u(ey + eyd), u(0.57), 0, Math.PI * 2); });
    // Primary eye shine
    fill(ctx, 'rgba(255,255,255,0.92)', 1, () => { ctx.arc(u(lx - 0.22 + ex), u(ey - 0.27 + eyd), u(0.28), 0, Math.PI * 2); });
    fill(ctx, 'rgba(255,255,255,0.92)', 1, () => { ctx.arc(u(rx - 0.22 + ex), u(ey - 0.27 + eyd), u(0.28), 0, Math.PI * 2); });
    // Secondary small shine (bottom-right)
    fill(ctx, 'rgba(255,255,255,0.52)', 1, () => { ctx.arc(u(lx + 0.38 + ex), u(ey + 0.35 + eyd), u(0.15), 0, Math.PI * 2); });
    fill(ctx, 'rgba(255,255,255,0.52)', 1, () => { ctx.arc(u(rx + 0.38 + ex), u(ey + 0.35 + eyd), u(0.15), 0, Math.PI * 2); });
    // Upper eyelid arc (gives the classic cat-eye shape)
    stroke(ctx, '#1a1a1a', u(0.2), 0.65, () => {
      ctx.moveTo(u(lx - 1.05), u(ey - 0.22));
      ctx.quadraticCurveTo(u(lx), u(ey - 1.18), u(lx + 1.05), u(ey - 0.22));
    });
    stroke(ctx, '#1a1a1a', u(0.2), 0.65, () => {
      ctx.moveTo(u(rx - 1.05), u(ey - 0.22));
      ctx.quadraticCurveTo(u(rx), u(ey - 1.18), u(rx + 1.05), u(ey - 0.22));
    });
  }

  // Rosy cheeks (subtle blush)
  if (animation !== 'sleep') {
    fill(ctx, earPink, 0.2, () => { ctx.ellipse(u(5.5), u(ey + 1.3), u(1.15), u(0.7), 0, 0, Math.PI * 2); });
    fill(ctx, earPink, 0.2, () => { ctx.ellipse(u(10.5), u(ey + 1.3), u(1.15), u(0.7), 0, 0, Math.PI * 2); });
  }

  // Nose — small inverted triangle
  fill(ctx, earPink, 1, () => {
    const nx = u(8), ny = u(5.65 + by), ns = u(0.42);
    ctx.moveTo(nx, ny + ns * 0.62);
    ctx.lineTo(nx - ns, ny - ns * 0.42);
    ctx.lineTo(nx + ns, ny - ns * 0.42);
    ctx.closePath();
  });

  // Mouth
  const my = 6.1 + by;
  if (animation !== 'sleep') {
    if (animation === 'happy' || animation === 'purr' || animation === 'jump') {
      stroke(ctx, pal.eye, u(0.2), 0.82, () => {
        ctx.moveTo(u(7.1), u(my));
        ctx.quadraticCurveTo(u(7.55), u(my + 0.55), u(8), u(my + 0.28));
        ctx.quadraticCurveTo(u(8.45), u(my + 0.55), u(8.9), u(my));
      });
    } else if (animation === 'overheat') {
      fill(ctx, '#ffffff', 0.88, () => { ctx.ellipse(u(8), u(my + 0.5), u(1.5), u(0.8), 0, 0, Math.PI * 2); });
      fill(ctx, '#ff9999', 1, () => { ctx.ellipse(u(8), u(my + 0.72), u(1.2), u(0.6), 0, 0, Math.PI * 2); });
    } else {
      stroke(ctx, pal.eye, u(0.18), 0.78, () => {
        ctx.moveTo(u(7.4), u(my));
        ctx.quadraticCurveTo(u(8), u(my + 0.42), u(8.6), u(my));
      });
    }
  }

  // Whiskers
  if (animation !== 'sleep') {
    const wy = 5.45 + by;
    const wc = '#a09080';
    const ww = u(0.12);
    [[-0.32, 1.2], [0.05, 1.0], [0.42, 1.2]].forEach(([dy, ext]) => {
      stroke(ctx, wc, ww, 0.55, () => {
        ctx.moveTo(u(6.0), u(wy + dy)); ctx.lineTo(u(6 - ext - 4), u(wy + dy - 0.28));
      });
      stroke(ctx, wc, ww, 0.55, () => {
        ctx.moveTo(u(10.0), u(wy + dy)); ctx.lineTo(u(10 + ext + 4), u(wy + dy - 0.28));
      });
    });
  }
}

// ── Shared: paws ─────────────────────────────────────────────
function _drawPaws(
  ctx: C, pal: any, u: (n: number) => number, by: number,
  animation: string, frame: number, legOffset: number,
) {
  const bY = 12.4;
  if (animation === 'sleep' || animation === 'stretch') return;

  if (animation === 'type') {
    const k = Math.sin(frame * 0.45);
    const ld = Math.max(0, k) * 1.5;
    const rd = Math.max(0, -k) * 1.5;
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(5.5), u(bY + by + ld), u(1.2), u(0.85), -0.12, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(10.5), u(bY + by + rd), u(1.2), u(0.85), 0.12, 0, Math.PI * 2); });
    if (ld > 0.8) fill(ctx, pal.belly, 0.65, () => { ctx.ellipse(u(5.5 - 0.4), u(bY + 0.35 + by + ld), u(0.32), u(0.25), 0, 0, Math.PI * 2); });
    if (rd > 0.8) fill(ctx, pal.belly, 0.65, () => { ctx.ellipse(u(10.5 + 0.4), u(bY + 0.35 + by + rd), u(0.32), u(0.25), 0, 0, Math.PI * 2); });
  } else if (animation === 'walk' || animation === 'run') {
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(5.5), u(bY + by + legOffset * 0.38), u(1.15), u(0.82), -0.12, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(10.5), u(bY + by - legOffset * 0.38), u(1.15), u(0.82), 0.12, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(6.8), u(bY + 0.4 + by - legOffset * 0.22), u(1.0), u(0.72), 0, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(9.2), u(bY + 0.4 + by + legOffset * 0.22), u(1.0), u(0.72), 0, 0, Math.PI * 2); });
  } else if (animation === 'jump') {
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(5.5), u(10.2 + by), u(1.12), u(0.8), -0.38, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(10.5), u(10.2 + by), u(1.12), u(0.8), 0.38, 0, Math.PI * 2); });
  } else {
    // Idle/sit/purr/think default
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(5.5), u(bY + by), u(1.22), u(0.87), -0.12, 0, Math.PI * 2); });
    fill(ctx, pal.body, 1, () => { ctx.ellipse(u(10.5), u(bY + by), u(1.22), u(0.87), 0.12, 0, Math.PI * 2); });
    fill(ctx, pal.belly, 0.6, () => { ctx.ellipse(u(5.8), u(bY + 0.32 + by), u(0.3), u(0.24), 0, 0, Math.PI * 2); });
    fill(ctx, pal.belly, 0.6, () => { ctx.ellipse(u(10.2), u(bY + 0.32 + by), u(0.3), u(0.24), 0, 0, Math.PI * 2); });
  }
}
