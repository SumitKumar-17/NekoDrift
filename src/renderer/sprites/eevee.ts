// Eevee — programmatic canvas 2D renderer

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

export function drawEevee(
  ctx: C, frame: number, scale: number,
  eyeDir?: { dx: number; dy: number },
): void {
  const u = (n: number) => n * scale;
  const t = frame;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const bobY = Math.sin(t * 0.05) * 0.38;
  const tailSwing = Math.sin(t * 0.06) * 22;
  const blinkOpen = !((t % 200) > 192);
  const by = bobY;

  const brown = '#a0522d';
  const lightBrown = '#c4845a';
  const cream = '#f5e6c8';
  const darkBrown = '#5c2e0a';
  const black = '#1a1a1a';
  const white = '#ffffff';
  const innerEar = '#d4a0a0';

  // ── FLUFFY TAIL ────────────────────────────────────────────
  ctx.save();
  ctx.translate(u(12), u(10 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  // Wide fluffy tail
  fill(ctx, lightBrown, 1, () => { ctx.ellipse(u(0), u(-4), u(2.2), u(3.8), 0.2, 0, Math.PI * 2); });
  fill(ctx, cream, 0.85, () => { ctx.ellipse(u(0.2), u(-6), u(1.4), u(2.2), 0.1, 0, Math.PI * 2); });
  ctx.restore();

  // ── BODY ──────────────────────────────────────────────────
  fill(ctx, brown, 1, () => { ctx.ellipse(u(8), u(9.8 + by), u(3.8), u(3.2), 0, 0, Math.PI * 2); });

  // ── FLUFFY MANE (cream collar) ────────────────────────────
  // Draw as a cloud of overlapping circles
  const maneColor = cream;
  const maneCenters = [
    [5.2, 7.5], [6.2, 7.0], [7.2, 6.8], [8.2, 6.8], [9.2, 7.0], [10.2, 7.5],
    [5.5, 8.2], [6.5, 7.6], [8, 7.4], [9.5, 7.6], [10.5, 8.2],
  ];
  maneCenters.forEach(([mx, my]) => {
    fill(ctx, maneColor, 0.92, () => {
      ctx.ellipse(u(mx), u(my + by), u(1.25), u(1.1), 0, 0, Math.PI * 2);
    });
  });

  // ── EARS ──────────────────────────────────────────────────
  // Left ear
  fill(ctx, brown, 1, () => {
    ctx.moveTo(u(3.5), u(2.8 + by));
    ctx.bezierCurveTo(u(2.5), u(-0.5 + by), u(4.5), u(-2 + by), u(5.5), u(-1.5 + by));
    ctx.bezierCurveTo(u(6.5), u(-1 + by), u(7), u(1 + by), u(6.5), u(2.8 + by));
    ctx.closePath();
  });
  fill(ctx, innerEar, 0.75, () => {
    ctx.moveTo(u(4.0), u(2.5 + by));
    ctx.bezierCurveTo(u(3.5), u(0.2 + by), u(5), u(-1 + by), u(5.5), u(-0.8 + by));
    ctx.bezierCurveTo(u(6), u(-0.6 + by), u(6.5), u(0.8 + by), u(6.0), u(2.5 + by));
    ctx.closePath();
  });
  // Right ear
  fill(ctx, brown, 1, () => {
    ctx.moveTo(u(9.5), u(2.8 + by));
    ctx.bezierCurveTo(u(9), u(1 + by), u(9.5), u(-1 + by), u(10.5), u(-1.5 + by));
    ctx.bezierCurveTo(u(11.5), u(-2 + by), u(13.5), u(-0.5 + by), u(12.5), u(2.8 + by));
    ctx.closePath();
  });
  fill(ctx, innerEar, 0.75, () => {
    ctx.moveTo(u(10.0), u(2.5 + by));
    ctx.bezierCurveTo(u(9.5), u(0.8 + by), u(10), u(-0.6 + by), u(10.5), u(-0.8 + by));
    ctx.bezierCurveTo(u(11), u(-1 + by), u(12.5), u(0.2 + by), u(12.0), u(2.5 + by));
    ctx.closePath();
  });

  // ── HEAD ──────────────────────────────────────────────────
  fill(ctx, brown, 1, () => { ctx.arc(u(8), u(4.2 + by), u(3.3), 0, Math.PI * 2); });
  // Small forehead tuft
  fill(ctx, lightBrown, 0.75, () => {
    ctx.moveTo(u(7.2), u(1.2 + by));
    ctx.bezierCurveTo(u(7.5), u(0.2 + by), u(8.5), u(0.2 + by), u(8.8), u(1.2 + by));
    ctx.bezierCurveTo(u(8.5), u(0.8 + by), u(7.5), u(0.8 + by), u(7.2), u(1.2 + by));
    ctx.closePath();
  });

  // Eyes
  if (!blinkOpen) {
    stroke(ctx, black, u(0.2), 1, () => {
      ctx.moveTo(u(6.0), u(4.1 + by)); ctx.lineTo(u(7.1), u(4.1 + by));
      ctx.moveTo(u(8.9), u(4.1 + by)); ctx.lineTo(u(10.0), u(4.1 + by));
    });
  } else {
    const ex = eyeDir ? eyeDir.dx * 0.28 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.18 : 0;
    fill(ctx, darkBrown, 1, () => { ctx.arc(u(6.6), u(4.1 + by), u(0.82), 0, Math.PI * 2); });
    fill(ctx, darkBrown, 1, () => { ctx.arc(u(9.4), u(4.1 + by), u(0.82), 0, Math.PI * 2); });
    fill(ctx, black, 1, () => { ctx.arc(u(6.6 + ex), u(4.1 + by + edy), u(0.5), 0, Math.PI * 2); });
    fill(ctx, black, 1, () => { ctx.arc(u(9.4 + ex), u(4.1 + by + edy), u(0.5), 0, Math.PI * 2); });
    fill(ctx, white, 0.9, () => { ctx.arc(u(6.35 + ex), u(3.85 + by + edy), u(0.22), 0, Math.PI * 2); });
    fill(ctx, white, 0.9, () => { ctx.arc(u(9.15 + ex), u(3.85 + by + edy), u(0.22), 0, Math.PI * 2); });
  }

  // Nose + mouth
  fill(ctx, darkBrown, 0.9, () => { ctx.ellipse(u(8), u(5.5 + by), u(0.35), u(0.25), 0, 0, Math.PI * 2); });
  stroke(ctx, darkBrown, u(0.16), 0.75, () => {
    ctx.moveTo(u(7.5), u(5.9 + by)); ctx.quadraticCurveTo(u(8), u(6.3 + by), u(8.5), u(5.9 + by));
  });

  // Paws
  fill(ctx, brown, 1, () => { ctx.ellipse(u(5.5), u(12.2 + by), u(1.15), u(0.82), -0.12, 0, Math.PI * 2); });
  fill(ctx, brown, 1, () => { ctx.ellipse(u(10.5), u(12.2 + by), u(1.15), u(0.82), 0.12, 0, Math.PI * 2); });
}
