import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawPsyduck(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;

  // Psyduck always looks mildly confused — slight head sway
  const headTilt  = Math.sin(frame * 0.04) * 4;
  const bob       = Math.sin(frame * 0.06) * 0.6 * s;
  const blink     = (frame % 75) < 3;

  // Psyduck holds its head when headache. Hands on temples.
  const handPulse = 0.5 + Math.abs(Math.sin(frame * 0.08)) * 0.5;

  groundShadow(ctx, cx, 15.2 * s, 4.5 * s, 1.2 * s, 0.18);

  // ── Tail ─────────────────────────────────────────────────────
  const tailSwing = Math.sin(frame * 0.08) * 12;
  ctx.save();
  ctx.translate(cx + 3.5 * s, 10 * s + bob);
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, '#E8C84A', '#A08020', 0.6 * s, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2 * s, -1.5 * s, 2 * s, -4 * s);
    ctx.quadraticCurveTo(0.5 * s, -3.5 * s, -0.5 * s, -1.5 * s);
    ctx.closePath();
  });
  ctx.restore();

  // ── Body ─────────────────────────────────────────────────────
  const bodyY = 9.5 * s + bob;
  const bodyGrad = radialGrad(ctx, cx - s, bodyY - 2 * s, 4 * s, '#F8E068', '#D8B030');
  blob(ctx, bodyGrad, '#A08020', 0.85 * s, () => {
    ctx.ellipse(cx, bodyY, 3.8 * s, 4 * s, 0, 0, Math.PI * 2);
  });
  // Belly
  fill(ctx, '#FFF8C0', 0.6, () => {
    ctx.ellipse(cx, bodyY + 0.5 * s, 2 * s, 2.5 * s, 0, 0, Math.PI * 2);
  });

  // ── Arms (hands on head when confused) ───────────────────────
  blob(ctx, '#E8C84A', '#A08020', 0.65 * s, () => {
    ctx.ellipse(cx - 4 * s, bodyY - 2.5 * s + (1 - handPulse) * 0.5 * s, 1.6 * s, 1.0 * s, -0.6, 0, Math.PI * 2);
  });
  blob(ctx, '#E8C84A', '#A08020', 0.65 * s, () => {
    ctx.ellipse(cx + 4 * s, bodyY - 2.5 * s + (1 - handPulse) * 0.5 * s, 1.6 * s, 1.0 * s, 0.6, 0, Math.PI * 2);
  });

  // ── Legs ─────────────────────────────────────────────────────
  blob(ctx, '#E8C84A', '#A08020', 0.65 * s, () => {
    ctx.ellipse(cx - 2 * s, 13.5 * s + bob, 1.5 * s, 1.8 * s, 0.1, 0, Math.PI * 2);
  });
  blob(ctx, '#E8C84A', '#A08020', 0.65 * s, () => {
    ctx.ellipse(cx + 2 * s, 13.5 * s + bob, 1.5 * s, 1.8 * s, -0.1, 0, Math.PI * 2);
  });

  // ── Head (tilted, confused) ───────────────────────────────────
  const headY = 5 * s + bob;
  ctx.save();
  ctx.translate(cx, headY);
  ctx.rotate((headTilt * Math.PI) / 180);

  const headGrad = radialGrad(ctx, -1.2 * s, -1.5 * s, 3.5 * s, '#FAE868', '#D8B030');
  blob(ctx, headGrad, '#A08020', 0.85 * s, () => {
    ctx.arc(0, 0, 3.5 * s, 0, Math.PI * 2);
  });

  // ── Duck bill ────────────────────────────────────────────────
  const billColor = '#E89020';
  blob(ctx, billColor, '#A06010', 0.7 * s, () => {
    ctx.ellipse(0, 1.6 * s, 1.8 * s, 0.9 * s, 0, 0, Math.PI * 2);
  });
  // Nostril
  fill(ctx, '#A06010', 0.5, () => {
    ctx.ellipse(-0.6 * s, 1.4 * s, 0.2 * s, 0.15 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(0.6 * s, 1.4 * s, 0.2 * s, 0.15 * s, 0, 0, Math.PI * 2);
  });

  // ── Eyes ─────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = -0.5 * s;

  [-(1.5 * s), 1.5 * s].forEach((ex) => {
    if (!blink) {
      blob(ctx, '#ffffff', '#A08020', 0.45 * s, () => {
        ctx.ellipse(ex, eyeY, 1.2 * s, 1.3 * s, 0, 0, Math.PI * 2);
      });
      // Psyduck has spiral/dazed pupils when confused
      fill(ctx, '#2a1a00', 1, () => {
        ctx.ellipse(ex + edx, eyeY + edy, 0.6 * s, 0.7 * s, 0, 0, Math.PI * 2);
      });
      // Spiral pattern (confusion)
      if (mood !== 'happy') {
        stroke(ctx, '#7a5a10', 0.35 * s, 0.5, () => {
          ctx.arc(ex + edx, eyeY + edy, 0.35 * s, 0, Math.PI * 1.5);
        });
      }
      glint(ctx, ex + edx - 0.25 * s, eyeY + edy - 0.3 * s, 0.2 * s);
    } else {
      stroke(ctx, '#A08020', 0.7 * s, 1, () => {
        ctx.arc(ex, eyeY + 0.4 * s, 0.9 * s, Math.PI, 0);
      });
    }
  });

  // ── Headache aura ─────────────────────────────────────────────
  if (mood !== 'happy') {
    const auraAlpha = 0.12 + handPulse * 0.08;
    fill(ctx, '#cc88ff', auraAlpha, () => {
      ctx.arc(0, 0, 4.5 * s, 0, Math.PI * 2);
    });
    // Swirl lines
    for (let i = 0; i < 3; i++) {
      const angle = (frame * 0.04 + i * 2.1) % (Math.PI * 2);
      stroke(ctx, '#9955cc', 0.4 * s, auraAlpha * 2, () => {
        ctx.arc(0, 0, (3.8 + i * 0.4) * s, angle, angle + 0.9);
      });
    }
  }

  ctx.restore();

  // ── Mouth ────────────────────────────────────────────────────
  const mouthY = headY + 1.8 * s + Math.sin((headTilt * Math.PI) / 180) * 0.5 * s;
  if (mood === 'happy') {
    stroke(ctx, '#A08020', 0.55 * s, 0.9, () => {
      ctx.arc(cx, mouthY + 0.3 * s, 1.0 * s, Math.PI * 1.1, Math.PI * 1.9);
    });
    fill(ctx, '#ff9eb3', 0.3, () => { ctx.ellipse(cx - 2.2 * s, mouthY - 0.2 * s, 0.9 * s, 0.6 * s, 0, 0, Math.PI * 2); });
    fill(ctx, '#ff9eb3', 0.3, () => { ctx.ellipse(cx + 2.2 * s, mouthY - 0.2 * s, 0.9 * s, 0.6 * s, 0, 0, Math.PI * 2); });
  } else {
    // Squiggly confused mouth
    stroke(ctx, '#A08020', 0.5 * s, 0.75, () => {
      ctx.moveTo(cx - s, mouthY);
      ctx.bezierCurveTo(cx - 0.3 * s, mouthY + 0.6 * s, cx + 0.3 * s, mouthY - 0.2 * s, cx + s, mouthY);
    });
  }
}
