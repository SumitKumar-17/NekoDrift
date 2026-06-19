import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawMewtwo(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;

  // Mewtwo floats slightly above ground with a gentle oscillation
  const float    = Math.sin(t * 0.04) * 0.55 - 0.5;
  const bob      = float;
  const auraAlpha = 0.18 + Math.sin(t * 0.08) * 0.07;
  const blinkOpen = !((t % 220) > 213);
  const tailCurl  = Math.sin(t * 0.06) * 14;

  // ── Palette ──────────────────────────────────────────────────
  const ink      = '#2a1f40';
  const body     = '#B8A8D8';
  const bodyLight= '#D0C4EC';
  const bodyDark = '#7864A8';
  const neck     = '#D8CDE8';
  const eyeBlue  = '#4080FF';
  const eyeLight = '#80B0FF';
  const aura     = '#C060FF';
  const white    = '#FFFFFF';
  const lw       = u(0.22);

  const bodyGrad = radialGrad(ctx, u(8), u(9.5 + bob), u(4.0), bodyLight, bodyDark);
  const headGrad = radialGrad(ctx, u(7.8), u(4.8 + bob), u(3.2), bodyLight, body);

  // ── Psychic aura glow (subtle halo) ─────────────────────────
  fill(ctx, aura, auraAlpha * 0.5, () => {
    ctx.ellipse(u(8), u(8.5 + bob), u(5.5), u(7.0), 0, 0, Math.PI * 2);
  });
  fill(ctx, aura, auraAlpha * 0.25, () => {
    ctx.ellipse(u(8), u(8.5 + bob), u(7.0), u(9.0), 0, 0, Math.PI * 2);
  });

  // ── Ground shadow (faint, Mewtwo floats) ─────────────────────
  groundShadow(ctx, u(8), u(15.8), u(3.0), u(0.6), 0.10);

  // ── Tail (long, spoon-shaped) ────────────────────────────────
  ctx.save();
  ctx.translate(u(10.5), u(10.0 + bob));
  ctx.rotate((tailCurl * Math.PI) / 180);

  // Tail shaft
  stroke(ctx, bodyDark, u(0.5), 1, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(u(2.0), u(-2.5), u(1.5), u(-5.5));
  });
  stroke(ctx, body, u(0.28), 1, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(u(2.0), u(-2.5), u(1.5), u(-5.5));
  });

  // Spoon tip
  blob(ctx, bodyLight, ink, lw, () => {
    ctx.ellipse(u(1.5), u(-5.8), u(1.0), u(0.8), 0.3, 0, Math.PI * 2);
  });

  ctx.restore();

  // ── Legs (short, floating slightly) ─────────────────────────
  blob(ctx, body, ink, lw, () => {
    ctx.ellipse(u(6.2), u(13.2 + bob), u(1.0), u(1.6), -0.15, 0, Math.PI * 2);
  });
  blob(ctx, body, ink, lw, () => {
    ctx.ellipse(u(9.8), u(13.2 + bob), u(1.0), u(1.6), 0.15, 0, Math.PI * 2);
  });
  // Feet (small rounded)
  blob(ctx, bodyDark, ink, lw * 0.8, () => {
    ctx.ellipse(u(5.8), u(14.7 + bob), u(1.2), u(0.5), -0.2, 0, Math.PI * 2);
  });
  blob(ctx, bodyDark, ink, lw * 0.8, () => {
    ctx.ellipse(u(10.2), u(14.7 + bob), u(1.2), u(0.5), 0.2, 0, Math.PI * 2);
  });

  // ── Main body ────────────────────────────────────────────────
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(9.5 + bob), u(3.2), u(4.0), 0, 0, Math.PI * 2);
  });

  // Chest — lighter patch
  fill(ctx, bodyLight, 0.55, () => {
    ctx.ellipse(u(7.8), u(9.0 + bob), u(1.8), u(2.4), 0, 0, Math.PI * 2);
  });

  // ── Arms ────────────────────────────────────────────────────
  // Left arm
  blob(ctx, body, ink, lw, () => {
    ctx.ellipse(u(5.2), u(9.2 + bob), u(0.9), u(2.2), -0.25, 0, Math.PI * 2);
  });
  blob(ctx, bodyDark, ink, lw * 0.8, () => {
    ctx.ellipse(u(4.7), u(11.0 + bob), u(1.0), u(0.55), -0.1, 0, Math.PI * 2);
  });

  // Right arm
  blob(ctx, body, ink, lw, () => {
    ctx.ellipse(u(10.8), u(9.2 + bob), u(0.9), u(2.2), 0.25, 0, Math.PI * 2);
  });
  blob(ctx, bodyDark, ink, lw * 0.8, () => {
    ctx.ellipse(u(11.3), u(11.0 + bob), u(1.0), u(0.55), 0.1, 0, Math.PI * 2);
  });

  // ── Neck ─────────────────────────────────────────────────────
  blob(ctx, neck, ink, lw * 0.7, () => {
    ctx.ellipse(u(7.8), u(6.8 + bob), u(1.4), u(1.2), 0, 0, Math.PI * 2);
  });

  // ── Head ─────────────────────────────────────────────────────
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(7.8), u(4.5 + bob), u(3.0), u(3.2), 0, 0, Math.PI * 2);
  });

  // ── Head "crown" tubes ───────────────────────────────────────
  blob(ctx, bodyDark, ink, lw * 0.7, () => {
    ctx.ellipse(u(6.2), u(2.3 + bob), u(0.65), u(1.5), -0.2, 0, Math.PI * 2);
  });
  blob(ctx, bodyDark, ink, lw * 0.7, () => {
    ctx.ellipse(u(9.4), u(2.3 + bob), u(0.65), u(1.5), 0.2, 0, Math.PI * 2);
  });

  // ── Eyes ─────────────────────────────────────────────────────
  const eyeBaseY = u(4.6 + bob);
  const eyeXs = [6.6, 9.0];
  const eDx = eyeDir ? eyeDir.dx * u(0.16) : 0;
  const eDy = eyeDir ? eyeDir.dy * u(0.16) : 0;

  for (const ex of eyeXs) {
    // Eye socket
    fill(ctx, ink, 0.35, () => {
      ctx.ellipse(u(ex), eyeBaseY, u(0.85), u(0.85), 0, 0, Math.PI * 2);
    });

    if (blinkOpen) {
      // Iris
      fill(ctx, eyeBlue, 1, () => {
        ctx.ellipse(u(ex) + eDx, eyeBaseY + eDy, u(0.62), u(0.62), 0, 0, Math.PI * 2);
      });
      fill(ctx, eyeLight, 0.6, () => {
        ctx.ellipse(u(ex) + eDx, eyeBaseY + eDy, u(0.32), u(0.32), 0, 0, Math.PI * 2);
      });
      // Psychic glow around iris
      stroke(ctx, aura, u(0.08), auraAlpha * 2.0, () => {
        ctx.arc(u(ex) + eDx, eyeBaseY + eDy, u(0.62), 0, Math.PI * 2);
      });
      glint(ctx, u(ex) + eDx - u(0.2), eyeBaseY + eDy - u(0.2), u(0.12));
    } else {
      stroke(ctx, ink, lw * 0.8, 0.9, () => {
        ctx.moveTo(u(ex - 0.7), eyeBaseY);
        ctx.lineTo(u(ex + 0.7), eyeBaseY);
      });
    }
  }

  // ── Brow ridges (narrow, stern) ───────────────────────────────
  stroke(ctx, bodyDark, lw * 1.1, 0.85, () => {
    ctx.moveTo(u(5.9), u(3.6 + bob));
    ctx.lineTo(u(7.2), u(3.9 + bob));
  });
  stroke(ctx, bodyDark, lw * 1.1, 0.85, () => {
    ctx.moveTo(u(9.7), u(3.6 + bob));
    ctx.lineTo(u(8.4), u(3.9 + bob));
  });

  // ── Nose (barely visible) ────────────────────────────────────
  fill(ctx, bodyDark, 0.5, () => {
    ctx.ellipse(u(7.8), u(5.6 + bob), u(0.22), u(0.14), 0, 0, Math.PI * 2);
  });

  // ── Subtle psychic energy orb in chest ───────────────────────
  if (mood === 'happy') {
    fill(ctx, aura, auraAlpha * 1.8, () => {
      ctx.arc(u(7.8), u(9.0 + bob), u(0.8), 0, Math.PI * 2);
    });
    fill(ctx, white, auraAlpha * 1.5, () => {
      ctx.arc(u(7.8), u(9.0 + bob), u(0.4), 0, Math.PI * 2);
    });
  }
}
