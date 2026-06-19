import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawFlareon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.058) * 0.36;
  const walk      = Math.sin(t * 0.13);
  const tailSwing = Math.sin(t * 0.05) * 14;
  const blinkOpen = !((t % 190) > 183);
  const legL = walk * 0.46;
  const legR = -walk * 0.46;

  // ── Palette ─────────────────────────────────────────────────
  const ink    = '#801500';
  const bodL   = '#EE7030';   // body highlight
  const bodM   = '#D05818';   // body mid
  const bodD   = '#A03010';   // body dark
  const cream  = '#FFEECC';   // mane cream
  const creamL = '#FFF8E8';
  const maneO  = '#FF8800';   // mane orange
  const maneY  = '#FFAA44';   // mane yellow
  const amber  = '#8B4513';   // iris
  const lw = u(0.26);

  groundShadow(ctx, u(8), u(15.4), u(4.2), u(0.9), 0.18);

  // ── FLAME TAIL (behind body) ──────────────────────────────────
  ctx.save();
  ctx.translate(u(11.4), u(10.0 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  // Base tail
  blob(ctx, bodD, ink, lw, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(u(1.5), u(-1.5), u(2.5), u(-4.2), u(2.0), u(-6.6));
    ctx.bezierCurveTo(u(1.0), u(-6.0), u(0.5), u(-3.0), u(0), u(-0.5));
    ctx.closePath();
  });
  // 3 animated flame layers on tail
  const tailColors = [maneO, maneY, '#FFDD44'];
  for (let fi = 0; fi < 3; fi++) {
    const flicker = Math.sin(t * 0.16 + fi * 0.9) * u(0.5);
    fill(ctx, tailColors[fi], 0.62 + fi * 0.1, () => {
      ctx.moveTo(u(0.5), u(-3.0) + flicker);
      ctx.bezierCurveTo(
        u(1.0), u(-4.6) + flicker,
        u(2.6) + flicker * 0.3, u(-6.2),
        u(2.0) + u(fi * 0.2), u(-7.2) + flicker * 0.5,
      );
      ctx.bezierCurveTo(u(1.5), u(-6.6), u(0.5), u(-4.2), u(0), u(-3.0) + flicker);
      ctx.closePath();
    });
  }
  ctx.restore();

  // ── BODY ────────────────────────────────────────────────────
  const bodyGrad = radialGrad(ctx, u(7.0), u(9.4 + by), u(4.2), bodL, bodD);
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.2 + by), u(3.8), u(3.3), 0, 0, Math.PI * 2);
  });
  // Cream inner belly
  fill(ctx, cream, 0.42, () => {
    ctx.ellipse(u(8), u(10.9 + by), u(2.4), u(2.0), 0, 0, Math.PI * 2);
  });

  // ── FLUFFY MANE (front of body — Flareon's signature feature) ─
  // 7 overlapping puffy circles radiating from chest center
  const maneCenter = { x: u(8), y: u(7.8 + by) };
  const maneRings = [
    // [offsetX, offsetY, radius, color, alpha]
    [u(-2.2), u(0.8), u(2.3), maneO,  0.80],
    [u( 2.2), u(0.8), u(2.3), maneO,  0.80],
    [u( 0.0), u(0.2), u(2.5), maneY,  0.76],
    [u(-1.6), u(-0.7), u(1.9), maneY, 0.72],
    [u( 1.6), u(-0.7), u(1.9), maneY, 0.72],
    [u( 0.0), u(-1.4), u(1.7), '#FFCC44', 0.68],
  ] as [number, number, number, string, number][];
  for (const [ox, oy, r, colour, a] of maneRings) {
    const flicker = Math.sin(t * 0.072 + ox * 0.3) * u(0.18);
    fill(ctx, colour, a, () => {
      ctx.arc(maneCenter.x + ox + flicker, maneCenter.y + oy, r, 0, Math.PI * 2);
    });
  }
  // Bright cream center of mane
  fill(ctx, creamL, 0.55, () => {
    ctx.arc(maneCenter.x, maneCenter.y - u(0.5), u(1.4), 0, Math.PI * 2);
  });

  // ── LEGS ────────────────────────────────────────────────────
  blob(ctx, bodM, ink, lw, () => {
    ctx.ellipse(u(5.8), u(13.5 + by + legL), u(1.3), u(1.75), 0.06, 0, Math.PI * 2);
  });
  blob(ctx, bodM, ink, lw, () => {
    ctx.ellipse(u(10.2), u(13.5 + by + legR), u(1.3), u(1.75), -0.06, 0, Math.PI * 2);
  });
  // Cream toe pads
  blob(ctx, cream, ink, lw * 0.7, () => {
    ctx.ellipse(u(5.8), u(14.5 + by + legL), u(1.1), u(0.56), 0, 0, Math.PI * 2);
  });
  blob(ctx, cream, ink, lw * 0.7, () => {
    ctx.ellipse(u(10.2), u(14.5 + by + legR), u(1.1), u(0.56), 0, 0, Math.PI * 2);
  });

  // ── EARS ────────────────────────────────────────────────────
  blob(ctx, bodM, ink, lw, () => {
    ctx.moveTo(u(4.8), u(3.6 + by));
    ctx.lineTo(u(3.0), u(-1.2 + by));
    ctx.lineTo(u(6.0), u(0.2 + by));
    ctx.closePath();
  });
  fill(ctx, cream, 0.42, () => {
    ctx.moveTo(u(4.9), u(3.2 + by));
    ctx.lineTo(u(3.5), u(-0.8 + by));
    ctx.lineTo(u(5.7), u(0.4 + by));
    ctx.closePath();
  });
  blob(ctx, bodM, ink, lw, () => {
    ctx.moveTo(u(11.2), u(3.6 + by));
    ctx.lineTo(u(13.0), u(-1.2 + by));
    ctx.lineTo(u(10.0), u(0.2 + by));
    ctx.closePath();
  });
  fill(ctx, cream, 0.42, () => {
    ctx.moveTo(u(11.1), u(3.2 + by));
    ctx.lineTo(u(12.5), u(-0.8 + by));
    ctx.lineTo(u(10.3), u(0.4 + by));
    ctx.closePath();
  });

  // ── HEAD ────────────────────────────────────────────────────
  const headGrad = radialGrad(ctx, u(7.0), u(3.9 + by), u(3.6), bodL, bodM);
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.8 + by), u(3.4), u(3.1), 0, 0, Math.PI * 2);
  });

  // ── CHEEKS (mood-reactive) ───────────────────────────────────
  const cheekR = mood === 'happy' ? 1.18 : mood === 'tired' ? 0.8 : 1.0;
  fill(ctx, '#FF9966', 0.3 * cheekR, () => {
    ctx.ellipse(u(5.3), u(5.85 + by), u(0.9 * cheekR), u(0.65 * cheekR), 0, 0, Math.PI * 2);
    ctx.ellipse(u(10.7), u(5.85 + by), u(0.9 * cheekR), u(0.65 * cheekR), 0, 0, Math.PI * 2);
  });

  // ── MUZZLE ──────────────────────────────────────────────────
  fill(ctx, cream, 0.5, () => {
    ctx.ellipse(u(8), u(6.1 + by), u(1.7), u(1.1), 0, 0, Math.PI * 2);
  });

  // ── EYES ────────────────────────────────────────────────────
  const ey = 4.6 + by;
  if (mood === 'tired') {
    if (blinkOpen) {
      fill(ctx, amber, 0.7, () => {
        ctx.arc(u(6.55), u(ey), u(0.6), 0, Math.PI * 2);
        ctx.arc(u(9.45), u(ey), u(0.6), 0, Math.PI * 2);
      });
      stroke(ctx, ink, u(0.26), 0.88, () => {
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
    // White sclera
    blob(ctx, '#FFFFFF', ink, u(0.1), () => { ctx.ellipse(u(6.55), u(ey), u(1.0), u(1.1), 0, 0, Math.PI * 2); });
    blob(ctx, '#FFFFFF', ink, u(0.1), () => { ctx.ellipse(u(9.45), u(ey), u(1.0), u(1.1), 0, 0, Math.PI * 2); });
    // Brown iris
    fill(ctx, amber, 1, () => {
      ctx.ellipse(u(6.55 + ex * 0.35), u(ey + edy * 0.35), u(0.7), u(0.78), 0, 0, Math.PI * 2);
      ctx.ellipse(u(9.45 + ex * 0.35), u(ey + edy * 0.35), u(0.7), u(0.78), 0, 0, Math.PI * 2);
    });
    fill(ctx, '#3B1000', 1, () => {
      ctx.arc(u(6.55 + ex * 0.5), u(ey + edy * 0.5), u(0.42), 0, Math.PI * 2);
      ctx.arc(u(9.45 + ex * 0.5), u(ey + edy * 0.5), u(0.42), 0, Math.PI * 2);
    });
    glint(ctx, u(6.28 + ex * 0.2), u(ey - 0.34 + edy * 0.2), u(0.25));
    glint(ctx, u(9.18 + ex * 0.2), u(ey - 0.34 + edy * 0.2), u(0.25));
  }

  // ── NOSE + MOUTH ────────────────────────────────────────────
  fill(ctx, bodD, 0.88, () => {
    ctx.arc(u(8), u(5.65 + by), u(0.3), 0, Math.PI * 2);
  });
  if (mood === 'happy') {
    stroke(ctx, ink, u(0.17), 0.88, () => {
      ctx.moveTo(u(7.0), u(6.2 + by));
      ctx.quadraticCurveTo(u(8), u(6.9 + by), u(9.0), u(6.2 + by));
    });
  } else if (mood === 'tired') {
    stroke(ctx, ink, u(0.16), 0.7, () => {
      ctx.moveTo(u(7.4), u(6.28 + by)); ctx.lineTo(u(8.6), u(6.28 + by));
    });
  } else {
    stroke(ctx, ink, u(0.16), 0.8, () => {
      ctx.moveTo(u(7.3), u(6.1 + by));
      ctx.quadraticCurveTo(u(8), u(6.6 + by), u(8.7), u(6.1 + by));
    });
  }

  // ── EMBER PARTICLES ─────────────────────────────────────────
  const emberCount = mood === 'happy' ? 6 : 3;
  for (let i = 0; i < emberCount; i++) {
    const ep    = (t * 0.54 + i * 18) % 52;
    const life  = ep / 52;
    const alpha = Math.sin(life * Math.PI) * 0.52;
    if (alpha < 0.05) continue;
    const ex = u(8 + (i - emberCount / 2) * 1.8 + Math.sin(life * Math.PI * 2 + i) * 0.9);
    const ey2 = u(6.5 - life * 7.5);
    fill(ctx, i % 2 ? '#FF8800' : '#FFCC44', alpha, () => {
      ctx.arc(ex, ey2, u(0.42 + (1 - life) * 0.3), 0, Math.PI * 2);
    });
  }
}
