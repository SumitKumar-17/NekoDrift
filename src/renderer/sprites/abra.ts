import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawAbra(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.05) * 0.5 * s;
  // Abra is almost always sleeping/meditating — slow animations
  const breathe = 1 + Math.sin(frame * 0.04) * 0.02;

  groundShadow(ctx, cx, 15 * s, 4.5 * s, 1.2 * s, 0.18);

  // ── Tail ─────────────────────────────────────────────────────
  const tailSway = Math.sin(frame * 0.04) * 5;
  ctx.save();
  ctx.translate(cx + 3.5 * s, 11 * s + bob);
  ctx.rotate((tailSway * Math.PI) / 180);
  blob(ctx, '#C8A840', '#806020', 0.6 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3 * s, -0.5 * s, 3 * s, -4.5 * s);
    ctx.quadraticCurveTo(1 * s, -4 * s, 0, -2 * s);
    ctx.closePath();
  });
  ctx.restore();

  // ── Body (lean/angular) ───────────────────────────────────────
  const bodyY = 10 * s + bob;
  ctx.save();
  ctx.scale(breathe, 1 / breathe);
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4 * s, '#E8C860', '#B08828');
  blob(ctx, bodyGrad, '#806020', 0.85 * s, () => {
    ctx.ellipse(cx, bodyY, 3.6 * s, 4.5 * s, 0, 0, Math.PI * 2);
  });
  // Belly band (darker)
  fill(ctx, '#806020', 0.2, () => {
    ctx.ellipse(cx, bodyY + 1.2 * s, 2.4 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Arms folded in meditation pose ────────────────────────────
  const armDroop = Math.sin(frame * 0.04) * 0.3 * s;
  // Left arm crosses down
  blob(ctx, '#D4A430', '#806020', 0.7 * s, () => {
    ctx.ellipse(cx - 3.5 * s, bodyY + 1 * s + armDroop, 2.2 * s, 1.0 * s, 0.7, 0, Math.PI * 2);
  });
  // Right arm crosses down
  blob(ctx, '#D4A430', '#806020', 0.7 * s, () => {
    ctx.ellipse(cx + 3.5 * s, bodyY + 1 * s - armDroop, 2.2 * s, 1.0 * s, -0.7, 0, Math.PI * 2);
  });
  // Paws/hands
  fill(ctx, '#E8C860', 0.75, () => {
    ctx.arc(cx - 5 * s, bodyY + 2.2 * s + armDroop, 1.1 * s, 0, Math.PI * 2);
    ctx.arc(cx + 5 * s, bodyY + 2.2 * s - armDroop, 1.1 * s, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  blob(ctx, '#D4A430', '#806020', 0.65 * s, () => {
    ctx.ellipse(cx - 2 * s, 13.5 * s + bob, 1.5 * s, 2 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#D4A430', '#806020', 0.65 * s, () => {
    ctx.ellipse(cx + 2 * s, 13.5 * s + bob, 1.5 * s, 2 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Head (slightly forward-tilted for meditation look) ────────
  const headY = 4.8 * s + bob;
  const headTilt = Math.sin(frame * 0.03) * 1.5;
  ctx.save();
  ctx.translate(cx, headY + 1.5 * s);
  ctx.rotate((headTilt * Math.PI) / 180);
  ctx.translate(-cx, -(headY + 1.5 * s));

  const headGrad = radialGrad(ctx, cx - s, headY - 1 * s, 3.8 * s, '#F0D870', '#C09030');
  blob(ctx, headGrad, '#806020', 0.88 * s, () => {
    ctx.arc(cx, headY, 3.8 * s, 0, Math.PI * 2);
  });

  // ── Ears (long pointed Abra ears) ────────────────────────────
  blob(ctx, '#C09030', '#806020', 0.65 * s, () => {
    ctx.moveTo(cx - 2.8 * s, headY - 2.8 * s);
    ctx.lineTo(cx - 5.5 * s, headY - 7 * s);
    ctx.lineTo(cx - 0.8 * s, headY - 4 * s);
    ctx.closePath();
  });
  fill(ctx, '#E8B870', 0.5, () => {
    ctx.moveTo(cx - 3 * s, headY - 3.2 * s);
    ctx.lineTo(cx - 5 * s, headY - 6.2 * s);
    ctx.lineTo(cx - 1.5 * s, headY - 4.2 * s);
    ctx.closePath();
  });

  blob(ctx, '#C09030', '#806020', 0.65 * s, () => {
    ctx.moveTo(cx + 2.8 * s, headY - 2.8 * s);
    ctx.lineTo(cx + 5.5 * s, headY - 7 * s);
    ctx.lineTo(cx + 0.8 * s, headY - 4 * s);
    ctx.closePath();
  });
  fill(ctx, '#E8B870', 0.5, () => {
    ctx.moveTo(cx + 3 * s, headY - 3.2 * s);
    ctx.lineTo(cx + 5 * s, headY - 6.2 * s);
    ctx.lineTo(cx + 1.5 * s, headY - 4.2 * s);
    ctx.closePath();
  });

  // ── Eyes — almost always closed (meditating/sleeping) ─────────
  const eyeY = headY + 0.2 * s;
  const eyeOpenFraction = mood === 'happy'
    ? 0.4
    : Math.max(0, Math.sin(frame * 0.025) * 0.15); // barely opens, mostly shut

  if (eyeOpenFraction > 0.05) {
    // Half-open eyes
    const eh = eyeOpenFraction * 1.2 * s;
    blob(ctx, '#ffffff', '#806020', 0.3 * s, () => {
      ctx.ellipse(cx - 1.6 * s, eyeY + 0.5 * s, 1.1 * s, eh, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#806020', 0.3 * s, () => {
      ctx.ellipse(cx + 1.6 * s, eyeY + 0.5 * s, 1.1 * s, eh, 0, 0, Math.PI * 2);
    });
    // Tiny iris
    fill(ctx, '#3050A0', 1, () => {
      ctx.ellipse(cx - 1.6 * s, eyeY + 0.5 * s, 0.5 * s, eh * 0.8, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.6 * s, eyeY + 0.5 * s, 0.5 * s, eh * 0.8, 0, 0, Math.PI * 2);
    });
  } else {
    // Eyes closed — just arcs
    stroke(ctx, '#806020', 0.55 * s, 1, () => {
      ctx.arc(cx - 1.6 * s, eyeY + 0.5 * s, 0.85 * s, Math.PI, 0);
    });
    stroke(ctx, '#806020', 0.55 * s, 1, () => {
      ctx.arc(cx + 1.6 * s, eyeY + 0.5 * s, 0.85 * s, Math.PI, 0);
    });
  }

  // ── Snout + nose ──────────────────────────────────────────────
  fill(ctx, '#C09030', 0.3, () => {
    ctx.ellipse(cx, headY + 1.5 * s, 1.8 * s, 1.2 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#806020', 0.7, () => {
    ctx.ellipse(cx - 0.5 * s, headY + 1.0 * s, 0.3 * s, 0.25 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 0.5 * s, headY + 1.0 * s, 0.3 * s, 0.25 * s, 0, 0, Math.PI * 2);
  });

  // Serene smile
  stroke(ctx, '#806020', 0.45 * s, 0.6, () => {
    ctx.arc(cx, headY + 2.5 * s, 1.0 * s, Math.PI * 1.15, Math.PI * 1.85);
  });

  ctx.restore();

  // ── Psychic aura (floating symbols) ──────────────────────────
  const psyColors = ['#C8A0FF', '#9060FF', '#D080FF', '#8040E0'];
  for (let i = 0; i < 4; i++) {
    const phase = (frame * 0.4 + i * 18) % 60;
    const life = phase / 60;
    const alpha = Math.sin(life * Math.PI) * 0.55;
    if (alpha < 0.06) continue;
    const angle = (i * Math.PI * 2) / 4 + frame * 0.025;
    const dist = scale * (5.5 + Math.sin(frame * 0.03 + i) * 1.5);
    const px = cx + Math.cos(angle) * dist;
    const py = headY - 1 * s + Math.sin(angle * 2) * dist * 0.4 - life * 3 * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = psyColors[i % psyColors.length];
    ctx.font = `bold ${1.4 * s}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('✦', px, py);
    ctx.restore();
  }
}
