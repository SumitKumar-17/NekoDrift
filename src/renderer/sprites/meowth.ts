import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawMeowth(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.07) * 0.7 * s;
  const blink = (frame % 70) < 3;

  groundShadow(ctx, cx, 15.5 * s, 4.5 * s, 1.2 * s, 0.18);

  // ── Tail ─────────────────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.08) * 18;
  ctx.save();
  ctx.translate(cx + 3 * s, 11 * s + bob);
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, '#E8D8A0', '#A09030', 0.65 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2.5 * s, -1 * s, 2.5 * s, -5 * s);
    ctx.quadraticCurveTo(0.5 * s, -5 * s, 0, -2 * s);
    ctx.closePath();
  });
  // Tail tip (cream)
  blob(ctx, '#FFF8E0', '#A09030', 0.5 * s, () => {
    ctx.arc(2.5 * s, -5 * s, 1.2 * s, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Body ──────────────────────────────────────────────────────
  const bodyY = 10 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4 * s, '#F0DC90', '#C8A840');
  blob(ctx, bodyGrad, '#A09030', 0.85 * s, () => {
    ctx.ellipse(cx, bodyY, 3.8 * s, 4.2 * s, 0, 0, Math.PI * 2);
  });
  // Cream belly
  fill(ctx, '#FFF8E0', 0.8, () => {
    ctx.ellipse(cx, bodyY + 0.5 * s, 2.2 * s, 2.8 * s, 0, 0, Math.PI * 2);
  });

  // ── Legs ──────────────────────────────────────────────────────
  const legSwing = Math.sin(frame * 0.07) * 0.7 * s;
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.ellipse(cx - 2 * s, 13.5 * s + bob + legSwing, 1.4 * s, 1.8 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.ellipse(cx + 2 * s, 13.5 * s + bob - legSwing, 1.4 * s, 1.8 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Arms ──────────────────────────────────────────────────────
  const armSwing = Math.sin(frame * 0.07) * 0.9 * s;
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.ellipse(cx - 4.2 * s, bodyY + armSwing, 1.5 * s, 1.0 * s, -0.3, 0, Math.PI * 2);
  });
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.ellipse(cx + 4.2 * s, bodyY - armSwing, 1.5 * s, 1.0 * s, 0.3, 0, Math.PI * 2);
  });
  // Paw nubs
  fill(ctx, '#FFF0C0', 0.7, () => {
    ctx.arc(cx - 5.5 * s, bodyY + armSwing, 0.8 * s, 0, Math.PI * 2);
  });
  fill(ctx, '#FFF0C0', 0.7, () => {
    ctx.arc(cx + 5.5 * s, bodyY - armSwing, 0.8 * s, 0, Math.PI * 2);
  });

  // ── Head ──────────────────────────────────────────────────────
  const headY = 4.8 * s + bob;
  const headGrad = radialGrad(ctx, cx - s, headY - s, 3.8 * s, '#F8E898', '#D4B040');
  blob(ctx, headGrad, '#A09030', 0.9 * s, () => {
    ctx.arc(cx, headY, 3.8 * s, 0, Math.PI * 2);
  });

  // Cheek patches (darker tan)
  fill(ctx, '#D4A030', 0.25, () => {
    ctx.ellipse(cx - 2.8 * s, headY + 1.2 * s, 1.8 * s, 1.2 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 2.8 * s, headY + 1.2 * s, 1.8 * s, 1.2 * s, 0, 0, Math.PI * 2);
  });

  // ── Cat ears ──────────────────────────────────────────────────
  // Left ear
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.moveTo(cx - 3.5 * s, headY - 2.2 * s);
    ctx.lineTo(cx - 5.0 * s, headY - 5.5 * s);
    ctx.lineTo(cx - 1.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#F4A7B9', 0.7, () => {
    ctx.moveTo(cx - 3.6 * s, headY - 2.5 * s);
    ctx.lineTo(cx - 4.7 * s, headY - 4.8 * s);
    ctx.lineTo(cx - 2.1 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  // Right ear
  blob(ctx, '#E8D880', '#A09030', 0.7 * s, () => {
    ctx.moveTo(cx + 3.5 * s, headY - 2.2 * s);
    ctx.lineTo(cx + 5.0 * s, headY - 5.5 * s);
    ctx.lineTo(cx + 1.5 * s, headY - 3.5 * s);
    ctx.closePath();
  });
  fill(ctx, '#F4A7B9', 0.7, () => {
    ctx.moveTo(cx + 3.6 * s, headY - 2.5 * s);
    ctx.lineTo(cx + 4.7 * s, headY - 4.8 * s);
    ctx.lineTo(cx + 2.1 * s, headY - 3.5 * s);
    ctx.closePath();
  });

  // ── Gold coin (forehead) ──────────────────────────────────────
  const coinPulse = 0.92 + Math.sin(frame * 0.1) * 0.06;
  ctx.save();
  ctx.translate(cx, headY - 2.8 * s);
  ctx.scale(coinPulse, coinPulse);
  // Coin shadow
  fill(ctx, '#806020', 0.35, () => {
    ctx.arc(0, 0.1 * s, 1.5 * s, 0, Math.PI * 2);
  });
  // Coin body
  const coinGrad = radialGrad(ctx, -0.4 * s, -0.4 * s, 1.2 * s, '#FFE050', '#C88020');
  fill(ctx, coinGrad, 1, () => {
    ctx.arc(0, 0, 1.3 * s, 0, Math.PI * 2);
  });
  // Coin shine
  glint(ctx, -0.5 * s, -0.5 * s, 0.35 * s);
  ctx.restore();

  // ── Eyes ──────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.4 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.25 * s : 0;
  const eyeY = headY + 0.2 * s;

  [cx - 1.8 * s, cx + 1.8 * s].forEach((ex) => {
    if (!blink) {
      blob(ctx, '#ffffff', '#A09030', 0.4 * s, () => {
        ctx.ellipse(ex, eyeY, 1.1 * s, 1.25 * s, 0, 0, Math.PI * 2);
      });
      // Meowth has greenish eyes
      fill(ctx, '#3AA040', 1, () => {
        ctx.ellipse(ex + edx * 0.6, eyeY + edy * 0.6, 0.8 * s, 0.9 * s, 0, 0, Math.PI * 2);
      });
      fill(ctx, '#1A1A0A', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.5 * s, 0.6 * s, 0, 0, Math.PI * 2);
      });
      glint(ctx, ex + edx - 0.28 * s, eyeY + edy - 0.35 * s, 0.18 * s);
    } else {
      stroke(ctx, '#A09030', 0.6 * s, 1, () => {
        ctx.arc(ex, eyeY + 0.4 * s, 0.7 * s, Math.PI, 0);
      });
    }
  });

  // ── Nose + mouth ──────────────────────────────────────────────
  // Nose (small triangle)
  const noseY = headY + 1.4 * s;
  fill(ctx, '#E86070', 0.9, () => {
    ctx.moveTo(cx, noseY);
    ctx.lineTo(cx - 0.5 * s, noseY + 0.6 * s);
    ctx.lineTo(cx + 0.5 * s, noseY + 0.6 * s);
    ctx.closePath();
  });

  const mouthY = noseY + 0.6 * s;
  if (mood === 'happy') {
    stroke(ctx, '#A09030', 0.55 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.4 * s, 1.2 * s, Math.PI * 1.15, Math.PI * 1.85);
    });
  } else {
    stroke(ctx, '#A09030', 0.5 * s, 0.7, () => {
      ctx.moveTo(cx - 0.7 * s, mouthY + 0.2 * s);
      ctx.quadraticCurveTo(cx, mouthY + 0.6 * s, cx + 0.7 * s, mouthY + 0.2 * s);
    });
  }

  // ── Whiskers ──────────────────────────────────────────────────
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = '#808040';
  ctx.lineWidth = 0.55 * s;
  ctx.lineCap = 'round';
  // Left whiskers (3)
  for (let i = 0; i < 3; i++) {
    const wy = headY + 0.8 * s + (i - 1) * 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 1.5 * s, wy);
    ctx.lineTo(cx - 5.5 * s, wy + (i - 1) * 0.3 * s);
    ctx.stroke();
  }
  // Right whiskers (3)
  for (let i = 0; i < 3; i++) {
    const wy = headY + 0.8 * s + (i - 1) * 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(cx + 1.5 * s, wy);
    ctx.lineTo(cx + 5.5 * s, wy + (i - 1) * 0.3 * s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}
