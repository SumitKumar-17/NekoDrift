import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawCharmander(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.07) * 0.7 * s;
  const blink = (frame % 65) < 3;

  // Ground shadow
  groundShadow(ctx, cx, 15.8 * s, 4.5 * s, 1.2 * s, 0.18);

  // ── Tail with flame ──────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.09) * 14;
  ctx.save();
  ctx.translate(cx + 3 * s, 10 * s + bob);
  ctx.rotate((tailSwing * Math.PI) / 180);

  // Tail body
  blob(ctx, '#E8601C', '#a03810', 0.7 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3 * s, -1 * s, 2.5 * s, -5 * s);
    ctx.quadraticCurveTo(0.5 * s, -4 * s, -0.5 * s, -1.5 * s);
    ctx.closePath();
  });

  // Flame tip (animated)
  const flameFlicker = Math.sin(frame * 0.28) * 0.8 * s;
  const flameH = 3 * s + Math.abs(flameFlicker);
  const flameCx = 2.5 * s;
  const flameCy = -5 * s;

  // Outer flame (orange)
  fill(ctx, '#FF8C00', 0.9, () => {
    ctx.beginPath();
    ctx.moveTo(flameCx - s, flameCy);
    ctx.quadraticCurveTo(flameCx - 1.8 * s, flameCy - flameH * 0.7, flameCx, flameCy - flameH);
    ctx.quadraticCurveTo(flameCx + 1.8 * s, flameCy - flameH * 0.7, flameCx + s, flameCy);
    ctx.closePath();
  });
  // Inner flame (yellow)
  fill(ctx, '#FFD700', 0.85, () => {
    ctx.beginPath();
    ctx.moveTo(flameCx - 0.6 * s, flameCy - 0.3 * s);
    ctx.quadraticCurveTo(flameCx, flameCy - flameH * 0.8, flameCx + 0.6 * s, flameCy - 0.3 * s);
    ctx.closePath();
  });
  // Core (white)
  fill(ctx, '#FFFACD', 0.7, () => {
    ctx.beginPath();
    ctx.arc(flameCx, flameCy - flameH * 0.3, 0.4 * s, 0, Math.PI * 2);
  });

  ctx.restore();

  // ── Body ──────────────────────────────────────────────────────
  const bodyY = 9.5 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 1.5 * s, 3.8 * s, '#FF9B4A', '#E8601C');
  blob(ctx, bodyGrad, '#a03810', 0.85 * s, () => {
    ctx.ellipse(cx, bodyY, 3.5 * s, 4 * s, 0, 0, Math.PI * 2);
  });

  // Belly (cream/yellow)
  const bellyGrad = radialGrad(ctx, cx, bodyY, 2.2 * s, '#FFF0D0', '#FFD8A8');
  fill(ctx, bellyGrad, 0.9, () => {
    ctx.ellipse(cx, bodyY + 0.5 * s, 1.8 * s, 2.5 * s, 0, 0, Math.PI * 2);
  });

  // ── Arms ──────────────────────────────────────────────────────
  const armSwing = Math.sin(frame * 0.09) * 1.0 * s;
  blob(ctx, '#E8601C', '#a03810', 0.7 * s, () => {
    ctx.ellipse(cx - 4 * s, bodyY + armSwing, 1.5 * s, 1.0 * s, -0.4, 0, Math.PI * 2);
  });
  blob(ctx, '#E8601C', '#a03810', 0.7 * s, () => {
    ctx.ellipse(cx + 4 * s, bodyY - armSwing, 1.5 * s, 1.0 * s, 0.4, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  blob(ctx, '#E8601C', '#a03810', 0.7 * s, () => {
    ctx.ellipse(cx - 2 * s, 13 * s + bob, 1.5 * s, 1.8 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#E8601C', '#a03810', 0.7 * s, () => {
    ctx.ellipse(cx + 2 * s, 13 * s + bob, 1.5 * s, 1.8 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 5.2 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - s, 3.5 * s, '#FFA060', '#E8601C');
  blob(ctx, headGrad, '#a03810', 0.85 * s, () => {
    ctx.arc(cx, headY, 3.5 * s, 0, Math.PI * 2);
  });

  // ── Eyes ──────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.35 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY - 0.4 * s;

  [cx - 1.6 * s, cx + 1.6 * s].forEach((ex) => {
    if (!blink) {
      blob(ctx, '#ffffff', '#a03810', 0.4 * s, () => {
        ctx.ellipse(ex, eyeY, 1.2 * s, 1.3 * s, 0, 0, Math.PI * 2);
      });
      fill(ctx, '#2A1A0A', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.65 * s, 0.7 * s, 0, 0, Math.PI * 2);
      });
      glint(ctx, ex + edx - 0.3 * s, eyeY + edy - 0.3 * s, 0.2 * s);
    } else {
      stroke(ctx, '#a03810', 0.7 * s, 1, () => {
        ctx.arc(ex, eyeY + 0.5 * s, 0.8 * s, Math.PI, 0);
      });
    }
  });

  // ── Mouth ─────────────────────────────────────────────────────
  const mouthY = headY + 1.8 * s;
  if (mood === 'happy') {
    stroke(ctx, '#a03810', 0.55 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.5 * s, 1.4 * s, Math.PI * 1.1, Math.PI * 1.9);
    });
    fill(ctx, '#ff9eb3', 0.35, () => { ctx.ellipse(cx - 2.5 * s, mouthY, 1.0 * s, 0.6 * s, 0, 0, Math.PI * 2); });
    fill(ctx, '#ff9eb3', 0.35, () => { ctx.ellipse(cx + 2.5 * s, mouthY, 1.0 * s, 0.6 * s, 0, 0, Math.PI * 2); });
  } else {
    stroke(ctx, '#a03810', 0.55 * s, 0.7, () => {
      ctx.moveTo(cx - 0.8 * s, mouthY);
      ctx.quadraticCurveTo(cx, mouthY + 0.5 * s, cx + 0.8 * s, mouthY);
    });
  }

  // Nostrils
  fill(ctx, '#a03810', 0.5, () => {
    ctx.ellipse(cx - 0.55 * s, headY + 0.7 * s, 0.25 * s, 0.2 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 0.55 * s, headY + 0.7 * s, 0.25 * s, 0.2 * s, 0, 0, Math.PI * 2);
  });
}
