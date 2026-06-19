import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawVulpix(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.06) * 0.5 * s;
  const t = frame;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.3 * s, 0.2);

  // ── Six flowing tails (iconic Vulpix feature) ─────────────────
  const tailColors = ['#FF6820', '#FF9040', '#FFBB60'];
  for (let ti = 0; ti < 6; ti++) {
    const spread = (ti - 2.5) * 2.2 * s;
    const tailSway = Math.sin(t * 0.05 + ti * 0.5) * 10;
    ctx.save();
    ctx.translate(cx + 2 * s + spread * 0.15, 10 * s + bob);
    ctx.rotate((tailSway * Math.PI) / 180);
    // Main tail shaft
    blob(ctx, tailColors[ti % 3], '#CC4000', 0.55 * s, () => {
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        spread * 0.5, -2 * s,
        spread + 1 * s, -4 * s,
        spread + 0.5 * s, -6 * s
      );
      ctx.bezierCurveTo(
        spread, -5.5 * s,
        spread * 0.3, -3 * s,
        0, -0.5 * s
      );
      ctx.closePath();
    });
    // Flame tip — animated flicker
    const flickerSize = 0.9 * s + Math.sin(t * 0.15 + ti * 0.7) * 0.3 * s;
    const tipAlpha = 0.75 + Math.sin(t * 0.12 + ti) * 0.15;
    fill(ctx, '#FFEE88', tipAlpha, () => {
      ctx.arc(spread + 0.5 * s, -6.5 * s, flickerSize, 0, Math.PI * 2);
    });
    fill(ctx, '#FFDDAA', tipAlpha * 0.6, () => {
      ctx.arc(spread + 0.5 * s, -7.5 * s, flickerSize * 0.5, 0, Math.PI * 2);
    });
    ctx.restore();
  }

  // ── Body (fox-like, compact) ──────────────────────────────────
  const bodyY = 10 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4.5 * s, '#FF9850', '#CC5010');
  blob(ctx, bodyGrad, '#AA3000', 0.85 * s, () => {
    ctx.ellipse(cx, bodyY, 4.5 * s, 4 * s, 0, 0, Math.PI * 2);
  });
  // Cream belly
  fill(ctx, '#FFEECC', 0.55, () => {
    ctx.ellipse(cx + 0.5 * s, bodyY + 1 * s, 2.5 * s, 2.2 * s, 0, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  const legBob = Math.sin(t * 0.08) * 0.4 * s;
  blob(ctx, '#FF8040', '#AA3000', 0.65 * s, () => {
    ctx.ellipse(cx - 2.5 * s, 13.5 * s + bob + legBob, 1.3 * s, 2 * s, 0, 0, Math.PI * 2);
  });
  blob(ctx, '#FF8040', '#AA3000', 0.65 * s, () => {
    ctx.ellipse(cx + 2.5 * s, 13.5 * s + bob - legBob, 1.3 * s, 2 * s, 0, 0, Math.PI * 2);
  });
  // Paws
  fill(ctx, '#FFCC88', 0.7, () => {
    ctx.arc(cx - 2.5 * s, 14.8 * s + bob, 1.0 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.5 * s, 14.8 * s + bob, 1.0 * s, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 4.5 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - 1.5 * s, 4 * s, '#FFAA60', '#CC5010');
  blob(ctx, headGrad, '#AA3000', 0.9 * s, () => {
    ctx.arc(cx, headY, 4 * s, 0, Math.PI * 2);
  });

  // ── Fox ears (pointed, with cream inner) ─────────────────────
  blob(ctx, '#FF8040', '#AA3000', 0.7 * s, () => {
    ctx.moveTo(cx - 2.5 * s, headY - 2.5 * s);
    ctx.lineTo(cx - 5 * s, headY - 7 * s);
    ctx.lineTo(cx - 0.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFCC88', 0.5, () => {
    ctx.moveTo(cx - 2.7 * s, headY - 2.8 * s);
    ctx.lineTo(cx - 4.6 * s, headY - 6.3 * s);
    ctx.lineTo(cx - 1 * s, headY - 3.7 * s);
    ctx.closePath();
  });

  blob(ctx, '#FF8040', '#AA3000', 0.7 * s, () => {
    ctx.moveTo(cx + 2.5 * s, headY - 2.5 * s);
    ctx.lineTo(cx + 5 * s, headY - 7 * s);
    ctx.lineTo(cx + 0.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#FFCC88', 0.5, () => {
    ctx.moveTo(cx + 2.7 * s, headY - 2.8 * s);
    ctx.lineTo(cx + 4.6 * s, headY - 6.3 * s);
    ctx.lineTo(cx + 1 * s, headY - 3.7 * s);
    ctx.closePath();
  });

  // ── Eyes ──────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY + 0.3 * s;
  const blink = (frame % 65) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#AA3000', 0.35 * s, () => {
      ctx.ellipse(cx - 1.5 * s, eyeY, 1.2 * s, 1.3 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#AA3000', 0.35 * s, () => {
      ctx.ellipse(cx + 1.5 * s, eyeY, 1.2 * s, 1.3 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#603010', 1, () => {
      ctx.ellipse(cx - 1.5 * s + edx, eyeY + edy, 0.75 * s, 0.8 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.5 * s + edx, eyeY + edy, 0.75 * s, 0.8 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.5 * s + edx - 0.25 * s, eyeY + edy - 0.3 * s, 0.2 * s);
    glint(ctx, cx + 1.5 * s + edx - 0.25 * s, eyeY + edy - 0.3 * s, 0.2 * s);
  } else {
    stroke(ctx, '#AA3000', 0.55 * s, 1, () => {
      ctx.arc(cx - 1.5 * s, eyeY + 0.3 * s, 0.75 * s, Math.PI, 0);
      ctx.arc(cx + 1.5 * s, eyeY + 0.3 * s, 0.75 * s, Math.PI, 0);
    });
  }

  // Muzzle + nose
  fill(ctx, '#FFCC88', 0.4, () => {
    ctx.ellipse(cx, headY + 1.8 * s, 2 * s, 1.3 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#CC3010', 0.75, () => {
    ctx.arc(cx, headY + 1.2 * s, 0.5 * s, 0, Math.PI * 2);
  });

  // Smile
  stroke(ctx, '#AA3000', 0.4 * s, 0.65, () => {
    ctx.arc(cx, headY + 2.8 * s, 1.0 * s, Math.PI * 1.15, Math.PI * 1.85);
  });

  // ── Ember particles around tails (subtle fire glow) ──────────
  for (let i = 0; i < 3; i++) {
    const ep = (frame * 0.6 + i * 20) % 45;
    const life = ep / 45;
    const alpha = Math.sin(life * Math.PI) * 0.45;
    if (alpha < 0.05) continue;
    const ex = cx + 2 * s + (i - 1) * 4 * s + Math.sin(life * Math.PI * 3 + i) * 2 * s;
    const ey = 10 * s + bob - 5 * s - life * 8 * s;
    fill(ctx, i % 2 ? '#FF8820' : '#FFCC44', alpha, () => {
      ctx.arc(ex, ey, 0.6 * s, 0, Math.PI * 2);
    });
  }
}
