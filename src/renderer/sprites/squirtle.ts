import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawSquirtle(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const cy = 8 * s;

  // Bob animation
  const bob   = Math.sin(frame * 0.06) * 0.6 * s;
  const blink = (frame % 70) < 4;

  // Ground shadow
  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.4 * s, 0.18);

  // ── Shell (back) ──────────────────────────────────────────
  const shellY = 9 * s + bob;
  const shellGrad = radialGrad(ctx, cx, shellY, 4.5 * s, '#7AB8D0', '#4A8CA8');
  blob(ctx, shellGrad, '#2A5C78', 0.9 * s, () => {
    ctx.ellipse(cx, shellY, 4.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
  });

  // Shell ridge lines (concentric arcs)
  for (let i = 1; i <= 3; i++) {
    stroke(ctx, '#2A5C78', 0.55 * s, 0.4, () => {
      ctx.ellipse(cx, shellY - 0.4 * s * i, (4 - i * 0.5) * s, (3.2 - i * 0.4) * s, 0, Math.PI, Math.PI * 2);
    });
  }

  // ── Tail ──────────────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.10) * 18;
  ctx.save();
  ctx.translate(cx + 3.5 * s, shellY + 1.5 * s);
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, '#7AB8D0', '#2A5C78', 0.7 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.5 * s, -3.5 * s, 1.5 * s, -5.5 * s);
    ctx.quadraticCurveTo(0.5 * s, -3.5 * s, -0.8 * s, -2 * s);
    ctx.closePath();
  });
  ctx.restore();

  // ── Body ──────────────────────────────────────────────────
  const bodyY = 8 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - 0.8 * s, bodyY - 1.2 * s, 4.2 * s, '#a8d8e8', '#78B8D0');
  blob(ctx, bodyGrad, '#2A5C78', 0.9 * s, () => {
    ctx.ellipse(cx, bodyY, 4.2 * s, 4.5 * s, 0, 0, Math.PI * 2);
  });

  // Belly patch (lighter center)
  fill(ctx, '#d8eef5', 0.7, () => {
    ctx.ellipse(cx, bodyY + 0.8 * s, 2.2 * s, 2.8 * s, 0, 0, Math.PI * 2);
  });

  // ── Arms (legs out front) ──────────────────────────────────
  const armSwing = Math.sin(frame * 0.08) * 1.2 * s;
  blob(ctx, '#78B8D0', '#2A5C78', 0.7 * s, () => {
    ctx.ellipse(cx - 3.8 * s, bodyY + 1.5 * s + armSwing, 1.8 * s, 1.2 * s, -0.3, 0, Math.PI * 2);
  });
  blob(ctx, '#78B8D0', '#2A5C78', 0.7 * s, () => {
    ctx.ellipse(cx + 3.8 * s, bodyY + 1.5 * s - armSwing, 1.8 * s, 1.2 * s, 0.3, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────
  const headY = 4.5 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - s, 3.8 * s, '#b8dce8', '#78B8D0');
  blob(ctx, headGrad, '#2A5C78', 0.9 * s, () => {
    ctx.arc(cx, headY, 3.8 * s, 0, Math.PI * 2);
  });

  // ── Ears (tiny nubs) ──────────────────────────────────────
  blob(ctx, '#78B8D0', '#2A5C78', 0.6 * s, () => {
    ctx.ellipse(cx - 3.2 * s, headY - 3.0 * s, 1.1 * s, 1.4 * s, -0.4, 0, Math.PI * 2);
  });
  blob(ctx, '#78B8D0', '#2A5C78', 0.6 * s, () => {
    ctx.ellipse(cx + 3.2 * s, headY - 3.0 * s, 1.1 * s, 1.4 * s, 0.4, 0, Math.PI * 2);
  });

  // ── Eyes ──────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.4 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.25 * s : 0;
  const eyeY = headY - 0.2 * s;

  if (!blink) {
    [cx - 1.6 * s, cx + 1.6 * s].forEach((ex) => {
      // White sclera
      blob(ctx, '#ffffff', '#2A5C78', 0.4 * s, () => {
        ctx.ellipse(ex, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
      });
      // Iris (blue)
      fill(ctx, '#3070B8', 0.95, () => {
        ctx.ellipse(ex + edx * 0.6, eyeY + edy, 0.85 * s, 0.9 * s, 0, 0, Math.PI * 2);
      });
      // Pupil
      fill(ctx, '#1a1a2e', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.45 * s, 0.5 * s, 0, 0, Math.PI * 2);
      });
      // Glint
      glint(ctx, ex + edx - 0.25 * s, eyeY + edy - 0.35 * s, 0.22 * s);
    });
  } else {
    // Blink: curved line
    stroke(ctx, '#2A5C78', 0.8 * s, 1, () => {
      ctx.arc(cx - 1.6 * s, eyeY + 0.4 * s, 0.9 * s, Math.PI, 0);
    });
    stroke(ctx, '#2A5C78', 0.8 * s, 1, () => {
      ctx.arc(cx + 1.6 * s, eyeY + 0.4 * s, 0.9 * s, Math.PI, 0);
    });
  }

  // ── Mouth ─────────────────────────────────────────────────
  const mouthY = headY + 1.8 * s;
  if (mood === 'happy') {
    stroke(ctx, '#2A5C78', 0.6 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.4 * s, 1.4 * s, Math.PI * 1.1, Math.PI * 1.9);
    });
    // Happy cheeks
    fill(ctx, '#ff9eb3', 0.35, () => { ctx.ellipse(cx - 2.6 * s, mouthY, 1.1 * s, 0.7 * s, 0, 0, Math.PI * 2); });
    fill(ctx, '#ff9eb3', 0.35, () => { ctx.ellipse(cx + 2.6 * s, mouthY, 1.1 * s, 0.7 * s, 0, 0, Math.PI * 2); });
  } else {
    stroke(ctx, '#2A5C78', 0.55 * s, 0.7, () => {
      ctx.moveTo(cx - 0.9 * s, mouthY);
      ctx.quadraticCurveTo(cx, mouthY + 0.5 * s, cx + 0.9 * s, mouthY);
    });
  }

  // Nose (tiny)
  fill(ctx, '#2A5C78', 0.65, () => {
    ctx.ellipse(cx, headY + 0.6 * s, 0.45 * s, 0.3 * s, 0, 0, Math.PI * 2);
  });
}
