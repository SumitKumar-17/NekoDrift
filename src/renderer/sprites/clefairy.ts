import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawClefairy(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.07) * 0.8 * s;
  const blink = (frame % 68) < 3;
  const breathe = 1 + Math.sin(frame * 0.06) * 0.025;

  groundShadow(ctx, cx, 15.5 * s, 4.5 * s, 1.1 * s, 0.15);

  // ── Tail ─────────────────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.07) * 10;
  ctx.save();
  ctx.translate(cx + 3 * s, 11 * s + bob);
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, '#FFB8D0', '#E870A0', 0.6 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2 * s, -1 * s, 2.5 * s, -4 * s);
    ctx.quadraticCurveTo(0.5 * s, -3.5 * s, -0.5 * s, -1.5 * s);
    ctx.closePath();
  });
  // Curl on tail tip
  stroke(ctx, '#E870A0', 0.6 * s, 0.9, () => {
    ctx.arc(2.5 * s, -4 * s, 0.8 * s, 0, Math.PI * 1.5);
  });
  ctx.restore();

  // ── Body (round, breathing) ───────────────────────────────────
  const bodyY = 10 * s + bob;
  ctx.save();
  ctx.scale(breathe, 1 / breathe);
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4 * s, '#FFD0E0', '#F090C0');
  blob(ctx, bodyGrad, '#E870A0', 0.85 * s, () => {
    ctx.arc(cx, bodyY, 4.2 * s, 0, Math.PI * 2);
  });
  // Belly highlight
  fill(ctx, '#FFF0F8', 0.7, () => {
    ctx.ellipse(cx, bodyY + 0.5 * s, 2.4 * s, 2.8 * s, 0, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Short stubby arms ─────────────────────────────────────────
  const armSwing = Math.sin(frame * 0.07) * 0.7 * s;
  blob(ctx, '#FFB8D0', '#E870A0', 0.65 * s, () => {
    ctx.ellipse(cx - 4.8 * s, bodyY + armSwing, 1.8 * s, 1.1 * s, -0.3, 0, Math.PI * 2);
  });
  blob(ctx, '#FFB8D0', '#E870A0', 0.65 * s, () => {
    ctx.ellipse(cx + 4.8 * s, bodyY - armSwing, 1.8 * s, 1.1 * s, 0.3, 0, Math.PI * 2);
  });

  // ── Feet ──────────────────────────────────────────────────────
  const legSwing = Math.sin(frame * 0.07) * 0.5 * s;
  blob(ctx, '#FFB8D0', '#E870A0', 0.65 * s, () => {
    ctx.ellipse(cx - 2 * s, 13.5 * s + bob + legSwing, 1.8 * s, 1.4 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#FFB8D0', '#E870A0', 0.65 * s, () => {
    ctx.ellipse(cx + 2 * s, 13.5 * s + bob - legSwing, 1.8 * s, 1.4 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Head (big round) ──────────────────────────────────────────
  const headY = 5 * s + bob;
  const headGrad = radialGrad(ctx, cx - 1.2 * s, headY - 1.5 * s, 4.2 * s, '#FFE0F0', '#F4A0C8');
  blob(ctx, headGrad, '#E870A0', 0.88 * s, () => {
    ctx.arc(cx, headY, 4.0 * s, 0, Math.PI * 2);
  });

  // ── Ears (pointed with inner pink) ────────────────────────────
  // Left ear
  blob(ctx, '#F4A0C8', '#E870A0', 0.65 * s, () => {
    ctx.moveTo(cx - 3.2 * s, headY - 2.5 * s);
    ctx.lineTo(cx - 4.8 * s, headY - 6 * s);
    ctx.lineTo(cx - 1.2 * s, headY - 3.8 * s);
    ctx.closePath();
  });
  fill(ctx, '#FF88AA', 0.75, () => {
    ctx.moveTo(cx - 3.4 * s, headY - 2.8 * s);
    ctx.lineTo(cx - 4.3 * s, headY - 5.2 * s);
    ctx.lineTo(cx - 2.0 * s, headY - 3.8 * s);
    ctx.closePath();
  });

  // Right ear
  blob(ctx, '#F4A0C8', '#E870A0', 0.65 * s, () => {
    ctx.moveTo(cx + 3.2 * s, headY - 2.5 * s);
    ctx.lineTo(cx + 4.8 * s, headY - 6 * s);
    ctx.lineTo(cx + 1.2 * s, headY - 3.8 * s);
    ctx.closePath();
  });
  fill(ctx, '#FF88AA', 0.75, () => {
    ctx.moveTo(cx + 3.4 * s, headY - 2.8 * s);
    ctx.lineTo(cx + 4.3 * s, headY - 5.2 * s);
    ctx.lineTo(cx + 2.0 * s, headY - 3.8 * s);
    ctx.closePath();
  });

  // ── Star curl on forehead ─────────────────────────────────────
  const starPulse = 0.9 + Math.sin(frame * 0.12) * 0.08;
  ctx.save();
  ctx.translate(cx - 2.2 * s, headY - 3.2 * s);
  ctx.scale(starPulse, starPulse);
  // 4-point star
  ctx.fillStyle = '#FFD700';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const b = a + Math.PI / 4;
    if (i === 0) ctx.moveTo(Math.cos(a) * 1.4 * s, Math.sin(a) * 1.4 * s);
    else ctx.lineTo(Math.cos(a) * 1.4 * s, Math.sin(a) * 1.4 * s);
    ctx.lineTo(Math.cos(b) * 0.5 * s, Math.sin(b) * 0.5 * s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.5;
  glint(ctx, -0.3 * s, -0.3 * s, 0.25 * s);
  ctx.restore();

  // ── Eyes ──────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.35 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.22 * s : 0;
  const eyeY = headY + 0.3 * s;

  [cx - 1.7 * s, cx + 1.7 * s].forEach((ex) => {
    if (!blink) {
      blob(ctx, '#ffffff', '#E870A0', 0.4 * s, () => {
        ctx.ellipse(ex, eyeY, 1.3 * s, 1.4 * s, 0, 0, Math.PI * 2);
      });
      // Dark pupil with blue-ish iris
      fill(ctx, '#4060C0', 1, () => {
        ctx.ellipse(ex + edx * 0.5, eyeY + edy * 0.5, 0.9 * s, 1.0 * s, 0, 0, Math.PI * 2);
      });
      fill(ctx, '#1A1A2E', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.55 * s, 0.65 * s, 0, 0, Math.PI * 2);
      });
      glint(ctx, ex + edx - 0.3 * s, eyeY + edy - 0.35 * s, 0.22 * s);
      // Extra small glint (sparkly Clefairy eyes)
      glint(ctx, ex + edx + 0.25 * s, eyeY + edy - 0.1 * s, 0.12 * s);
    } else {
      stroke(ctx, '#E870A0', 0.6 * s, 1, () => {
        ctx.arc(ex, eyeY + 0.5 * s, 0.85 * s, Math.PI, 0);
      });
    }
  });

  // ── Rosy cheeks ───────────────────────────────────────────────
  fill(ctx, '#FF6699', 0.25, () => {
    ctx.ellipse(cx - 2.7 * s, headY + 1.5 * s, 1.5 * s, 1.0 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 2.7 * s, headY + 1.5 * s, 1.5 * s, 1.0 * s, 0, 0, Math.PI * 2);
  });

  // ── Mouth ─────────────────────────────────────────────────────
  const mouthY = headY + 2.0 * s;
  if (mood === 'happy') {
    stroke(ctx, '#E870A0', 0.55 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.4 * s, 1.2 * s, Math.PI * 1.1, Math.PI * 1.9);
    });
  } else {
    stroke(ctx, '#E870A0', 0.5 * s, 0.7, () => {
      ctx.moveTo(cx - 0.6 * s, mouthY + 0.3 * s);
      ctx.quadraticCurveTo(cx, mouthY + 0.7 * s, cx + 0.6 * s, mouthY + 0.3 * s);
    });
  }

  // ── Floating sparkle particles (Fairy magic) ──────────────────
  for (let i = 0; i < 3; i++) {
    const phase = (frame * 0.7 + i * 28) % 60;
    const life = phase / 60;
    const alpha = Math.sin(life * Math.PI) * 0.6;
    if (alpha < 0.05) continue;
    const px = cx + (i - 1) * 5.5 * s + Math.sin(frame * 0.05 + i) * 1.5 * s;
    const py = headY - 5 * s - life * 4 * s;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FFB0E0';
    ctx.beginPath();
    ctx.arc(px, py, 0.55 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
