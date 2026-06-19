import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawFlareon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.058) * 0.5 * s;
  const t = frame;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.2 * s, 0.22);

  // ── Flame tail ──────────────────────────────────────────────
  const tailSway = Math.sin(t * 0.05) * 14;
  ctx.save();
  ctx.translate(cx + 3 * s, 10 * s + bob);
  ctx.rotate((tailSway * Math.PI) / 180);
  // Tail base
  blob(ctx, '#CC4400', '#801500', 0.5 * s, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(1.5 * s, -1.5 * s, 2.5 * s, -4 * s, 2 * s, -6.5 * s);
    ctx.bezierCurveTo(1 * s, -6 * s, 0.5 * s, -3 * s, 0, -0.5 * s);
    ctx.closePath();
  });
  // Animated flame layers on tail
  for (let fi = 0; fi < 3; fi++) {
    const flicker = Math.sin(t * 0.16 + fi * 0.9) * 0.5 * s;
    const alpha = 0.65 + Math.sin(t * 0.12 + fi) * 0.2;
    const colors = ['#FF8800', '#FFAA00', '#FFDD44'];
    fill(ctx, colors[fi], alpha, () => {
      ctx.moveTo(0.5 * s, -3 * s + flicker);
      ctx.bezierCurveTo(
        1 * s, -4.5 * s + flicker,
        2.5 * s + flicker * 0.3, -6 * s,
        2 * s + fi * 0.2 * s, -7 * s + flicker * 0.5
      );
      ctx.bezierCurveTo(
        1.5 * s, -6.5 * s,
        0.5 * s, -4 * s,
        0, -3 * s + flicker
      );
      ctx.closePath();
    });
  }
  ctx.restore();

  // ── Body ──────────────────────────────────────────────────────
  const bodyY = 11 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4.5 * s, '#DD7030', '#A03010');
  blob(ctx, bodyGrad, '#801500', 0.9 * s, () => {
    ctx.ellipse(cx, bodyY, 4.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
  });

  // ── Big fluffy mane on chest (Flareon's most distinctive feature) ──
  const maneColors = ['#FF8800', '#FFAA44', '#FFDD88'];
  for (let mi = 0; mi < 3; mi++) {
    const maneFlicker = Math.sin(t * 0.07 + mi * 1.2) * 0.8 * s;
    const baseX = cx + (mi - 1) * 2 * s;
    const baseY = bodyY - 3.5 * s;
    fill(ctx, maneColors[mi], 0.7 + mi * 0.08, () => {
      ctx.arc(baseX + maneFlicker * 0.2, baseY - mi * 0.5 * s, (2.5 - mi * 0.3) * s, 0, Math.PI * 2);
    });
  }
  // Cream center of mane
  fill(ctx, '#FFEECC', 0.55, () => {
    ctx.arc(cx, bodyY - 3 * s, 1.5 * s, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  const legBob = Math.sin(t * 0.07) * 0.35 * s;
  blob(ctx, '#CC5020', '#801500', 0.6 * s, () => {
    ctx.ellipse(cx - 2.5 * s, 13.8 * s + bob + legBob, 1.2 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  blob(ctx, '#CC5020', '#801500', 0.6 * s, () => {
    ctx.ellipse(cx + 2.5 * s, 13.8 * s + bob - legBob, 1.2 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#FFCC88', 0.6, () => {
    ctx.arc(cx - 2.5 * s, 14.8 * s + bob, 0.9 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.5 * s, 14.8 * s + bob, 0.9 * s, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 4.8 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - 1.5 * s, 4 * s, '#EE7030', '#A03010');
  blob(ctx, headGrad, '#801500', 1 * s, () => {
    ctx.arc(cx, headY, 4 * s, 0, Math.PI * 2);
  });

  // ── Furry pointed ears ────────────────────────────────────────
  blob(ctx, '#CC5020', '#801500', 0.7 * s, () => {
    ctx.moveTo(cx - 2.3 * s, headY - 2.8 * s);
    ctx.lineTo(cx - 4.8 * s, headY - 7.5 * s);
    ctx.lineTo(cx - 0.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFCC88', 0.45, () => {
    ctx.moveTo(cx - 2.5 * s, headY - 3.0 * s);
    ctx.lineTo(cx - 4.4 * s, headY - 6.8 * s);
    ctx.lineTo(cx - 1.0 * s, headY - 3.8 * s);
    ctx.closePath();
  });
  blob(ctx, '#CC5020', '#801500', 0.7 * s, () => {
    ctx.moveTo(cx + 2.3 * s, headY - 2.8 * s);
    ctx.lineTo(cx + 4.8 * s, headY - 7.5 * s);
    ctx.lineTo(cx + 0.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFCC88', 0.45, () => {
    ctx.moveTo(cx + 2.5 * s, headY - 3.0 * s);
    ctx.lineTo(cx + 4.4 * s, headY - 6.8 * s);
    ctx.lineTo(cx + 1.0 * s, headY - 3.8 * s);
    ctx.closePath();
  });

  // ── Eyes (warm amber/brown) ───────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY + 0.4 * s;
  const blink = (frame % 68) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#801500', 0.35 * s, () => {
      ctx.ellipse(cx - 1.5 * s, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#801500', 0.35 * s, () => {
      ctx.ellipse(cx + 1.5 * s, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#8B4513', 1, () => {
      ctx.ellipse(cx - 1.5 * s + edx, eyeY + edy, 0.8 * s, 0.9 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.5 * s + edx, eyeY + edy, 0.8 * s, 0.9 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#3B1000', 1, () => {
      ctx.ellipse(cx - 1.5 * s + edx * 1.2, eyeY + edy * 1.2, 0.45 * s, 0.5 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.5 * s + edx * 1.2, eyeY + edy * 1.2, 0.45 * s, 0.5 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.5 * s + edx - 0.25 * s, eyeY + edy - 0.3 * s, 0.22 * s);
    glint(ctx, cx + 1.5 * s + edx - 0.25 * s, eyeY + edy - 0.3 * s, 0.22 * s);
  } else {
    stroke(ctx, '#801500', 0.5 * s, 1, () => {
      ctx.arc(cx - 1.5 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
      ctx.arc(cx + 1.5 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
    });
  }

  // Nose + mouth
  fill(ctx, '#CC4400', 0.8, () => {
    ctx.arc(cx, headY + 1.5 * s, 0.4 * s, 0, Math.PI * 2);
  });
  stroke(ctx, '#801500', 0.4 * s, 0.7, () => {
    ctx.arc(cx, headY + 2.5 * s, 1 * s, Math.PI * 1.15, Math.PI * 1.85);
  });

  // ── Floating ember particles ──────────────────────────────────
  const emberCount = mood === 'happy' ? 5 : 2;
  for (let i = 0; i < emberCount; i++) {
    const ep = (t * 0.55 + i * 19) % 50;
    const life = ep / 50;
    const alpha = Math.sin(life * Math.PI) * 0.55;
    if (alpha < 0.05) continue;
    const ex = cx + (i - emberCount / 2) * 3 * s + Math.sin(life * Math.PI * 2 + i) * 1.5 * s;
    const ey = bodyY - 4 * s - life * 9 * s;
    fill(ctx, i % 2 ? '#FF8800' : '#FFCC44', alpha, () => {
      ctx.arc(ex, ey, (0.5 + (1 - life) * 0.5) * s, 0, Math.PI * 2);
    });
  }
}
