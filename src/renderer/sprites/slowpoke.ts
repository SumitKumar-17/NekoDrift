import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawSlowpoke(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;

  // Slowpoke moves VERY slowly — all animations at 0.015x speed
  const slowFrame = frame * 0.015;
  const bob = Math.sin(slowFrame * Math.PI * 2) * 0.6 * s;
  const breathe = 1 + Math.sin(slowFrame * Math.PI * 2 * 0.7) * 0.015;

  groundShadow(ctx, cx, 15.5 * s, 6 * s, 1.8 * s, 0.22);

  // ── Tail (iconic Slowpoke tail — a worm is attached to the tip) ──
  const tailWag = Math.sin(slowFrame * Math.PI * 2 * 0.5) * 6;
  ctx.save();
  ctx.translate(cx + 4 * s, 10 * s + bob);
  ctx.rotate((tailWag * Math.PI) / 180);
  // Long pink curled tail
  blob(ctx, '#FFB7D5', '#E87FAB', 0.7 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4 * s, 1 * s, 5 * s, -1 * s);
    ctx.quadraticCurveTo(6.5 * s, -3 * s, 5 * s, -4.5 * s);
    ctx.quadraticCurveTo(4 * s, -4 * s, 4.5 * s, -2.5 * s);
    ctx.quadraticCurveTo(3.5 * s, -1.5 * s, 0.5 * s, -0.5 * s);
    ctx.closePath();
  });
  // Tiny worm/lure at tip
  fill(ctx, '#FFEE88', 0.9, () => {
    ctx.arc(5.3 * s, -4.8 * s, 0.7 * s, 0, Math.PI * 2);
  });
  stroke(ctx, '#CCAA00', 0.4 * s, 1, () => {
    ctx.moveTo(5.3 * s, -5.5 * s);
    ctx.lineTo(5.3 * s, -7 * s);
  });
  ctx.restore();

  // ── Body (very round, fat pink oval) ──────────────────────────
  const bodyY = 10 * s + bob;
  ctx.save();
  ctx.scale(breathe, 1 / breathe);
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 6 * s, '#FFCCE5', '#F09ABD');
  blob(ctx, bodyGrad, '#D06090', 0.9 * s, () => {
    ctx.ellipse(cx, bodyY, 6 * s, 5.2 * s, 0, 0, Math.PI * 2);
  });
  // Cream belly
  fill(ctx, '#FFF0F5', 0.6, () => {
    ctx.ellipse(cx + 0.5 * s, bodyY + 1 * s, 3.5 * s, 3 * s, 0, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Short stubby legs ─────────────────────────────────────────
  blob(ctx, '#FFAAD0', '#D06090', 0.75 * s, () => {
    ctx.ellipse(cx - 3 * s, 14 * s + bob * 0.3, 1.8 * s, 2 * s, -0.15, 0, Math.PI * 2);
  });
  blob(ctx, '#FFAAD0', '#D06090', 0.75 * s, () => {
    ctx.ellipse(cx + 3 * s, 14 * s + bob * 0.3, 1.8 * s, 2 * s, 0.15, 0, Math.PI * 2);
  });
  // Tiny feet
  fill(ctx, '#FF88BB', 0.7, () => {
    ctx.arc(cx - 3.5 * s, 15.5 * s + bob * 0.2, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(cx + 3.5 * s, 15.5 * s + bob * 0.2, 1.5 * s, 0, Math.PI * 2);
  });

  // ── Short nubby arms ─────────────────────────────────────────
  blob(ctx, '#FFAAD0', '#D06090', 0.7 * s, () => {
    ctx.ellipse(cx - 6 * s, bodyY, 1.4 * s, 2 * s, -0.3, 0, Math.PI * 2);
  });
  blob(ctx, '#FFAAD0', '#D06090', 0.7 * s, () => {
    ctx.ellipse(cx + 6 * s, bodyY, 1.4 * s, 2 * s, 0.3, 0, Math.PI * 2);
  });

  // ── Head (big round, slightly flattened) ─────────────────────
  const headY = 4.5 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - 2 * s, 5 * s, '#FFD0EA', '#F09ABD');
  blob(ctx, headGrad, '#D06090', 0.95 * s, () => {
    ctx.ellipse(cx, headY, 5 * s, 4.5 * s, 0, 0, Math.PI * 2);
  });

  // ── Ears (Slowpoke has small ears on top) ─────────────────────
  blob(ctx, '#FFAAD0', '#D06090', 0.7 * s, () => {
    ctx.arc(cx - 3.5 * s, headY - 4 * s, 1.5 * s, 0, Math.PI * 2);
  });
  blob(ctx, '#FFAAD0', '#D06090', 0.7 * s, () => {
    ctx.arc(cx + 3.5 * s, headY - 4 * s, 1.5 * s, 0, Math.PI * 2);
  });
  fill(ctx, '#FF88BB', 0.6, () => {
    ctx.arc(cx - 3.5 * s, headY - 4.2 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.arc(cx + 3.5 * s, headY - 4.2 * s, 0.8 * s, 0, Math.PI * 2);
  });

  // ── Eyes — half-open, glazed, unfocused ──────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.2 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.15 * s : 0;
  const eyeY = headY + 0.5 * s;
  const blink = (frame % 200) < 3;

  if (!blink) {
    // White
    blob(ctx, '#ffffff', '#D06090', 0.4 * s, () => {
      ctx.ellipse(cx - 1.8 * s, eyeY, 1.6 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#D06090', 0.4 * s, () => {
      ctx.ellipse(cx + 1.8 * s, eyeY, 1.6 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    // Iris (light blue, blank-looking)
    fill(ctx, '#88CCEE', 1, () => {
      ctx.ellipse(cx - 1.8 * s + edx, eyeY + edy, 0.9 * s, 0.9 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.8 * s + edx, eyeY + edy, 0.9 * s, 0.9 * s, 0, 0, Math.PI * 2);
    });
    // Pupil (tiny, blank)
    fill(ctx, '#1A1A2E', 1, () => {
      ctx.ellipse(cx - 1.8 * s + edx, eyeY + edy, 0.45 * s, 0.45 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.8 * s + edx, eyeY + edy, 0.45 * s, 0.45 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.8 * s + edx - 0.2 * s, eyeY + edy - 0.25 * s, 0.18 * s);
    glint(ctx, cx + 1.8 * s + edx - 0.2 * s, eyeY + edy - 0.25 * s, 0.18 * s);

    // Heavy half-closed eyelids (Slowpoke is always drowsy)
    fill(ctx, '#F09ABD', 0.6, () => {
      ctx.ellipse(cx - 1.8 * s, eyeY - 0.5 * s, 1.6 * s, 0.7 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.8 * s, eyeY - 0.5 * s, 1.6 * s, 0.7 * s, 0, 0, Math.PI * 2);
    });
  } else {
    stroke(ctx, '#D06090', 0.6 * s, 1, () => {
      ctx.arc(cx - 1.8 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
      ctx.arc(cx + 1.8 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
    });
  }

  // ── Snout ────────────────────────────────────────────────────
  fill(ctx, '#D06090', 0.25, () => {
    ctx.ellipse(cx, headY + 2 * s, 2.5 * s, 1.5 * s, 0, 0, Math.PI * 2);
  });
  // Nostrils
  fill(ctx, '#B05078', 0.65, () => {
    ctx.ellipse(cx - 0.8 * s, headY + 1.5 * s, 0.4 * s, 0.3 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 0.8 * s, headY + 1.5 * s, 0.4 * s, 0.3 * s, 0, 0, Math.PI * 2);
  });

  // Open mouth (Slowpoke has that slack-jawed look)
  blob(ctx, '#B05078', '#8B3060', 0.55 * s, () => {
    ctx.ellipse(cx, headY + 2.8 * s, 1.5 * s, 1.0 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#FF9999', 0.7, () => {
    ctx.ellipse(cx, headY + 3.0 * s, 1.0 * s, 0.6 * s, 0, 0, Math.PI * 2);
  });
  // A bit of tongue
  fill(ctx, '#FF6688', 0.8, () => {
    ctx.ellipse(cx + 0.2 * s, headY + 3.2 * s, 0.5 * s, 0.4 * s, 0, 0, Math.PI * 2);
  });

  // ── Rosy cheeks ────────────────────────────────────────────────
  fill(ctx, '#FF88AA', 0.25, () => {
    ctx.ellipse(cx - 3.5 * s, headY + 1.5 * s, 1.5 * s, 1.0 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 3.5 * s, headY + 1.5 * s, 1.5 * s, 1.0 * s, 0, 0, Math.PI * 2);
  });

  // ── Dopey thought bubble (one floating ?) ─────────────────────
  const thoughtPhase = (frame * 0.008) % 1;
  const thoughtAlpha = Math.sin(thoughtPhase * Math.PI) * 0.5;
  if (thoughtAlpha > 0.05) {
    const ty = headY - 5 * s - thoughtPhase * 3 * s;
    ctx.save();
    ctx.globalAlpha = thoughtAlpha;
    ctx.fillStyle = '#C060A0';
    ctx.font = `bold ${1.5 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('?', cx + 4 * s, ty);
    ctx.restore();
  }
}
