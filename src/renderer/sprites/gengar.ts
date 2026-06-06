import { fill, stroke, blob, radialGrad, groundShadow, Ctx } from './sprite-utils';

export function drawGengar(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Gengar floats — gentle bob, no foot contact
  const by = Math.sin(t * 0.055) * 0.5;
  const blinkOpen = !((t % 160) > 153);

  // ── Palette ─────────────────────────────────────────────────
  const ink         = '#2a1850';
  const purpleLight = '#9b72cb';
  const purpleMid   = '#7b52ab';
  const purpleDeep  = '#583a86';
  const darkPurple  = '#3f2670';
  const red         = '#d62828';
  const redLight    = '#ff5252';
  const white       = '#ffffff';
  const pink        = '#ff88aa';
  const lw = u(0.28);

  // Spiky polygon helper
  const spiky = (cx: number, cy: number, inner: number, outer: number, n: number) => {
    for (let i = 0; i < n * 2; i++) {
      const angle = (i * Math.PI) / n - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // ── Ground shadow (floating, so smaller + softer) ───────────
  groundShadow(ctx, u(8), u(15.2), u(3.4), u(0.7), 0.13);

  // ── STUBBY ARMS (behind body) ───────────────────────────────
  blob(ctx, purpleMid, ink, lw, () => {
    ctx.moveTo(u(4.0), u(9.8 + by));
    ctx.bezierCurveTo(u(1.2), u(8.8 + by), u(0.4), u(11.8 + by), u(2.4), u(12.4 + by));
    ctx.bezierCurveTo(u(3.4), u(12.7 + by), u(4.0), u(11.2 + by), u(4.0), u(9.8 + by));
    ctx.closePath();
  });
  blob(ctx, purpleMid, ink, lw, () => {
    ctx.moveTo(u(12.0), u(9.8 + by));
    ctx.bezierCurveTo(u(14.8), u(8.8 + by), u(15.6), u(11.8 + by), u(13.6), u(12.4 + by));
    ctx.bezierCurveTo(u(12.6), u(12.7 + by), u(12.0), u(11.2 + by), u(12.0), u(9.8 + by));
    ctx.closePath();
  });
  // claw tips
  for (let i = 0; i < 3; i++) {
    stroke(ctx, ink, u(0.14), 0.85, () => {
      ctx.moveTo(u(1.5 + i * 0.5), u(11.6 + by)); ctx.lineTo(u(1.3 + i * 0.5), u(12.5 + by));
    });
    stroke(ctx, ink, u(0.14), 0.85, () => {
      ctx.moveTo(u(14.5 - i * 0.5), u(11.6 + by)); ctx.lineTo(u(14.7 - i * 0.5), u(12.5 + by));
    });
  }

  // ── TINY FEET (behind body) ─────────────────────────────────
  blob(ctx, purpleDeep, ink, lw, () => {
    ctx.ellipse(u(5.9), u(14.4 + by), u(1.45), u(0.92), -0.12, 0, Math.PI * 2);
  });
  blob(ctx, purpleDeep, ink, lw, () => {
    ctx.ellipse(u(10.1), u(14.4 + by), u(1.45), u(0.92), 0.12, 0, Math.PI * 2);
  });

  // ── BODY (spiky) ────────────────────────────────────────────
  blob(ctx, radialGrad(ctx, u(7), u(9.6 + by), u(5.4), purpleLight, purpleDeep), ink, lw, () => {
    spiky(u(8), u(10.6 + by), u(4.0), u(5.1), 11);
  });

  // ── HEAD (spiky, overlaps body) ─────────────────────────────
  blob(ctx, radialGrad(ctx, u(7), u(3.8 + by), u(4.4), purpleLight, purpleMid), ink, lw, () => {
    spiky(u(8), u(4.8 + by), u(3.4), u(4.3), 8);
  });

  // ── RED EYES ────────────────────────────────────────────────
  const ey = 4.2 + by;
  if (!blinkOpen) {
    stroke(ctx, red, u(0.26), 0.95, () => {
      ctx.moveTo(u(5.7), u(ey)); ctx.lineTo(u(7.1), u(ey));
      ctx.moveTo(u(8.9), u(ey)); ctx.lineTo(u(10.3), u(ey));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.24 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.16 : 0;
    blob(ctx, radialGrad(ctx, u(6.3), u(ey - 0.2), u(1), redLight, red), ink, u(0.1),
      () => { ctx.ellipse(u(6.4), u(ey), u(0.95), u(1.0), -0.15, 0, Math.PI * 2); });
    blob(ctx, radialGrad(ctx, u(9.5), u(ey - 0.2), u(1), redLight, red), ink, u(0.1),
      () => { ctx.ellipse(u(9.6), u(ey), u(0.95), u(1.0), 0.15, 0, Math.PI * 2); });
    // white pupils
    fill(ctx, white, 1, () => { ctx.arc(u(6.4 + ex), u(ey + edy), u(0.34), 0, Math.PI * 2); });
    fill(ctx, white, 1, () => { ctx.arc(u(9.6 + ex), u(ey + edy), u(0.34), 0, Math.PI * 2); });
  }

  // ── WIDE GRIN: dark cavity + tongue + white teeth ───────────
  const mCx = u(8), mCy = u(6.1 + by);
  const mOuter = u(2.9), mInner = u(2.0);
  const gStart = Math.PI * 0.05, gEnd = Math.PI * 0.95;

  // cavity (outlined)
  ctx.save();
  ctx.beginPath();
  ctx.arc(mCx, mCy, mOuter, gStart, gEnd);
  ctx.lineTo(mCx, mCy);
  ctx.closePath();
  ctx.fillStyle = '#160030';
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // tongue
  fill(ctx, pink, 0.9, () => {
    ctx.ellipse(mCx, mCy + u(1.75), u(1.5), u(0.9), 0, 0, Math.PI * 2);
  });

  // teeth
  const numTeeth = 8, gapFrac = 0.1;
  const span = (gEnd - gStart) / numTeeth;
  for (let i = 0; i < numTeeth; i++) {
    const a1 = gStart + i * span + span * gapFrac;
    const a2 = gStart + (i + 1) * span - span * gapFrac;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mCx, mCy, mOuter, a1, a2);
    ctx.arc(mCx, mCy, mInner, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = white;
    ctx.globalAlpha = 0.97;
    ctx.fill();
    ctx.restore();
  }
}
