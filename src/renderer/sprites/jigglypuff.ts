import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawJigglypuff(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const cy = 8 * s;

  // Jigglypuff bobs on a slow sine — it's round, floaty
  const bob    = Math.sin(frame * 0.05) * 1.0 * s;
  const breath = 1 + Math.sin(frame * 0.07) * 0.025;  // gentle inflate
  const blink  = (frame % 80) < 4;

  // Singing mouth is open every ~4 seconds when mood is happy
  const singing = mood === 'happy' && (frame % 100) < 40;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.3 * s, 0.16);

  // ── Stubby arms ─────────────────────────────────────────────
  const armSwing = Math.sin(frame * 0.06) * 0.8 * s;
  const armColor = '#F4A0C0';
  blob(ctx, armColor, '#C05080', 0.6 * s, () => {
    ctx.ellipse(cx - 5.5 * s, cy + 0.5 * s + bob + armSwing, 1.8 * s, 1.1 * s, -0.5, 0, Math.PI * 2);
  });
  blob(ctx, armColor, '#C05080', 0.6 * s, () => {
    ctx.ellipse(cx + 5.5 * s, cy + 0.5 * s + bob - armSwing, 1.8 * s, 1.1 * s, 0.5, 0, Math.PI * 2);
  });

  // ── Tiny legs ───────────────────────────────────────────────
  blob(ctx, '#F4A0C0', '#C05080', 0.5 * s, () => {
    ctx.ellipse(cx - 1.8 * s, 14.2 * s + bob, 1.5 * s, 1.2 * s, 0, 0, Math.PI * 2);
  });
  blob(ctx, '#F4A0C0', '#C05080', 0.5 * s, () => {
    ctx.ellipse(cx + 1.8 * s, 14.2 * s + bob, 1.5 * s, 1.2 * s, 0, 0, Math.PI * 2);
  });

  // ── Main body (round!) ──────────────────────────────────────
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(breath, breath);
  const bodyGrad = radialGrad(ctx, -1.2 * s, -2 * s, 5 * s, '#FFB8D8', '#F07090');
  blob(ctx, bodyGrad, '#C05080', 0.8 * s, () => {
    ctx.arc(0, 0, 5.5 * s, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Ear tufts ───────────────────────────────────────────────
  const bodyTop = cy + bob - 5.5 * s;
  blob(ctx, '#F4A0C0', '#C05080', 0.6 * s, () => {
    ctx.ellipse(cx - 3 * s, bodyTop + 0.5 * s, 1.5 * s, 2.2 * s, -0.4, 0, Math.PI * 2);
  });
  blob(ctx, '#F4A0C0', '#C05080', 0.6 * s, () => {
    ctx.ellipse(cx + 3 * s, bodyTop + 0.5 * s, 1.5 * s, 2.2 * s, 0.4, 0, Math.PI * 2);
  });
  // Ear inner
  fill(ctx, '#FFD0E8', 0.7, () => {
    ctx.ellipse(cx - 3 * s, bodyTop + 0.6 * s, 0.8 * s, 1.4 * s, -0.4, 0, Math.PI * 2);
  });
  fill(ctx, '#FFD0E8', 0.7, () => {
    ctx.ellipse(cx + 3 * s, bodyTop + 0.6 * s, 0.8 * s, 1.4 * s, 0.4, 0, Math.PI * 2);
  });

  // ── Curl on top of head ──────────────────────────────────────
  stroke(ctx, '#C05080', 0.8 * s, 0.9, () => {
    ctx.moveTo(cx + 0.5 * s, bodyTop + 0.3 * s);
    ctx.bezierCurveTo(cx + 2 * s, bodyTop - 1.5 * s, cx + 3.5 * s, bodyTop - 0.5 * s, cx + 2.5 * s, bodyTop + 0.8 * s);
  });

  // ── Eyes ────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.5 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.3 * s : 0;
  const eyeY = cy - 1.2 * s + bob;

  [cx - 2 * s, cx + 2 * s].forEach((ex) => {
    if (!blink) {
      // Jigglypuff has LARGE sparkly eyes
      blob(ctx, '#c8e8ff', '#4080C8', 0.6 * s, () => {
        ctx.ellipse(ex, eyeY, 1.8 * s, 2.0 * s, 0, 0, Math.PI * 2);
      });
      // Iris gradient (teal-blue)
      const irisG = radialGrad(ctx, ex + edx * 0.5 - 0.3 * s, eyeY + edy - 0.4 * s, 0.5 * s, '#60B0E8', '#2060A0');
      fill(ctx, irisG, 1, () => {
        ctx.ellipse(ex + edx * 0.5, eyeY + edy, 1.4 * s, 1.5 * s, 0, 0, Math.PI * 2);
      });
      // Pupil
      fill(ctx, '#0a1a2a', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.7 * s, 0.8 * s, 0, 0, Math.PI * 2);
      });
      // Multiple glints for sparkle
      glint(ctx, ex + edx - 0.5 * s, eyeY + edy - 0.6 * s, 0.3 * s);
      glint(ctx, ex + edx + 0.3 * s, eyeY + edy - 0.3 * s, 0.18 * s);
    } else {
      stroke(ctx, '#C05080', 0.7 * s, 1, () => {
        ctx.arc(ex, eyeY + 0.5 * s, 1.2 * s, Math.PI * 1.02, Math.PI * 1.98);
      });
    }
  });

  // ── Mouth + singing ─────────────────────────────────────────
  const mouthY = cy + 1.6 * s + bob;
  if (singing) {
    // Open mouth — singing "laaaaa"
    blob(ctx, '#8B1A3A', '#C05080', 0.5 * s, () => {
      ctx.ellipse(cx, mouthY + 0.4 * s, 1.8 * s, 1.2 * s, 0, 0, Math.PI * 2);
    });
    // Tongue
    fill(ctx, '#FF8080', 0.9, () => {
      ctx.ellipse(cx, mouthY + 0.9 * s, 1.0 * s, 0.7 * s, 0, 0, Math.PI * 2);
    });
    // Musical note floating up
    const noteY = eyeY - 3.5 * s - ((frame * 1.2) % (4 * s));
    const noteAlpha = 1 - (((frame * 1.2) % (4 * s)) / (4 * s));
    fill(ctx, '#C05080', noteAlpha * 0.8, () => {
      ctx.arc(cx + 3 * s, noteY, 0.6 * s, 0, Math.PI * 2);
    });
    stroke(ctx, '#C05080', 0.4 * s, noteAlpha * 0.8, () => {
      ctx.moveTo(cx + 3.6 * s, noteY);
      ctx.lineTo(cx + 3.6 * s, noteY - 1.8 * s);
    });
  } else if (mood === 'happy') {
    stroke(ctx, '#C05080', 0.6 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.3 * s, 1.3 * s, Math.PI * 1.1, Math.PI * 1.9);
    });
    fill(ctx, '#ff9eb3', 0.4, () => { ctx.ellipse(cx - 2.8 * s, mouthY, 1.2 * s, 0.7 * s, 0, 0, Math.PI * 2); });
    fill(ctx, '#ff9eb3', 0.4, () => { ctx.ellipse(cx + 2.8 * s, mouthY, 1.2 * s, 0.7 * s, 0, 0, Math.PI * 2); });
  } else {
    stroke(ctx, '#C05080', 0.55 * s, 0.7, () => {
      ctx.moveTo(cx - 0.8 * s, mouthY);
      ctx.quadraticCurveTo(cx, mouthY + 0.5 * s, cx + 0.8 * s, mouthY);
    });
  }

  // Tiny nose
  fill(ctx, '#C05080', 0.55, () => {
    ctx.ellipse(cx, cy + 0.1 * s + bob, 0.35 * s, 0.25 * s, 0, 0, Math.PI * 2);
  });
}
