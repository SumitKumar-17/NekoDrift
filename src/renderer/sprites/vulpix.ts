import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawVulpix(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.054) * 0.36;
  const walk      = Math.sin(t * 0.13);
  const tailSwing = Math.sin(t * 0.048) * 13;
  const blinkOpen = !((t % 195) > 188);
  const legL = walk * 0.46;
  const legR = -walk * 0.46;

  // ── Palette ─────────────────────────────────────────────────
  const ink    = '#5a2200';
  const bodL   = '#F07840';       // body highlight
  const bodM   = '#E06428';       // body mid
  const bodD   = '#C44A18';       // body dark
  const cream  = '#F8E8C8';       // paw/belly cream
  const creamD = '#E0C898';
  const amber  = '#C87820';       // iris colour
  const lw = u(0.26);

  groundShadow(ctx, u(8), u(15.3), u(4.2), u(0.9), 0.16);

  // ── SIX TAILS — fan from the rump ────────────────────────────
  // Each tail is an individual curved feather with a cream curly tip
  const rumpX = u(11.2), rumpY = u(10.0 + by);
  for (let ti = 0; ti < 6; ti++) {
    const fan    = ((ti - 2.5) / 5) * 1.35;          // angular spread
    const sway   = Math.sin(t * 0.044 + ti * 0.62) * u(0.42);
    const tDist  = u(5.0);
    const tipX   = rumpX + Math.sin(fan) * tDist + sway;
    const tipY   = rumpY - Math.cos(fan) * tDist * 0.72;
    const c1x    = rumpX + Math.sin(fan * 0.45) * u(2.3);
    const c1y    = rumpY - u(2.0);
    const tg = radialGrad(ctx, c1x, c1y - u(0.5), u(2.0), bodL, bodM);
    // Tail shaft — two bezier halves give a nice tapered feather shape
    blob(ctx, tg, ink, lw * 0.9, () => {
      ctx.moveTo(rumpX - u(0.38), rumpY + u(0.15));
      ctx.bezierCurveTo(c1x - u(0.5), c1y, tipX - u(0.55), tipY + u(0.9), tipX, tipY);
      ctx.bezierCurveTo(tipX + u(0.38), tipY + u(0.6), c1x + u(0.6), c1y, rumpX + u(0.38), rumpY + u(0.15));
      ctx.closePath();
    });
    // Cream curly tip (outer + inner highlight)
    const tipR = u(0.84 - ti * 0.04);
    blob(ctx, cream, creamD, lw * 0.65, () => {
      ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2);
    });
    fill(ctx, '#fffbf0', 0.55, () => {
      ctx.arc(tipX - tipR * 0.28, tipY - tipR * 0.3, tipR * 0.42, 0, Math.PI * 2);
    });
  }

  // ── BODY ────────────────────────────────────────────────────
  const bodyGrad = radialGrad(ctx, u(7.0), u(9.4 + by), u(4.2), bodL, bodD);
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.0 + by), u(3.7), u(3.2), 0, 0, Math.PI * 2);
  });
  // Cream belly
  fill(ctx, cream, 0.56, () => {
    ctx.ellipse(u(8), u(10.7 + by), u(2.2), u(1.9), 0, 0, Math.PI * 2);
  });

  // ── ARMS ────────────────────────────────────────────────────
  blob(ctx, bodM, ink, lw, () => {
    ctx.ellipse(u(4.6), u(10.3 + by), u(0.9), u(1.35), -0.3, 0, Math.PI * 2);
  });
  blob(ctx, bodM, ink, lw, () => {
    ctx.ellipse(u(11.4), u(10.3 + by), u(0.9), u(1.35), 0.3, 0, Math.PI * 2);
  });

  // ── FEET ────────────────────────────────────────────────────
  blob(ctx, bodD, ink, lw, () => {
    ctx.ellipse(u(5.8), u(13.5 + by + legL), u(1.5), u(0.9), 0.06, 0, Math.PI * 2);
  });
  blob(ctx, bodD, ink, lw, () => {
    ctx.ellipse(u(10.2), u(13.5 + by + legR), u(1.5), u(0.9), -0.06, 0, Math.PI * 2);
  });
  // Cream toe pads
  blob(ctx, creamD, ink, lw * 0.7, () => {
    ctx.ellipse(u(5.8), u(14.1 + by + legL), u(1.1), u(0.52), 0, 0, Math.PI * 2);
  });
  blob(ctx, creamD, ink, lw * 0.7, () => {
    ctx.ellipse(u(10.2), u(14.1 + by + legR), u(1.1), u(0.52), 0, 0, Math.PI * 2);
  });

  // ── EARS (behind head) ──────────────────────────────────────
  blob(ctx, bodM, ink, lw, () => {
    ctx.moveTo(u(4.8), u(3.8 + by));
    ctx.bezierCurveTo(u(3.4), u(0.8 + by), u(4.6), u(-1.6 + by), u(5.6), u(-1.4 + by));
    ctx.bezierCurveTo(u(6.6), u(-1.0 + by), u(7.0), u(1.4 + by), u(6.6), u(3.8 + by));
    ctx.closePath();
  });
  fill(ctx, creamD, 0.72, () => {
    ctx.moveTo(u(5.1), u(3.5 + by));
    ctx.bezierCurveTo(u(4.2), u(1.2 + by), u(5.1), u(-0.8 + by), u(5.6), u(-0.7 + by));
    ctx.bezierCurveTo(u(6.1), u(-0.5 + by), u(6.3), u(1.3 + by), u(6.1), u(3.5 + by));
    ctx.closePath();
  });
  blob(ctx, bodM, ink, lw, () => {
    ctx.moveTo(u(9.4), u(3.8 + by));
    ctx.bezierCurveTo(u(9.0), u(1.4 + by), u(9.4), u(-1.0 + by), u(10.4), u(-1.4 + by));
    ctx.bezierCurveTo(u(11.4), u(-1.6 + by), u(12.6), u(0.8 + by), u(11.2), u(3.8 + by));
    ctx.closePath();
  });
  fill(ctx, creamD, 0.72, () => {
    ctx.moveTo(u(9.9), u(3.5 + by));
    ctx.bezierCurveTo(u(9.7), u(1.3 + by), u(9.9), u(-0.5 + by), u(10.4), u(-0.7 + by));
    ctx.bezierCurveTo(u(10.9), u(-0.8 + by), u(11.8), u(1.2 + by), u(10.9), u(3.5 + by));
    ctx.closePath();
  });

  // ── HEAD ────────────────────────────────────────────────────
  const headGrad = radialGrad(ctx, u(7.0), u(4.0 + by), u(3.6), bodL, bodM);
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.8 + by), u(3.4), u(3.1), 0, 0, Math.PI * 2);
  });

  // ── CHEEKS (mood-reactive) ───────────────────────────────────
  const cheekR = mood === 'happy' ? 1.18 : mood === 'tired' ? 0.82 : 1.0;
  fill(ctx, '#f08870', 0.32 * cheekR, () => {
    ctx.ellipse(u(5.25), u(5.85 + by), u(0.95 * cheekR), u(0.68 * cheekR), 0, 0, Math.PI * 2);
    ctx.ellipse(u(10.75), u(5.85 + by), u(0.95 * cheekR), u(0.68 * cheekR), 0, 0, Math.PI * 2);
  });

  // ── MUZZLE ──────────────────────────────────────────────────
  fill(ctx, creamD, 0.6, () => {
    ctx.ellipse(u(8), u(6.1 + by), u(1.8), u(1.2), 0, 0, Math.PI * 2);
  });

  // ── EYES ────────────────────────────────────────────────────
  const ey = 4.6 + by;
  if (mood === 'tired') {
    if (blinkOpen) {
      fill(ctx, amber, 0.75, () => {
        ctx.arc(u(6.55), u(ey), u(0.6), 0, Math.PI * 2);
        ctx.arc(u(9.45), u(ey), u(0.6), 0, Math.PI * 2);
      });
      stroke(ctx, ink, u(0.27), 0.9, () => {
        ctx.moveTo(u(5.85), u(ey - 0.4)); ctx.lineTo(u(7.25), u(ey - 0.4));
        ctx.moveTo(u(8.75), u(ey - 0.4)); ctx.lineTo(u(10.15), u(ey - 0.4));
      });
    } else {
      stroke(ctx, ink, u(0.24), 1, () => {
        ctx.moveTo(u(6.0), u(ey)); ctx.lineTo(u(7.1), u(ey));
        ctx.moveTo(u(8.9), u(ey)); ctx.lineTo(u(10.0), u(ey));
      });
    }
  } else if (!blinkOpen) {
    stroke(ctx, ink, u(0.24), 1, () => {
      ctx.moveTo(u(6.0), u(ey)); ctx.lineTo(u(7.1), u(ey));
      ctx.moveTo(u(8.9), u(ey)); ctx.lineTo(u(10.0), u(ey));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.3 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.2 : 0;
    blob(ctx, amber, ink, u(0.1), () => { ctx.ellipse(u(6.55), u(ey), u(0.88), u(0.96), 0, 0, Math.PI * 2); });
    blob(ctx, amber, ink, u(0.1), () => { ctx.ellipse(u(9.45), u(ey), u(0.88), u(0.96), 0, 0, Math.PI * 2); });
    fill(ctx, '#3a1a00', 1, () => {
      ctx.arc(u(6.55 + ex * 0.35), u(ey + edy * 0.35), u(0.48), 0, Math.PI * 2);
      ctx.arc(u(9.45 + ex * 0.35), u(ey + edy * 0.35), u(0.48), 0, Math.PI * 2);
    });
    glint(ctx, u(6.28 + ex * 0.2), u(ey - 0.34 + edy * 0.2), u(0.27));
    glint(ctx, u(9.18 + ex * 0.2), u(ey - 0.34 + edy * 0.2), u(0.27));
  }

  // ── NOSE + MOUTH ────────────────────────────────────────────
  fill(ctx, '#882210', 0.9, () => {
    ctx.ellipse(u(8), u(5.65 + by), u(0.28), u(0.2), 0, 0, Math.PI * 2);
  });
  if (mood === 'happy') {
    stroke(ctx, ink, u(0.17), 0.9, () => {
      ctx.moveTo(u(7.0), u(6.2 + by));
      ctx.quadraticCurveTo(u(8), u(6.92 + by), u(9.0), u(6.2 + by));
    });
  } else if (mood === 'tired') {
    stroke(ctx, ink, u(0.16), 0.7, () => {
      ctx.moveTo(u(7.4), u(6.28 + by)); ctx.lineTo(u(8.6), u(6.28 + by));
    });
  } else {
    stroke(ctx, ink, u(0.16), 0.82, () => {
      ctx.moveTo(u(7.3), u(6.1 + by));
      ctx.quadraticCurveTo(u(8), u(6.62 + by), u(8.7), u(6.1 + by));
    });
  }

  // ── EMBER PARTICLES (subtle) ─────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const ep    = (t * 0.52 + i * 16) % 50;
    const life  = ep / 50;
    const alpha = Math.sin(life * Math.PI) * 0.36;
    if (alpha < 0.04) continue;
    const ex = u(9.8 + (i - 1.5) * 1.5 + Math.sin(life * Math.PI * 2 + i) * 0.7);
    const ey2 = u(8.5 - life * 6.0);
    fill(ctx, i % 2 ? '#FF8822' : '#FFCC44', alpha, () => {
      ctx.arc(ex, ey2, u(0.36 + (1 - life) * 0.26), 0, Math.PI * 2);
    });
  }
}
