import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawEevee(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.05) * 0.32;
  const tailSwing = Math.sin(t * 0.06) * 18;
  const walk      = Math.sin(t * 0.14);
  const blinkOpen = !((t % 210) > 202);
  const legL = walk * 0.45;
  const legR = -walk * 0.45;

  // ── Palette ─────────────────────────────────────────────────
  const ink        = '#5a3216';
  const brownLight = '#c47b3e';
  const brownMid   = '#a85e2a';
  const brownDeep  = '#824718';
  const cream      = '#f6e8cf';
  const creamMid   = '#ecd8b4';
  const creamDeep  = '#d8bf90';
  const darkBrown  = '#4a2808';
  const innerEar   = '#cf8f9c';
  const lw = u(0.26);

  const bodyGrad = radialGrad(ctx, u(7.2), u(9.6 + by), u(4.2), brownLight, brownDeep);
  const headGrad = radialGrad(ctx, u(7.2), u(3.8 + by), u(3.6), brownLight, brownMid);

  // ── Ground shadow ───────────────────────────────────────────
  groundShadow(ctx, u(8), u(15.0), u(4.0), u(0.9), 0.16);

  // ── BUSHY TAIL (behind body) ────────────────────────────────
  ctx.save();
  ctx.translate(u(12.2), u(10.6 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, radialGrad(ctx, u(-0.2), u(-4.6), u(4.4), brownLight, brownMid), ink, lw, () => {
    ctx.ellipse(u(0.2), u(-4.0), u(2.6), u(4.4), 0.16, 0, Math.PI * 2);
  });
  // cream fluffy tip
  blob(ctx, radialGrad(ctx, u(0.3), u(-7.2), u(2.6), cream, creamMid), '#b89860', u(0.16), () => {
    ctx.ellipse(u(0.6), u(-6.9), u(1.9), u(2.7), 0.08, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── BODY ────────────────────────────────────────────────────
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.2 + by), u(3.7), u(3.3), 0, 0, Math.PI * 2);
  });

  // ── LEGS + FEET ─────────────────────────────────────────────
  blob(ctx, brownMid, ink, lw, () => {
    ctx.ellipse(u(5.9), u(13.4 + by + legL), u(1.25), u(1.55), 0.06, 0, Math.PI * 2);
  });
  blob(ctx, brownMid, ink, lw, () => {
    ctx.ellipse(u(10.1), u(13.4 + by + legR), u(1.25), u(1.55), -0.06, 0, Math.PI * 2);
  });
  // paw toe lines
  stroke(ctx, darkBrown, u(0.1), 0.4, () => {
    ctx.moveTo(u(5.5), u(14.4 + by + legL)); ctx.lineTo(u(5.5), u(14.9 + by + legL));
    ctx.moveTo(u(6.2), u(14.4 + by + legL)); ctx.lineTo(u(6.2), u(14.9 + by + legL));
  });
  stroke(ctx, darkBrown, u(0.1), 0.4, () => {
    ctx.moveTo(u(9.8), u(14.4 + by + legR)); ctx.lineTo(u(9.8), u(14.9 + by + legR));
    ctx.moveTo(u(10.5), u(14.4 + by + legR)); ctx.lineTo(u(10.5), u(14.9 + by + legR));
  });

  // ── EARS (behind head) ──────────────────────────────────────
  blob(ctx, brownMid, ink, lw, () => {
    ctx.moveTo(u(4.0), u(3.6 + by));
    ctx.bezierCurveTo(u(2.4), u(0.6 + by), u(3.8), u(-2.2 + by), u(5.0), u(-1.8 + by));
    ctx.bezierCurveTo(u(6.0), u(-1.2 + by), u(6.6), u(1.0 + by), u(6.4), u(3.4 + by));
    ctx.closePath();
  });
  fill(ctx, innerEar, 0.78, () => {
    ctx.moveTo(u(4.5), u(3.2 + by));
    ctx.bezierCurveTo(u(3.5), u(0.9 + by), u(4.5), u(-1.2 + by), u(5.0), u(-1.0 + by));
    ctx.bezierCurveTo(u(5.5), u(-0.8 + by), u(5.9), u(1.0 + by), u(5.8), u(3.0 + by));
    ctx.closePath();
  });
  blob(ctx, brownMid, ink, lw, () => {
    ctx.moveTo(u(9.6), u(3.4 + by));
    ctx.bezierCurveTo(u(9.4), u(1.0 + by), u(10.0), u(-1.2 + by), u(11.0), u(-1.8 + by));
    ctx.bezierCurveTo(u(12.2), u(-2.2 + by), u(13.6), u(0.6 + by), u(12.0), u(3.6 + by));
    ctx.closePath();
  });
  fill(ctx, innerEar, 0.78, () => {
    ctx.moveTo(u(10.2), u(3.0 + by));
    ctx.bezierCurveTo(u(10.1), u(1.0 + by), u(10.5), u(-0.8 + by), u(11.0), u(-1.0 + by));
    ctx.bezierCurveTo(u(11.5), u(-1.2 + by), u(12.5), u(0.9 + by), u(11.5), u(3.2 + by));
    ctx.closePath();
  });

  // ── HEAD ────────────────────────────────────────────────────
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.5 + by), u(3.4), u(3.1), 0, 0, Math.PI * 2);
  });

  // ── FLUFFY NECK RUFF (over the chest, under the chin) ───────
  // back layer (darker, wide)
  const ruffBack: [number, number, number][] = [
    [4.7, 8.4, 1.5], [6.3, 8.2, 1.5], [8.0, 8.1, 1.6], [9.7, 8.2, 1.5], [11.3, 8.4, 1.5],
  ];
  ruffBack.forEach(([mx, my, r]) =>
    blob(ctx, creamMid, '#bfa978', u(0.13), () => {
      ctx.ellipse(u(mx), u(my + by), u(r), u(r * 0.9), 0, 0, Math.PI * 2);
    }, 0.96));
  // front layer (bright wisps)
  const ruffFront: [number, number, number][] = [
    [5.4, 7.6, 1.15], [6.7, 7.3, 1.25], [8.0, 7.2, 1.3], [9.3, 7.3, 1.25], [10.6, 7.6, 1.15],
  ];
  ruffFront.forEach(([mx, my, r]) =>
    fill(ctx, cream, 0.95, () => {
      ctx.ellipse(u(mx), u(my + by), u(r), u(r * 0.92), 0, 0, Math.PI * 2);
    }));

  // ── EYES ────────────────────────────────────────────────────
  if (!blinkOpen) {
    stroke(ctx, ink, u(0.24), 1, () => {
      ctx.moveTo(u(5.9), u(4.3 + by)); ctx.lineTo(u(7.1), u(4.3 + by));
      ctx.moveTo(u(8.9), u(4.3 + by)); ctx.lineTo(u(10.1), u(4.3 + by));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.3 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.2 : 0;
    blob(ctx, darkBrown, ink, u(0.1), () => { ctx.ellipse(u(6.5), u(4.3 + by), u(0.95), u(1.08), 0, 0, Math.PI * 2); });
    blob(ctx, darkBrown, ink, u(0.1), () => { ctx.ellipse(u(9.5), u(4.3 + by), u(0.95), u(1.08), 0, 0, Math.PI * 2); });
    fill(ctx, '#1a0e04', 1, () => { ctx.arc(u(6.5 + ex * 0.4), u(4.45 + by + edy * 0.4), u(0.5), 0, Math.PI * 2); });
    fill(ctx, '#1a0e04', 1, () => { ctx.arc(u(9.5 + ex * 0.4), u(4.45 + by + edy * 0.4), u(0.5), 0, Math.PI * 2); });
    glint(ctx, u(6.22 + ex * 0.2), u(3.95 + by + edy * 0.2), u(0.27));
    glint(ctx, u(9.22 + ex * 0.2), u(3.95 + by + edy * 0.2), u(0.27));
  }

  // ── NOSE + MOUTH ────────────────────────────────────────────
  fill(ctx, darkBrown, 0.95, () => {
    ctx.ellipse(u(8), u(5.5 + by), u(0.32), u(0.23), 0, 0, Math.PI * 2);
  });
  stroke(ctx, darkBrown, u(0.16), 0.8, () => {
    ctx.moveTo(u(7.4), u(6.0 + by));
    ctx.quadraticCurveTo(u(8), u(6.5 + by), u(8.6), u(6.0 + by));
  });
}
