import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawSylveon(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.055) * 0.6 * s;
  const t = frame;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.2 * s, 0.2);

  // ── Flowing feelers / ribbons (signature Sylveon feature) ─────
  const ribbonColors = ['#F8A8C8', '#F4C4D8', '#FADADD'];
  for (let ri = 0; ri < 4; ri++) {
    const side = ri < 2 ? -1 : 1;
    const idx = ri % 2;
    const sway = Math.sin(t * 0.04 + ri * 0.8) * 12;
    const startX = cx + side * 3 * s;
    const startY = 3.5 * s + bob;

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate((sway * Math.PI) / 180);
    // Ribbon tail
    const rColor = ribbonColors[idx];
    fill(ctx, rColor, 0.75, () => {
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        side * 2 * s, 2 * s,
        side * 3 * s + (idx ? s : 0), 5 * s,
        side * 2 * s + (idx ? s : -s * 0.5), 8 * s,
      );
      ctx.bezierCurveTo(
        side * 2.5 * s, 7 * s,
        side * 1 * s, 4 * s,
        0, 0.5 * s,
      );
      ctx.closePath();
    });
    // Ribbon bow at top
    const bow = 0.6 * s;
    fill(ctx, '#F868A8', 0.85, () => {
      ctx.ellipse(-bow, 0.3 * s, bow, bow * 0.55, 0.3, 0, Math.PI * 2);
      ctx.ellipse(bow, 0.3 * s, bow, bow * 0.55, -0.3, 0, Math.PI * 2);
    });
    fill(ctx, '#FF99CC', 0.9, () => {
      ctx.arc(0, 0.3 * s, bow * 0.4, 0, Math.PI * 2);
    });
    ctx.restore();
  }

  // ── Tail ─────────────────────────────────────────────────────
  const tailSway = Math.sin(t * 0.045) * 10;
  ctx.save();
  ctx.translate(cx + 4 * s, 10 * s + bob);
  ctx.rotate((tailSway * Math.PI) / 180);
  blob(ctx, '#F8A8C8', '#D44488', 0.5 * s, () => {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(2 * s, -1 * s, 3 * s, -4 * s, 2 * s, -6 * s);
    ctx.bezierCurveTo(1 * s, -5.5 * s, 0.5 * s, -2 * s, 0, -0.5 * s);
    ctx.closePath();
  });
  ctx.restore();

  // ── Body ──────────────────────────────────────────────────────
  const bodyY = 10.5 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4.5 * s, '#FADADD', '#F8A8C8');
  blob(ctx, bodyGrad, '#D44488', 0.9 * s, () => {
    ctx.ellipse(cx, bodyY, 4.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
  });
  // White belly
  fill(ctx, '#ffffff', 0.45, () => {
    ctx.ellipse(cx, bodyY + 1.2 * s, 2.8 * s, 2 * s, 0, 0, Math.PI * 2);
  });

  // ── Blue and pink body band ───────────────────────────────────
  fill(ctx, '#88CCEE', 0.35, () => {
    ctx.ellipse(cx - 1 * s, bodyY - 1.5 * s, 2 * s, 0.5 * s, -0.2, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  const legBob = Math.sin(t * 0.07) * 0.35 * s;
  blob(ctx, '#FADADD', '#D44488', 0.6 * s, () => {
    ctx.ellipse(cx - 2.5 * s, 13.8 * s + bob + legBob, 1.2 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  blob(ctx, '#FADADD', '#D44488', 0.6 * s, () => {
    ctx.ellipse(cx + 2.5 * s, 13.8 * s + bob - legBob, 1.2 * s, 1.8 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#ffffff', 0.6, () => {
    ctx.arc(cx - 2.5 * s, 14.8 * s + bob, 0.9 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.5 * s, 14.8 * s + bob, 0.9 * s, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 4.5 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - 1.5 * s, 4 * s, '#FADADD', '#F8A8C8');
  blob(ctx, headGrad, '#D44488', 1 * s, () => {
    ctx.arc(cx, headY, 4 * s, 0, Math.PI * 2);
  });

  // ── Round ears ───────────────────────────────────────────────
  blob(ctx, '#FADADD', '#D44488', 0.6 * s, () => {
    ctx.arc(cx - 2.8 * s, headY - 3.5 * s, 1.5 * s, 0, Math.PI * 2);
  });
  blob(ctx, '#FADADD', '#D44488', 0.6 * s, () => {
    ctx.arc(cx + 2.8 * s, headY - 3.5 * s, 1.5 * s, 0, Math.PI * 2);
  });
  fill(ctx, '#F868A8', 0.5, () => {
    ctx.arc(cx - 2.8 * s, headY - 3.5 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.arc(cx + 2.8 * s, headY - 3.5 * s, 0.8 * s, 0, Math.PI * 2);
  });

  // ── Eyes (big blue, fairy type) ───────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY + 0.4 * s;
  const blink = (frame % 75) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#D44488', 0.35 * s, () => {
      ctx.ellipse(cx - 1.6 * s, eyeY, 1.4 * s, 1.5 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#D44488', 0.35 * s, () => {
      ctx.ellipse(cx + 1.6 * s, eyeY, 1.4 * s, 1.5 * s, 0, 0, Math.PI * 2);
    });
    // Blue iris with pink tint
    fill(ctx, '#66AAEE', 1, () => {
      ctx.ellipse(cx - 1.6 * s + edx, eyeY + edy, 0.9 * s, 1.0 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.6 * s + edx, eyeY + edy, 0.9 * s, 1.0 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#224477', 1, () => {
      ctx.ellipse(cx - 1.6 * s + edx * 1.2, eyeY + edy * 1.2, 0.5 * s, 0.55 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 1.6 * s + edx * 1.2, eyeY + edy * 1.2, 0.5 * s, 0.55 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.6 * s + edx - 0.3 * s, eyeY + edy - 0.4 * s, 0.25 * s);
    glint(ctx, cx + 1.6 * s + edx - 0.3 * s, eyeY + edy - 0.4 * s, 0.25 * s);
    // Small pink eyelashes
    stroke(ctx, '#F868A8', 0.4 * s, 0.7, () => {
      ctx.moveTo(cx - 2.7 * s, eyeY - 1.2 * s);
      ctx.lineTo(cx - 2.2 * s, eyeY - 1.5 * s);
      ctx.moveTo(cx + 2.7 * s, eyeY - 1.2 * s);
      ctx.lineTo(cx + 2.2 * s, eyeY - 1.5 * s);
    });
  } else {
    stroke(ctx, '#D44488', 0.5 * s, 1, () => {
      ctx.arc(cx - 1.6 * s, eyeY + 0.3 * s, 0.85 * s, Math.PI, 0);
      ctx.arc(cx + 1.6 * s, eyeY + 0.3 * s, 0.85 * s, Math.PI, 0);
    });
  }

  // Nose + smile
  fill(ctx, '#F868A8', 0.8, () => {
    ctx.arc(cx, headY + 1.5 * s, 0.4 * s, 0, Math.PI * 2);
  });
  stroke(ctx, '#D44488', 0.4 * s, 0.7, () => {
    ctx.arc(cx, headY + 2.5 * s, 1.1 * s, Math.PI * 1.15, Math.PI * 1.85);
  });

  // ── Floating fairy sparkles ───────────────────────────────────
  const sparkCount = mood === 'happy' ? 6 : 3;
  for (let i = 0; i < sparkCount; i++) {
    const phase = (t * 0.5 + i * 18) % 55;
    const life = phase / 55;
    const alpha = Math.sin(life * Math.PI) * (mood === 'happy' ? 0.75 : 0.4);
    if (alpha < 0.05) continue;
    const angle = (i / sparkCount) * Math.PI * 2 + t * 0.025;
    const dist = s * (3.5 + Math.sin(t * 0.06 + i) * 1.5);
    const gx = cx + Math.cos(angle) * dist;
    const gy = headY - s + Math.sin(angle) * dist * 0.6 - life * 4 * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 ? '#FFAAD8' : '#88DDFF';
    ctx.beginPath();
    ctx.arc(gx, gy, 0.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
