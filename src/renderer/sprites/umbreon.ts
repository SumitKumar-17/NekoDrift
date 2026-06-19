import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawUmbreon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.05) * 0.5 * s;
  const t = frame;
  // Glowing ring pulse
  const pulse = 0.7 + Math.sin(t * 0.07) * 0.3;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.2 * s, 0.22);

  // ── Tail ─────────────────────────────────────────────────────
  const tailSway = Math.sin(t * 0.04) * 12;
  ctx.save();
  ctx.translate(cx + 3.5 * s, 10 * s + bob);
  ctx.rotate((tailSway * Math.PI) / 180);
  blob(ctx, '#1a1a2e', '#000010', 0.5 * s, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(2 * s, -1 * s, 4 * s, -3 * s, 3 * s, -6 * s);
    ctx.bezierCurveTo(2 * s, -5.5 * s, 1 * s, -2 * s, 0, -0.5 * s);
    ctx.closePath();
  });
  // Gold ring on tail
  fill(ctx, `rgba(220,180,0,${pulse})`, 1, () => {
    ctx.ellipse(2 * s, -3.5 * s, 1.2 * s, 0.45 * s, -0.5, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Body ──────────────────────────────────────────────────────
  const bodyY = 10.5 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4.5 * s, '#23233a', '#0d0d18');
  blob(ctx, bodyGrad, '#000010', 0.9 * s, () => {
    ctx.ellipse(cx, bodyY, 4.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
  });

  // ── Gold rings on body ────────────────────────────────────────
  const ringAlpha = 0.6 + Math.sin(t * 0.07 + 0.5) * 0.25;
  stroke(ctx, `rgba(220,180,0,${ringAlpha})`, 0.5 * s, 1, () => {
    ctx.ellipse(cx - 0.5 * s, bodyY - 1.5 * s, 2.2 * s, 0.55 * s, 0, 0, Math.PI * 2);
  });
  stroke(ctx, `rgba(220,180,0,${ringAlpha * 0.8})`, 0.4 * s, 1, () => {
    ctx.ellipse(cx + 0.3 * s, bodyY + 0.8 * s, 1.8 * s, 0.45 * s, 0, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  const legBob = Math.sin(t * 0.07) * 0.35 * s;
  blob(ctx, '#1a1a2e', '#000010', 0.6 * s, () => {
    ctx.ellipse(cx - 2.5 * s, 13.8 * s + bob + legBob, 1.3 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  blob(ctx, '#1a1a2e', '#000010', 0.6 * s, () => {
    ctx.ellipse(cx + 2.5 * s, 13.8 * s + bob - legBob, 1.3 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  // Paws with subtle gold ring highlights
  fill(ctx, '#111120', 0.8, () => {
    ctx.arc(cx - 2.5 * s, 14.8 * s + bob, 1.0 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.5 * s, 14.8 * s + bob, 1.0 * s, 0, Math.PI * 2);
  });
  const pawRingAlpha = 0.4 + Math.sin(t * 0.07 + 1) * 0.2;
  stroke(ctx, `rgba(220,180,0,${pawRingAlpha})`, 0.35 * s, 1, () => {
    ctx.arc(cx - 2.5 * s, 14.8 * s + bob, 0.6 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.5 * s, 14.8 * s + bob, 0.6 * s, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 4.8 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - 1.5 * s, 4 * s, '#252535', '#0d0d18');
  blob(ctx, headGrad, '#000010', 1 * s, () => {
    ctx.arc(cx, headY, 4 * s, 0, Math.PI * 2);
  });

  // ── Ears (wide, foxlike) ─────────────────────────────────────
  blob(ctx, '#1a1a2e', '#000010', 0.7 * s, () => {
    ctx.moveTo(cx - 2 * s, headY - 3 * s);
    ctx.lineTo(cx - 4.5 * s, headY - 7.5 * s);
    ctx.lineTo(cx - 0.5 * s, headY - 4 * s);
    ctx.closePath();
  });
  blob(ctx, '#1a1a2e', '#000010', 0.7 * s, () => {
    ctx.moveTo(cx + 2 * s, headY - 3 * s);
    ctx.lineTo(cx + 4.5 * s, headY - 7.5 * s);
    ctx.lineTo(cx + 0.5 * s, headY - 4 * s);
    ctx.closePath();
  });
  // Gold ring on forehead
  const foreheadRingAlpha = 0.7 + Math.sin(t * 0.06) * 0.25;
  fill(ctx, `rgba(220,180,0,${foreheadRingAlpha})`, 1, () => {
    ctx.ellipse(cx, headY - 2.5 * s, 1.3 * s, 0.5 * s, 0, 0, Math.PI * 2);
  });

  // ── Eyes (red irises, very expressive) ───────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY + 0.5 * s;
  const blink = (frame % 70) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#000010', 0.35 * s, () => {
      ctx.ellipse(cx - 1.6 * s, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#000010', 0.35 * s, () => {
      ctx.ellipse(cx + 1.6 * s, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
    });
    // Red irises
    fill(ctx, '#CC0000', 1, () => {
      ctx.ellipse(cx - 1.6 * s + edx, eyeY + edy, 0.85 * s, 0.95 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.6 * s + edx, eyeY + edy, 0.85 * s, 0.95 * s, 0, 0, Math.PI * 2);
    });
    // Pupils
    fill(ctx, '#300000', 1, () => {
      ctx.ellipse(cx - 1.6 * s + edx * 1.2, eyeY + edy * 1.2, 0.45 * s, 0.5 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.6 * s + edx * 1.2, eyeY + edy * 1.2, 0.45 * s, 0.5 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.6 * s + edx - 0.3 * s, eyeY + edy - 0.35 * s, 0.22 * s);
    glint(ctx, cx + 1.6 * s + edx - 0.3 * s, eyeY + edy - 0.35 * s, 0.22 * s);
  } else {
    stroke(ctx, '#000010', 0.5 * s, 1, () => {
      ctx.arc(cx - 1.6 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
      ctx.arc(cx + 1.6 * s, eyeY + 0.3 * s, 0.8 * s, Math.PI, 0);
    });
  }

  // Small mouth
  stroke(ctx, '#0d0d18', 0.4 * s, 0.8, () => {
    ctx.arc(cx, headY + 2.2 * s, 0.8 * s, Math.PI * 1.2, Math.PI * 1.8);
  });

  // ── Ambient glow around rings (subtle) ───────────────────────
  if (mood === 'happy') {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + t * 0.03;
      const dist = 4.5 * s + Math.sin(t * 0.08 + i) * 0.5 * s;
      const gx = cx + Math.cos(angle) * dist;
      const gy = bodyY + Math.sin(angle) * dist * 0.6;
      fill(ctx, `rgba(220,180,0,${0.15 * pulse})`, 1, () => {
        ctx.arc(gx, gy, 0.6 * s, 0, Math.PI * 2);
      });
    }
  }
}
