import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawSylveon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.056) * 0.38;
  const walk      = Math.sin(t * 0.13);
  const tailSwing = Math.sin(t * 0.046) * 11;
  const blinkOpen = !((t % 205) > 198);
  const legL = walk * 0.46;
  const legR = -walk * 0.46;

  // ── Palette ─────────────────────────────────────────────────
  const ink    = '#8B1A5A';
  const pinkL  = '#FADADD';   // body highlight
  const pinkM  = '#F8A8C8';   // body mid
  const pinkD  = '#E880B0';   // body dark
  const hot    = '#F868A8';   // accent pink
  const white  = '#FFFFFF';
  const blue   = '#66AAEE';   // iris
  const blueDk = '#224477';   // pupil
  const cream  = '#FFF4F8';
  const lw = u(0.26);

  groundShadow(ctx, u(8), u(15.3), u(4.2), u(0.9), 0.18);

  // ── RIBBON FEELERS (4 total, behind head/body) ───────────────
  // Pairs: left ear pair (ri=0,1) and right ear pair (ri=2,3)
  for (let ri = 0; ri < 4; ri++) {
    const side = ri < 2 ? -1 : 1;
    const idx = ri % 2;
    const sway = Math.sin(t * 0.038 + ri * 0.78) * 11 + (mood === 'happy' ? 4 : 0);
    const startX = u(8 + side * 2.8);
    const startY = u(3.4 + by);
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate((sway * Math.PI) / 180);
    // Ribbon body — feather-like tapered shape
    const rColour = idx === 0 ? pinkM : pinkL;
    blob(ctx, rColour, pinkD, lw * 0.6, () => {
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        u(side * 1.8), u(2.2),
        u(side * 2.8 + (idx ? 0.5 * side : 0)), u(5.2),
        u(side * 2.0 + (idx ? 0.8 * side : -0.3 * side)), u(8.0),
      );
      ctx.bezierCurveTo(
        u(side * 2.4), u(7.0),
        u(side * 0.8), u(3.8),
        u(0), u(0.4),
      );
      ctx.closePath();
    });
    // Bow knot at base
    const bow = u(0.55);
    fill(ctx, hot, 0.88, () => {
      ctx.ellipse(-bow, u(0.28), bow, bow * 0.52, 0.3, 0, Math.PI * 2);
      ctx.ellipse(bow, u(0.28), bow, bow * 0.52, -0.3, 0, Math.PI * 2);
    });
    fill(ctx, '#FF99CC', 0.92, () => {
      ctx.arc(0, u(0.28), bow * 0.38, 0, Math.PI * 2);
    });
    ctx.restore();
  }

  // ── TAIL ────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(u(11.8), u(10.0 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, pinkM, pinkD, lw, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(u(2.0), u(-1.0), u(3.2), u(-4.2), u(2.2), u(-6.2));
    ctx.bezierCurveTo(u(1.0), u(-5.6), u(0.4), u(-2.2), u(0), u(-0.4));
    ctx.closePath();
  });
  // Tail tip
  fill(ctx, cream, 0.6, () => {
    ctx.arc(u(1.6), u(-5.6), u(0.9), 0, Math.PI * 2);
  });
  ctx.restore();

  // ── BODY ────────────────────────────────────────────────────
  const bodyGrad = radialGrad(ctx, u(7.0), u(9.4 + by), u(4.2), pinkL, pinkD);
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.0 + by), u(3.7), u(3.1), 0, 0, Math.PI * 2);
  });
  // White belly
  fill(ctx, cream, 0.5, () => {
    ctx.ellipse(u(8), u(10.8 + by), u(2.4), u(2.0), 0, 0, Math.PI * 2);
  });
  // Blue chest band
  fill(ctx, '#88CCEE', 0.3, () => {
    ctx.ellipse(u(7.6), u(8.8 + by), u(2.0), u(0.55), -0.18, 0, Math.PI * 2);
  });

  // ── LEGS ────────────────────────────────────────────────────
  blob(ctx, pinkM, ink, lw, () => {
    ctx.ellipse(u(5.8), u(13.5 + by + legL), u(1.2), u(1.75), 0.05, 0, Math.PI * 2);
  });
  blob(ctx, pinkM, ink, lw, () => {
    ctx.ellipse(u(10.2), u(13.5 + by + legR), u(1.2), u(1.75), -0.05, 0, Math.PI * 2);
  });
  // White sock paws
  blob(ctx, white, pinkD, lw * 0.7, () => {
    ctx.ellipse(u(5.8), u(14.4 + by + legL), u(1.2), u(0.68), 0, 0, Math.PI * 2);
  });
  blob(ctx, white, pinkD, lw * 0.7, () => {
    ctx.ellipse(u(10.2), u(14.4 + by + legR), u(1.2), u(0.68), 0, 0, Math.PI * 2);
  });

  // ── EARS ────────────────────────────────────────────────────
  blob(ctx, pinkM, ink, lw, () => {
    ctx.arc(u(5.2), u(2.4 + by), u(1.5), 0, Math.PI * 2);
  });
  blob(ctx, pinkM, ink, lw, () => {
    ctx.arc(u(10.8), u(2.4 + by), u(1.5), 0, Math.PI * 2);
  });
  fill(ctx, hot, 0.5, () => {
    ctx.arc(u(5.2), u(2.4 + by), u(0.82), 0, Math.PI * 2);
    ctx.arc(u(10.8), u(2.4 + by), u(0.82), 0, Math.PI * 2);
  });

  // ── HEAD ────────────────────────────────────────────────────
  const headGrad = radialGrad(ctx, u(7.0), u(4.0 + by), u(3.6), pinkL, pinkM);
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.8 + by), u(3.4), u(3.1), 0, 0, Math.PI * 2);
  });

  // ── CHEEKS (mood-reactive) ───────────────────────────────────
  const cheekR = mood === 'happy' ? 1.2 : mood === 'tired' ? 0.8 : 1.0;
  fill(ctx, '#FF99CC', 0.35 * cheekR, () => {
    ctx.ellipse(u(5.3), u(5.85 + by), u(0.92 * cheekR), u(0.65 * cheekR), 0, 0, Math.PI * 2);
    ctx.ellipse(u(10.7), u(5.85 + by), u(0.92 * cheekR), u(0.65 * cheekR), 0, 0, Math.PI * 2);
  });

  // ── MUZZLE ──────────────────────────────────────────────────
  fill(ctx, cream, 0.55, () => {
    ctx.ellipse(u(8), u(6.0 + by), u(1.7), u(1.15), 0, 0, Math.PI * 2);
  });

  // ── EYES (big blue fairy eyes) ────────────────────────────────
  const ey = 4.6 + by;
  if (mood === 'tired') {
    if (blinkOpen) {
      fill(ctx, blue, 0.7, () => {
        ctx.arc(u(6.5), u(ey), u(0.68), 0, Math.PI * 2);
        ctx.arc(u(9.5), u(ey), u(0.68), 0, Math.PI * 2);
      });
      stroke(ctx, ink, u(0.28), 0.9, () => {
        ctx.moveTo(u(5.7), u(ey - 0.48)); ctx.lineTo(u(7.3), u(ey - 0.48));
        ctx.moveTo(u(8.7), u(ey - 0.48)); ctx.lineTo(u(10.3), u(ey - 0.48));
      });
    } else {
      stroke(ctx, ink, u(0.24), 1, () => {
        ctx.moveTo(u(6.0), u(ey)); ctx.lineTo(u(7.0), u(ey));
        ctx.moveTo(u(9.0), u(ey)); ctx.lineTo(u(10.0), u(ey));
      });
    }
  } else if (!blinkOpen) {
    stroke(ctx, hot, u(0.32), 1, () => {
      ctx.arc(u(6.5), u(ey + 0.3), u(0.82), Math.PI, 0);
      ctx.arc(u(9.5), u(ey + 0.3), u(0.82), Math.PI, 0);
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.3 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.2 : 0;
    // White sclera
    blob(ctx, white, ink, u(0.1), () => { ctx.ellipse(u(6.5), u(ey), u(1.1), u(1.2), 0, 0, Math.PI * 2); });
    blob(ctx, white, ink, u(0.1), () => { ctx.ellipse(u(9.5), u(ey), u(1.1), u(1.2), 0, 0, Math.PI * 2); });
    // Blue iris
    fill(ctx, blue, 1, () => {
      ctx.ellipse(u(6.5 + ex * 0.35), u(ey + edy * 0.35), u(0.76), u(0.84), 0, 0, Math.PI * 2);
      ctx.ellipse(u(9.5 + ex * 0.35), u(ey + edy * 0.35), u(0.76), u(0.84), 0, 0, Math.PI * 2);
    });
    // Pupils
    fill(ctx, blueDk, 1, () => {
      ctx.arc(u(6.5 + ex * 0.5), u(ey + edy * 0.5), u(0.44), 0, Math.PI * 2);
      ctx.arc(u(9.5 + ex * 0.5), u(ey + edy * 0.5), u(0.44), 0, Math.PI * 2);
    });
    glint(ctx, u(6.22 + ex * 0.2), u(ey - 0.36 + edy * 0.2), u(0.26));
    glint(ctx, u(9.22 + ex * 0.2), u(ey - 0.36 + edy * 0.2), u(0.26));
    // Pink eyelash stroke
    stroke(ctx, hot, u(0.4), 0.65, () => {
      ctx.moveTo(u(5.3), u(ey - 1.0)); ctx.lineTo(u(5.8), u(ey - 1.32));
      ctx.moveTo(u(11.7), u(ey - 1.0)); ctx.lineTo(u(11.2), u(ey - 1.32));
    });
  }

  // ── NOSE + MOUTH ────────────────────────────────────────────
  fill(ctx, hot, 0.8, () => {
    ctx.arc(u(8), u(5.7 + by), u(0.32), 0, Math.PI * 2);
  });
  if (mood === 'happy') {
    stroke(ctx, ink, u(0.17), 0.85, () => {
      ctx.moveTo(u(7.0), u(6.2 + by));
      ctx.quadraticCurveTo(u(8), u(6.9 + by), u(9.0), u(6.2 + by));
    });
  } else {
    stroke(ctx, ink, u(0.16), 0.75, () => {
      ctx.moveTo(u(7.3), u(6.1 + by));
      ctx.quadraticCurveTo(u(8), u(6.6 + by), u(8.7), u(6.1 + by));
    });
  }

  // ── FLOATING FAIRY SPARKLES ──────────────────────────────────
  const sparkCount = mood === 'happy' ? 7 : 3;
  for (let i = 0; i < sparkCount; i++) {
    const phase = (t * 0.5 + i * 18) % 55;
    const life = phase / 55;
    const alpha = Math.sin(life * Math.PI) * (mood === 'happy' ? 0.72 : 0.38);
    if (alpha < 0.05) continue;
    const angle = (i / sparkCount) * Math.PI * 2 + t * 0.024;
    const dist  = u(3.5 + Math.sin(t * 0.06 + i) * 1.4);
    const gx    = u(8) + Math.cos(angle) * dist;
    const gy    = u(4.8 + by) + Math.sin(angle) * dist * 0.6 - life * u(4);
    fill(ctx, i % 2 ? '#FFAAD8' : '#88DDFF', alpha, () => {
      ctx.arc(gx, gy, u(0.48), 0, Math.PI * 2);
    });
  }
}
