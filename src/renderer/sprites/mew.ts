import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawMew(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;

  // Mew floats and rotates gently
  const hover = Math.sin(frame * 0.04) * 1.8 * s;
  const tilt  = Math.sin(frame * 0.025) * 6;
  const bob   = hover;

  // Ghost shadow (faint, far below since mew floats)
  groundShadow(ctx, cx, 16 * s, 4 * s, 1.2 * s, 0.12 + Math.sin(frame * 0.04) * 0.06);

  ctx.save();
  ctx.translate(cx, 8 * s + bob);
  ctx.rotate((tilt * Math.PI) / 180);

  // ── Long curling tail ─────────────────────────────────────────
  const tailSway = Math.sin(frame * 0.04) * 12;
  ctx.save();
  ctx.translate(2 * s, 3 * s);
  ctx.rotate((tailSway * Math.PI) / 180);
  blob(ctx, '#FFB8D8', '#E880B0', 0.65 * s, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(3 * s, 1 * s, 5 * s, -1 * s, 6 * s, -3 * s);
    ctx.bezierCurveTo(7 * s, -5 * s, 6 * s, -7 * s, 4 * s, -7 * s);
    ctx.bezierCurveTo(3 * s, -7 * s, 2.5 * s, -6 * s, 3 * s, -5 * s);
    ctx.bezierCurveTo(3.5 * s, -4 * s, 3 * s, -3 * s, 1 * s, -1.5 * s);
    ctx.closePath();
  });
  // Tail tip ball
  fill(ctx, '#FFD0E8', 0.9, () => {
    ctx.arc(4 * s, -7 * s, 1.2 * s, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Body (small and round) ────────────────────────────────────
  const bodyGrad = radialGrad(ctx, -1 * s, -2 * s, 4.5 * s, '#FFD0E8', '#F090C0');
  blob(ctx, bodyGrad, '#E060A0', 0.85 * s, () => {
    ctx.ellipse(0, 1 * s, 4.5 * s, 4 * s, 0, 0, Math.PI * 2);
  });
  // Belly shimmer
  fill(ctx, '#FFF0F8', 0.45, () => {
    ctx.ellipse(0.5 * s, 1.5 * s, 2.5 * s, 2 * s, 0, 0, Math.PI * 2);
  });

  // ── Tiny legs (barely visible, mostly floats) ─────────────────
  blob(ctx, '#FFB8D8', '#E060A0', 0.6 * s, () => {
    ctx.ellipse(-1.5 * s, 4.5 * s, 1.2 * s, 1.8 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#FFB8D8', '#E060A0', 0.6 * s, () => {
    ctx.ellipse(1.5 * s, 4.5 * s, 1.2 * s, 1.8 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Tiny arms ─────────────────────────────────────────────────
  const armFloat = Math.sin(frame * 0.045) * 0.5 * s;
  blob(ctx, '#FFB8D8', '#E060A0', 0.55 * s, () => {
    ctx.ellipse(-4 * s, 0.5 * s + armFloat, 1.0 * s, 1.6 * s, 0.4, 0, Math.PI * 2);
  });
  blob(ctx, '#FFB8D8', '#E060A0', 0.55 * s, () => {
    ctx.ellipse(4 * s, 0.5 * s - armFloat, 1.0 * s, 1.6 * s, -0.4, 0, Math.PI * 2);
  });

  // ── Head (large and round — Mew has a big cute head) ─────────
  const headY = -4.5 * s;
  const headGrad = radialGrad(ctx, -1.5 * s, headY - 2 * s, 4.5 * s, '#FFE0F0', '#F090C0');
  blob(ctx, headGrad, '#E060A0', 0.9 * s, () => {
    ctx.arc(0, headY, 4.5 * s, 0, Math.PI * 2);
  });

  // ── Ears (large cat-like) ─────────────────────────────────────
  blob(ctx, '#F090C0', '#E060A0', 0.7 * s, () => {
    ctx.moveTo(-3 * s, headY - 3 * s);
    ctx.lineTo(-5.5 * s, headY - 7 * s);
    ctx.lineTo(-1.5 * s, headY - 4.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFB8D8', 0.6, () => {
    ctx.moveTo(-3.2 * s, headY - 3.3 * s);
    ctx.lineTo(-5 * s, headY - 6.4 * s);
    ctx.lineTo(-2 * s, headY - 4.7 * s);
    ctx.closePath();
  });
  blob(ctx, '#F090C0', '#E060A0', 0.7 * s, () => {
    ctx.moveTo(3 * s, headY - 3 * s);
    ctx.lineTo(5.5 * s, headY - 7 * s);
    ctx.lineTo(1.5 * s, headY - 4.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFB8D8', 0.6, () => {
    ctx.moveTo(3.2 * s, headY - 3.3 * s);
    ctx.lineTo(5 * s, headY - 6.4 * s);
    ctx.lineTo(2 * s, headY - 4.7 * s);
    ctx.closePath();
  });

  // ── Eyes — large blue, wide-eyed ─────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY + 0.5 * s;
  const blink = (frame % 90) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#E060A0', 0.4 * s, () => {
      ctx.ellipse(-1.6 * s, eyeY, 1.5 * s, 1.6 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#E060A0', 0.4 * s, () => {
      ctx.ellipse(1.6 * s, eyeY, 1.5 * s, 1.6 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#4080C8', 1, () => {
      ctx.ellipse(-1.6 * s + edx, eyeY + edy, 1.0 * s, 1.1 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(1.6 * s + edx, eyeY + edy, 1.0 * s, 1.1 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#1A1A3A', 1, () => {
      ctx.ellipse(-1.6 * s + edx, eyeY + edy, 0.5 * s, 0.55 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(1.6 * s + edx, eyeY + edy, 0.5 * s, 0.55 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, -1.6 * s + edx - 0.25 * s, eyeY + edy - 0.35 * s, 0.22 * s);
    glint(ctx, 1.6 * s + edx - 0.25 * s, eyeY + edy - 0.35 * s, 0.22 * s);
    // Small glint #2
    glint(ctx, -1.6 * s + edx + 0.3 * s, eyeY + edy + 0.2 * s, 0.12 * s);
    glint(ctx, 1.6 * s + edx + 0.3 * s, eyeY + edy + 0.2 * s, 0.12 * s);
  } else {
    stroke(ctx, '#E060A0', 0.6 * s, 1, () => {
      ctx.arc(-1.6 * s, eyeY + 0.4 * s, 0.9 * s, Math.PI, 0);
      ctx.arc(1.6 * s, eyeY + 0.4 * s, 0.9 * s, Math.PI, 0);
    });
  }

  // Tiny nose
  fill(ctx, '#E060A0', 0.55, () => {
    ctx.arc(-0.2 * s, eyeY + 1.3 * s, 0.3 * s, 0, Math.PI * 2);
  });

  // Smile (happy or content)
  stroke(ctx, '#E060A0', 0.4 * s, 0.7, () => {
    ctx.arc(0, eyeY + 2.5 * s, 1.2 * s, Math.PI * 1.1, Math.PI * 1.9);
  });

  // Rosy cheeks
  fill(ctx, '#FF88BB', 0.28, () => {
    ctx.ellipse(-3.2 * s, eyeY + 1.2 * s, 1.3 * s, 0.9 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(3.2 * s, eyeY + 1.2 * s, 1.3 * s, 0.9 * s, 0, 0, Math.PI * 2);
  });

  ctx.restore(); // end tilt

  // ── Mythical aura — orbiting sparkle trail ────────────────────
  const auraColors = ['#FFB8D8', '#FFC8E8', '#FFE0F4', '#E8A0D0'];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.03;
    const dist = 8 * s + Math.sin(frame * 0.02 + i) * 1.5 * s;
    const px = cx + Math.cos(angle) * dist;
    const py = 8 * s + bob - 2 * s + Math.sin(angle * 0.5) * dist * 0.3;
    const phase = (frame * 0.4 + i * 10) % 30;
    const alpha = Math.sin((phase / 30) * Math.PI) * 0.55;
    if (alpha < 0.05) continue;
    fill(ctx, auraColors[i % 4], alpha, () => {
      ctx.arc(px, py, 0.8 * s, 0, Math.PI * 2);
    });
  }
}
