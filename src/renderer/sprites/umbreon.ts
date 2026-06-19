import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawUmbreon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.05) * 0.34;
  const walk      = Math.sin(t * 0.12);
  const tailSwing = Math.sin(t * 0.05) * 14;
  const blinkOpen = !((t % 200) > 193);
  const legL = walk * 0.44;
  const legR = -walk * 0.44;
  // Ring pulse — brighter when happy
  const basePulse = 0.52 + Math.sin(t * 0.065) * 0.28;
  const pulse = mood === 'happy' ? Math.min(1, basePulse * 1.3) : basePulse;

  // ── Palette ─────────────────────────────────────────────────
  const ink   = '#080814';
  const navyL = '#28283e';   // body highlight
  const navy  = '#18182e';   // body mid
  const navyD = '#0e0e1e';   // body shadow
  const gold  = `rgba(248,200,0,${pulse})`;
  const goldS = `rgba(248,200,0,${pulse * 0.3})`;   // soft halo
  const red   = '#DD1111';
  const redL  = '#FF4444';
  const lw = u(0.26);

  // Helper: 2-pass glowing ring  (wide soft halo + narrow bright stroke)
  const glowRing = (ex: number, ey: number, rx: number, ry: number, rot = 0) => {
    stroke(ctx, goldS, u(1.8), 1, () => { ctx.ellipse(ex, ey, rx, ry, rot, 0, Math.PI * 2); });
    stroke(ctx, gold,  u(0.38), 1, () => { ctx.ellipse(ex, ey, rx, ry, rot, 0, Math.PI * 2); });
  };

  groundShadow(ctx, u(8), u(15.2), u(4.0), u(0.88), 0.18);

  // ── TAIL (behind body) ───────────────────────────────────────
  ctx.save();
  ctx.translate(u(11.8), u(9.8 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  const tailGrad = radialGrad(ctx, u(-0.2), u(-2.0), u(3.5), navyL, navyD);
  blob(ctx, tailGrad, ink, lw, () => {
    ctx.moveTo(u(0), u(0.4));
    ctx.bezierCurveTo(u(1.8), u(-0.8), u(3.2), u(-3.5), u(2.6), u(-6.4));
    ctx.bezierCurveTo(u(1.4), u(-5.9), u(0.4), u(-2.8), u(0), u(-0.4));
    ctx.closePath();
  });
  glowRing(u(1.6), u(-3.8), u(1.2), u(0.42), -0.44);
  ctx.restore();

  // ── BODY ────────────────────────────────────────────────────
  const bodyGrad = radialGrad(ctx, u(7.0), u(9.3 + by), u(4.4), navyL, navyD);
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.0 + by), u(3.8), u(3.1), 0, 0, Math.PI * 2);
  });
  // 2 body rings
  glowRing(u(7.8), u(9.0 + by), u(2.1), u(0.50));
  glowRing(u(8.2), u(11.0 + by), u(1.75), u(0.44));

  // ── LEGS ────────────────────────────────────────────────────
  blob(ctx, navyL, ink, lw, () => {
    ctx.ellipse(u(5.9), u(13.4 + by + legL), u(1.3), u(1.7), 0.06, 0, Math.PI * 2);
  });
  blob(ctx, navyL, ink, lw, () => {
    ctx.ellipse(u(10.1), u(13.4 + by + legR), u(1.3), u(1.7), -0.06, 0, Math.PI * 2);
  });
  // Paws with rings
  blob(ctx, navy, ink, lw, () => {
    ctx.ellipse(u(5.9), u(14.5 + by + legL), u(1.28), u(0.72), 0, 0, Math.PI * 2);
  });
  blob(ctx, navy, ink, lw, () => {
    ctx.ellipse(u(10.1), u(14.5 + by + legR), u(1.28), u(0.72), 0, 0, Math.PI * 2);
  });
  glowRing(u(5.9), u(14.5 + by + legL), u(0.92), u(0.32));
  glowRing(u(10.1), u(14.5 + by + legR), u(0.92), u(0.32));

  // ── EARS ────────────────────────────────────────────────────
  blob(ctx, navyL, ink, lw, () => {
    ctx.moveTo(u(4.4), u(3.6 + by));
    ctx.bezierCurveTo(u(2.8), u(0.9 + by), u(3.6), u(-2.1 + by), u(4.8), u(-2.3 + by));
    ctx.bezierCurveTo(u(6.0), u(-2.5 + by), u(7.0), u(0.4 + by), u(6.6), u(3.6 + by));
    ctx.closePath();
  });
  // Gold inner ear
  fill(ctx, gold, 0.48, () => {
    ctx.moveTo(u(4.9), u(3.1 + by));
    ctx.bezierCurveTo(u(4.0), u(1.1 + by), u(4.5), u(-1.2 + by), u(4.8), u(-1.1 + by));
    ctx.bezierCurveTo(u(5.3), u(-0.9 + by), u(6.0), u(0.9 + by), u(5.8), u(3.1 + by));
    ctx.closePath();
  });
  blob(ctx, navyL, ink, lw, () => {
    ctx.moveTo(u(9.4), u(3.6 + by));
    ctx.bezierCurveTo(u(9.0), u(0.4 + by), u(10.0), u(-2.5 + by), u(11.2), u(-2.3 + by));
    ctx.bezierCurveTo(u(12.4), u(-2.1 + by), u(13.2), u(0.9 + by), u(11.6), u(3.6 + by));
    ctx.closePath();
  });
  fill(ctx, gold, 0.48, () => {
    ctx.moveTo(u(10.2), u(3.1 + by));
    ctx.bezierCurveTo(u(10.0), u(0.9 + by), u(10.7), u(-0.9 + by), u(11.2), u(-1.1 + by));
    ctx.bezierCurveTo(u(11.7), u(-1.2 + by), u(12.0), u(1.1 + by), u(11.1), u(3.1 + by));
    ctx.closePath();
  });

  // ── HEAD ────────────────────────────────────────────────────
  const headGrad = radialGrad(ctx, u(7.0), u(3.9 + by), u(3.6), navyL, navyD);
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.7 + by), u(3.4), u(3.2), 0, 0, Math.PI * 2);
  });
  // Forehead ring (proper ring, not a filled disc)
  glowRing(u(8), u(3.5 + by), u(1.3), u(0.46));

  // ── EYES ────────────────────────────────────────────────────
  const ey = 4.5 + by;
  if (mood === 'tired') {
    if (blinkOpen) {
      fill(ctx, red, 0.7, () => {
        ctx.arc(u(6.5), u(ey), u(0.7), 0, Math.PI * 2);
        ctx.arc(u(9.5), u(ey), u(0.7), 0, Math.PI * 2);
      });
      stroke(ctx, navyD, u(0.3), 0.9, () => {
        ctx.moveTo(u(5.6), u(ey - 0.5)); ctx.lineTo(u(7.4), u(ey - 0.5));
        ctx.moveTo(u(8.6), u(ey - 0.5)); ctx.lineTo(u(10.4), u(ey - 0.5));
      });
    } else {
      stroke(ctx, red, u(0.22), 0.88, () => {
        ctx.moveTo(u(5.9), u(ey)); ctx.lineTo(u(7.1), u(ey));
        ctx.moveTo(u(8.9), u(ey)); ctx.lineTo(u(10.1), u(ey));
      });
    }
  } else if (!blinkOpen) {
    stroke(ctx, red, u(0.22), 0.88, () => {
      ctx.moveTo(u(5.9), u(ey)); ctx.lineTo(u(7.1), u(ey));
      ctx.moveTo(u(8.9), u(ey)); ctx.lineTo(u(10.1), u(ey));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.28 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.18 : 0;
    blob(ctx, navyL, ink, u(0.06), () => { ctx.ellipse(u(6.5), u(ey), u(1.0), u(1.1), 0, 0, Math.PI * 2); });
    blob(ctx, navyL, ink, u(0.06), () => { ctx.ellipse(u(9.5), u(ey), u(1.0), u(1.1), 0, 0, Math.PI * 2); });
    // Red iris — radial gradient for depth
    const eyeGL = radialGrad(ctx, u(6.3), u(ey - 0.3), u(1), redL, red);
    const eyeGR = radialGrad(ctx, u(9.3), u(ey - 0.3), u(1), redL, red);
    blob(ctx, eyeGL, ink, u(0.06), () => { ctx.ellipse(u(6.5), u(ey), u(0.82), u(0.92), 0, 0, Math.PI * 2); });
    blob(ctx, eyeGR, ink, u(0.06), () => { ctx.ellipse(u(9.5), u(ey), u(0.82), u(0.92), 0, 0, Math.PI * 2); });
    fill(ctx, '#1a0000', 1, () => {
      ctx.arc(u(6.5 + ex * 0.4), u(ey + edy * 0.4), u(0.46), 0, Math.PI * 2);
      ctx.arc(u(9.5 + ex * 0.4), u(ey + edy * 0.4), u(0.46), 0, Math.PI * 2);
    });
    glint(ctx, u(6.22 + ex * 0.2), u(ey - 0.38 + edy * 0.2), u(0.26));
    glint(ctx, u(9.22 + ex * 0.2), u(ey - 0.38 + edy * 0.2), u(0.26));
  }

  // ── MOUTH ────────────────────────────────────────────────────
  if (mood === 'happy') {
    stroke(ctx, navyD, u(0.17), 0.75, () => {
      ctx.moveTo(u(7.0), u(6.0 + by));
      ctx.quadraticCurveTo(u(8), u(6.65 + by), u(9.0), u(6.0 + by));
    });
  } else {
    stroke(ctx, navyD, u(0.17), 0.7, () => {
      ctx.moveTo(u(7.3), u(6.1 + by));
      ctx.quadraticCurveTo(u(8), u(6.55 + by), u(8.7), u(6.1 + by));
    });
  }

  // ── ORBITING GOLD PARTICLES when happy ──────────────────────
  if (mood === 'happy') {
    for (let i = 0; i < 4; i++) {
      const angle = t * 0.06 + (i / 4) * Math.PI * 2;
      const px = u(8) + Math.cos(angle) * u(4.8);
      const py = u(8 + by) + Math.sin(angle) * u(2.0);
      fill(ctx, `rgba(248,200,0,${0.55 + Math.sin(angle) * 0.25})`, 1, () => {
        ctx.arc(px, py, u(0.38), 0, Math.PI * 2);
      });
    }
  }
}
