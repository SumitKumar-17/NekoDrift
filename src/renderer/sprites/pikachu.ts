// Pikachu — programmatic canvas 2D renderer
// Coordinate system: 16×16 units, 1 unit = scale px (matches cat system)

type C = CanvasRenderingContext2D;

function fill(ctx: C, color: string, alpha: number, shape: () => void) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); shape(); ctx.fill(); ctx.restore();
}
function stroke(ctx: C, color: string, width: number, alpha: number, shape: () => void) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); shape(); ctx.stroke(); ctx.restore();
}

export function drawPikachu(
  ctx: C,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const bobY = Math.sin(t * 0.05) * 0.4;
  const tailSwing = Math.sin(t * 0.07) * 18;
  const blinkOpen = !((t % 190) > 180);
  const by = bobY;

  const yellow = '#f4d03f';
  const darkYellow = '#c9a227';
  const black = '#1a1a1a';
  const brown = '#6b3a2a';
  const red = '#e74c3c';
  const white = '#ffffff';
  const earTip = '#1a1a1a';

  // ── TAIL (lightning bolt) ─────────────────────────────────
  ctx.save();
  ctx.translate(u(12), u(10 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  fill(ctx, darkYellow, 1, () => {
    ctx.moveTo(u(0), u(0));
    ctx.lineTo(u(2), u(-2.5));
    ctx.lineTo(u(1), u(-2.5));
    ctx.lineTo(u(2.8), u(-5.5));
    ctx.lineTo(u(1.5), u(-5.5));
    ctx.lineTo(u(3.5), u(-9));
    ctx.lineTo(u(1.5), u(-8));
    ctx.lineTo(u(2.5), u(-5.8));
    ctx.lineTo(u(0.8), u(-5.8));
    ctx.lineTo(u(2.2), u(-2.8));
    ctx.lineTo(u(-0.5), u(-2.8));
    ctx.closePath();
  });
  ctx.restore();

  // ── BODY ─────────────────────────────────────────────────
  fill(ctx, yellow, 1, () => { ctx.ellipse(u(8), u(9.5 + by), u(4.0), u(3.5), 0, 0, Math.PI * 2); });
  // Brown back stripes
  stroke(ctx, brown, u(0.28), 0.55, () => {
    ctx.moveTo(u(9.5), u(6.8 + by)); ctx.quadraticCurveTo(u(11.5), u(8 + by), u(11), u(10 + by));
  });
  stroke(ctx, brown, u(0.28), 0.55, () => {
    ctx.moveTo(u(10.5), u(7.0 + by)); ctx.quadraticCurveTo(u(12), u(8.5 + by), u(11.8), u(10.5 + by));
  });

  // ── EARS ─────────────────────────────────────────────────
  // Left ear (tall, narrow, black tip)
  fill(ctx, yellow, 1, () => {
    ctx.moveTo(u(4.2), u(2.5 + by));
    ctx.bezierCurveTo(u(3.5), u(-1 + by), u(5), u(-3 + by), u(5.5), u(-2.8 + by));
    ctx.bezierCurveTo(u(6.5), u(-3 + by), u(7), u(-1 + by), u(6.8), u(2.5 + by));
    ctx.closePath();
  });
  fill(ctx, earTip, 0.92, () => {
    ctx.moveTo(u(4.8), u(-0.5 + by));
    ctx.bezierCurveTo(u(4.5), u(-1.8 + by), u(5.5), u(-3.2 + by), u(5.5), u(-3.0 + by));
    ctx.bezierCurveTo(u(5.5), u(-3.0 + by), u(6.5), u(-1.8 + by), u(6.2), u(-0.5 + by));
    ctx.closePath();
  });
  // Right ear
  fill(ctx, yellow, 1, () => {
    ctx.moveTo(u(9.2), u(2.5 + by));
    ctx.bezierCurveTo(u(9), u(-1 + by), u(10.5), u(-3 + by), u(10.5), u(-2.8 + by));
    ctx.bezierCurveTo(u(11.5), u(-3 + by), u(12.5), u(-1 + by), u(11.8), u(2.5 + by));
    ctx.closePath();
  });
  fill(ctx, earTip, 0.92, () => {
    ctx.moveTo(u(9.8), u(-0.5 + by));
    ctx.bezierCurveTo(u(9.5), u(-1.8 + by), u(10.5), u(-3.2 + by), u(10.5), u(-3.0 + by));
    ctx.bezierCurveTo(u(10.5), u(-3.0 + by), u(11.5), u(-1.8 + by), u(11.2), u(-0.5 + by));
    ctx.closePath();
  });

  // ── HEAD ─────────────────────────────────────────────────
  fill(ctx, yellow, 1, () => { ctx.arc(u(8), u(4.5 + by), u(3.5), 0, Math.PI * 2); });

  // Red cheeks
  fill(ctx, red, 0.88, () => { ctx.ellipse(u(5.2), u(5.8 + by), u(1.1), u(0.85), 0, 0, Math.PI * 2); });
  fill(ctx, red, 0.88, () => { ctx.ellipse(u(10.8), u(5.8 + by), u(1.1), u(0.85), 0, 0, Math.PI * 2); });

  // Eyes
  if (!blinkOpen) {
    stroke(ctx, black, u(0.22), 1, () => {
      ctx.moveTo(u(6.0), u(4.2 + by)); ctx.lineTo(u(7.2), u(4.2 + by));
      ctx.moveTo(u(8.8), u(4.2 + by)); ctx.lineTo(u(10.0), u(4.2 + by));
    });
  } else {
    const ex = eyeDir ? eyeDir.dx * 0.28 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.18 : 0;
    fill(ctx, black, 1, () => { ctx.arc(u(6.6), u(4.2 + by), u(0.72), 0, Math.PI * 2); });
    fill(ctx, black, 1, () => { ctx.arc(u(9.4), u(4.2 + by), u(0.72), 0, Math.PI * 2); });
    fill(ctx, white, 0.95, () => { ctx.arc(u(6.3 + ex), u(3.95 + by + edy), u(0.25), 0, Math.PI * 2); });
    fill(ctx, white, 0.95, () => { ctx.arc(u(9.1 + ex), u(3.95 + by + edy), u(0.25), 0, Math.PI * 2); });
  }

  // Nose + mouth
  fill(ctx, black, 0.85, () => { ctx.ellipse(u(8), u(5.5 + by), u(0.3), u(0.2), 0, 0, Math.PI * 2); });
  stroke(ctx, brown, u(0.16), 0.8, () => {
    ctx.moveTo(u(7.4), u(5.9 + by));
    ctx.quadraticCurveTo(u(8), u(6.35 + by), u(8.6), u(5.9 + by));
  });

  // Small paws
  fill(ctx, yellow, 1, () => { ctx.ellipse(u(5.2), u(12.3 + by), u(1.1), u(0.78), -0.15, 0, Math.PI * 2); });
  fill(ctx, yellow, 1, () => { ctx.ellipse(u(10.8), u(12.3 + by), u(1.1), u(0.78), 0.15, 0, Math.PI * 2); });
}
