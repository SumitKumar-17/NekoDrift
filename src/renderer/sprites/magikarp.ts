import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawMagikarp(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;

  // Magikarp flops around
  const flop = Math.sin(frame * 0.12) * 1.4 * s;
  const tilt = Math.sin(frame * 0.12) * 8;
  const blink = (frame % 55) < 3;

  groundShadow(ctx, cx, 15.5 * s, 5 * s, 1.4 * s, 0.22);

  ctx.save();
  ctx.translate(cx, 10 * s);
  ctx.rotate((tilt * Math.PI) / 180);

  // ── Tail fin ────────────────────────────────────────────────
  const tailWag = Math.sin(frame * 0.14) * 12;
  ctx.save();
  ctx.translate(-1.5 * s, 3 * s);
  ctx.rotate((tailWag * Math.PI) / 180);
  // Two tail fork fins
  fill(ctx, '#FF3020', 0.9, () => {
    ctx.moveTo(-1 * s, 0);
    ctx.quadraticCurveTo(-4 * s, -3 * s, -6 * s, -5 * s);
    ctx.quadraticCurveTo(-5 * s, -4.5 * s, -3 * s, -2 * s);
    ctx.closePath();
  });
  fill(ctx, '#FF3020', 0.9, () => {
    ctx.moveTo(-1 * s, 0);
    ctx.quadraticCurveTo(-4 * s, 3 * s, -6 * s, 5 * s);
    ctx.quadraticCurveTo(-5 * s, 4.5 * s, -3 * s, 2 * s);
    ctx.closePath();
  });
  // Tail center
  fill(ctx, '#D01808', 0.8, () => {
    ctx.ellipse(-3 * s, 0, 2.5 * s, 1 * s, 0, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Body (fat oval fish) ──────────────────────────────────────
  const bodyGrad = radialGrad(ctx, -0.5 * s, -2 * s, 4.5 * s, '#FF8060', '#CC2808');
  blob(ctx, bodyGrad, '#AA1800', 0.85 * s, () => {
    ctx.ellipse(0, 0, 5.5 * s, 4.5 * s, 0, 0, Math.PI * 2);
  });

  // Belly (cream/white)
  fill(ctx, '#FFEECC', 0.75, () => {
    ctx.ellipse(1 * s, 1 * s, 2.8 * s, 2.5 * s, 0.1, 0, Math.PI * 2);
  });

  // ── Scales (just a few overlapping arcs) ─────────────────────
  fill(ctx, '#CC2808', 0.35, () => {
    ctx.arc(-2 * s, -1.5 * s, 1.8 * s, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.arc(1 * s, -2 * s, 1.8 * s, -Math.PI * 0.3, Math.PI * 0.3);
  });

  // ── Dorsal fin (top) ─────────────────────────────────────────
  fill(ctx, '#FF4030', 0.9, () => {
    ctx.moveTo(-2 * s, -4 * s);
    ctx.quadraticCurveTo(0, -7.5 * s, 3 * s, -5 * s);
    ctx.quadraticCurveTo(2 * s, -4.2 * s, -1 * s, -4.2 * s);
    ctx.closePath();
  });

  // ── Pectoral fins (side flippers) ────────────────────────────
  const flipSwing = Math.sin(frame * 0.14) * 0.7 * s;
  blob(ctx, '#FF4030', '#AA1800', 0.55 * s, () => {
    ctx.ellipse(-3 * s, 1 * s + flipSwing, 1.4 * s, 0.8 * s, -0.4, 0, Math.PI * 2);
  });
  blob(ctx, '#FF4030', '#AA1800', 0.55 * s, () => {
    ctx.ellipse(4 * s, 1 * s - flipSwing, 1.4 * s, 0.8 * s, 0.4, 0, Math.PI * 2);
  });

  // ── Head + face ───────────────────────────────────────────────
  const headY = -2 * s;
  const headGrad = radialGrad(ctx, 1 * s, headY - 1.5 * s, 3.2 * s, '#FF9060', '#CC3010');
  blob(ctx, headGrad, '#AA1800', 0.8 * s, () => {
    ctx.arc(2 * s, headY, 3.2 * s, 0, Math.PI * 2);
  });

  // Whisker-like long mustache fins
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#FFCC00';
  ctx.lineWidth = 0.7 * s;
  ctx.lineCap = 'round';
  // Left
  ctx.beginPath(); ctx.moveTo(1 * s, headY + 1.2 * s); ctx.quadraticCurveTo(-3 * s, headY + 0.5 * s, -5 * s, headY - 0.5 * s); ctx.stroke();
  // Right
  ctx.beginPath(); ctx.moveTo(3 * s, headY + 1.2 * s); ctx.quadraticCurveTo(7 * s, headY + 0.5 * s, 9 * s, headY - 0.5 * s); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';

  // Eyes — big round sad eyes
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = headY - 0.5 * s;
  const eyeX = 2 * s;

  if (!blink) {
    blob(ctx, '#ffffff', '#AA1800', 0.4 * s, () => {
      ctx.ellipse(eyeX, eyeY, 1.2 * s, 1.3 * s, 0, 0, Math.PI * 2);
    });
    fill(ctx, '#1A0A00', 1, () => {
      ctx.ellipse(eyeX + edx, eyeY + edy, 0.7 * s, 0.75 * s, 0, 0, Math.PI * 2);
    });
    glint(ctx, eyeX + edx - 0.3 * s, eyeY + edy - 0.3 * s, 0.2 * s);
    // Sad eyebrow line
    stroke(ctx, '#AA1800', 0.5 * s, 0.7, () => {
      ctx.moveTo(eyeX - 0.9 * s, eyeY - 1.4 * s);
      ctx.lineTo(eyeX + 0.9 * s, eyeY - 1.0 * s);
    });
  } else {
    stroke(ctx, '#AA1800', 0.55 * s, 1, () => {
      ctx.arc(eyeX, eyeY + 0.4 * s, 0.7 * s, Math.PI, 0);
    });
  }

  // Mouth (that famous O-face mouth)
  const mouthY = headY + 1.5 * s;
  blob(ctx, '#AA1800', '#660800', 0.55 * s, () => {
    ctx.ellipse(eyeX - 0.5 * s, mouthY, 0.9 * s, 1.1 * s, 0, 0, Math.PI * 2);
  });
  fill(ctx, '#FF9999', 0.6, () => {
    ctx.ellipse(eyeX - 0.5 * s, mouthY + 0.2 * s, 0.5 * s, 0.6 * s, 0, 0, Math.PI * 2);
  });

  ctx.restore();

  // Splashing water drops when flopping
  if (Math.abs(flop) > 0.8 * s) {
    const dropAlpha = (Math.abs(flop) - 0.8 * s) / (1.4 * s - 0.8 * s) * 0.5;
    fill(ctx, '#88CCFF', dropAlpha, () => {
      ctx.arc(cx - 4 * s, 14 * s, 1 * s, 0, Math.PI * 2);
      ctx.arc(cx + 5 * s, 13.5 * s, 0.7 * s, 0, Math.PI * 2);
      ctx.arc(cx, 15 * s, 0.5 * s, 0, Math.PI * 2);
    });
  }
}
