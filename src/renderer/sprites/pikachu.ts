import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawPikachu(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const by        = Math.sin(t * 0.05) * 0.34;
  const tailSwing = Math.sin(t * 0.07) * 16;
  const walk      = Math.sin(t * 0.14);
  const blinkOpen = !((t % 200) > 192);
  const legL = walk * 0.5;
  const legR = -walk * 0.5;

  // ── Palette ─────────────────────────────────────────────────
  const ink        = '#6b4a00';           // outline (dark gold-brown)
  const yLight     = '#FFE45C';
  const yMid       = '#FFCB05';
  const yDeep      = '#F0A800';
  const brown      = '#8a5a26';
  const brownDark  = '#5a2e18';
  const black      = '#242424';
  const red        = '#E84B3C';
  const lw = u(0.26);                      // outline width

  const bodyGrad = radialGrad(ctx, u(7.2), u(9.4 + by), u(4.6), yLight, yDeep);
  const headGrad = radialGrad(ctx, u(7.2), u(4.2 + by), u(3.7), yLight, yMid);

  // ── Ground shadow ───────────────────────────────────────────
  groundShadow(ctx, u(8), u(15.4), u(4.2), u(0.95), 0.16);

  // ── TAIL (lightning bolt) ───────────────────────────────────
  ctx.save();
  ctx.translate(u(11.8), u(10.4 + by));
  ctx.rotate((tailSwing * Math.PI) / 180);
  blob(ctx, brown, ink, lw, () => {
    ctx.moveTo(u(0),    u(0.6));
    ctx.lineTo(u(1.7),  u(-1.6));
    ctx.lineTo(u(0.6),  u(-1.9));
    ctx.lineTo(u(2.4),  u(-4.4));
    ctx.lineTo(u(1.0),  u(-4.6));
    ctx.lineTo(u(3.2),  u(-8.8));
    ctx.lineTo(u(1.3),  u(-7.2));
    ctx.lineTo(u(2.5),  u(-4.7));
    ctx.lineTo(u(0.5),  u(-4.7));
    ctx.lineTo(u(2.0),  u(-2.0));
    ctx.lineTo(u(-0.6), u(-1.9));
    ctx.closePath();
  });
  // brown base patch at the tail root
  fill(ctx, brownDark, 0.5, () => {
    ctx.moveTo(u(-0.6), u(-1.9));
    ctx.lineTo(u(2.0),  u(-2.0));
    ctx.lineTo(u(1.6),  u(0.4));
    ctx.lineTo(u(-0.5), u(0.6));
    ctx.closePath();
  });
  ctx.restore();

  // ── EARS (drawn behind head) ────────────────────────────────
  // Left ear
  blob(ctx, yMid, ink, lw, () => {
    ctx.moveTo(u(5.0), u(3.4 + by));
    ctx.bezierCurveTo(u(3.4), u(0.2 + by), u(4.4), u(-2.4 + by), u(5.3), u(-2.2 + by));
    ctx.bezierCurveTo(u(6.2), u(-2.0 + by), u(6.9), u(0.6 + by), u(6.6), u(3.4 + by));
    ctx.closePath();
  });
  blob(ctx, black, ink, u(0.18), () => {
    ctx.moveTo(u(4.7), u(0.6 + by));
    ctx.bezierCurveTo(u(4.2), u(-1.4 + by), u(4.9), u(-2.3 + by), u(5.3), u(-2.2 + by));
    ctx.bezierCurveTo(u(5.7), u(-2.1 + by), u(6.4), u(-1.2 + by), u(6.2), u(0.6 + by));
    ctx.closePath();
  });
  // Right ear
  blob(ctx, yMid, ink, lw, () => {
    ctx.moveTo(u(9.4), u(3.4 + by));
    ctx.bezierCurveTo(u(9.1), u(0.6 + by), u(9.8), u(-2.0 + by), u(10.7), u(-2.2 + by));
    ctx.bezierCurveTo(u(11.6), u(-2.4 + by), u(12.6), u(0.2 + by), u(11.0), u(3.4 + by));
    ctx.closePath();
  });
  blob(ctx, black, ink, u(0.18), () => {
    ctx.moveTo(u(9.8), u(0.6 + by));
    ctx.bezierCurveTo(u(9.6), u(-1.2 + by), u(10.3), u(-2.1 + by), u(10.7), u(-2.2 + by));
    ctx.bezierCurveTo(u(11.1), u(-2.3 + by), u(11.8), u(-1.4 + by), u(11.3), u(0.6 + by));
    ctx.closePath();
  });

  // ── BODY ────────────────────────────────────────────────────
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.2 + by), u(4.0), u(3.5), 0, 0, Math.PI * 2);
  });
  // Back stripes (brown), clipped to the body
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(u(8), u(10.2 + by), u(4.0), u(3.5), 0, 0, Math.PI * 2);
  ctx.clip();
  stroke(ctx, brown, u(0.5), 0.7, () => {
    ctx.moveTo(u(9.6), u(7.6 + by));
    ctx.quadraticCurveTo(u(11.6), u(8.8 + by), u(11.0), u(11.0 + by));
  });
  stroke(ctx, brown, u(0.5), 0.7, () => {
    ctx.moveTo(u(11.0), u(8.0 + by));
    ctx.quadraticCurveTo(u(12.6), u(9.2 + by), u(12.2), u(11.2 + by));
  });
  ctx.restore();

  // ── FEET ────────────────────────────────────────────────────
  blob(ctx, yDeep, ink, lw, () => {
    ctx.ellipse(u(5.8), u(13.6 + by + legL), u(1.55), u(0.95), 0.06, 0, Math.PI * 2);
  });
  blob(ctx, yDeep, ink, lw, () => {
    ctx.ellipse(u(10.2), u(13.6 + by + legR), u(1.55), u(0.95), -0.06, 0, Math.PI * 2);
  });

  // ── ARMS ────────────────────────────────────────────────────
  blob(ctx, yMid, ink, lw, () => {
    ctx.ellipse(u(4.6), u(10.4 + by), u(0.95), u(1.45), -0.32, 0, Math.PI * 2);
  });
  blob(ctx, yMid, ink, lw, () => {
    ctx.ellipse(u(11.4), u(10.4 + by), u(0.95), u(1.45), 0.32, 0, Math.PI * 2);
  });

  // ── HEAD ────────────────────────────────────────────────────
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(4.9 + by), u(3.5), u(3.2), 0, 0, Math.PI * 2);
  });

  // ── CHEEKS ──────────────────────────────────────────────────
  const cheekGradL = radialGrad(ctx, u(4.9), u(6.1 + by), u(1.25), '#ff6b5c', red);
  const cheekGradR = radialGrad(ctx, u(11.1), u(6.1 + by), u(1.25), '#ff6b5c', red);
  blob(ctx, cheekGradL, '#b03224', u(0.12), () => {
    ctx.ellipse(u(5.0), u(6.2 + by), u(1.28), u(1.04), 0, 0, Math.PI * 2);
  });
  blob(ctx, cheekGradR, '#b03224', u(0.12), () => {
    ctx.ellipse(u(11.0), u(6.2 + by), u(1.28), u(1.04), 0, 0, Math.PI * 2);
  });

  // ── EYES ────────────────────────────────────────────────────
  if (mood === 'tired') {
    // Droopy half-closed eyes: small iris at bottom, eyelid covers top half
    if (blinkOpen) {
      fill(ctx, black, 0.82, () => { ctx.arc(u(6.55), u(4.85 + by), u(0.6), 0, Math.PI * 2); });
      fill(ctx, black, 0.82, () => { ctx.arc(u(9.45), u(4.85 + by), u(0.6), 0, Math.PI * 2); });
      // eyelid stroke across top of each eye
      stroke(ctx, black, u(0.3), 0.95, () => {
        ctx.moveTo(u(5.85), u(4.5 + by)); ctx.lineTo(u(7.25), u(4.5 + by));
        ctx.moveTo(u(8.75), u(4.5 + by)); ctx.lineTo(u(10.15), u(4.5 + by));
      });
    } else {
      // blink: flat lines
      stroke(ctx, black, u(0.26), 1, () => {
        ctx.moveTo(u(6.0), u(4.6 + by)); ctx.lineTo(u(7.2), u(4.6 + by));
        ctx.moveTo(u(8.8), u(4.6 + by)); ctx.lineTo(u(10.0), u(4.6 + by));
      });
    }
  } else if (!blinkOpen) {
    stroke(ctx, black, u(0.26), 1, () => {
      ctx.moveTo(u(6.0), u(4.6 + by)); ctx.lineTo(u(7.2), u(4.6 + by));
      ctx.moveTo(u(8.8), u(4.6 + by)); ctx.lineTo(u(10.0), u(4.6 + by));
    });
  } else {
    const ex  = eyeDir ? eyeDir.dx * 0.3 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.2 : 0;
    blob(ctx, black, ink, u(0.1), () => { ctx.ellipse(u(6.55), u(4.6 + by), u(0.82), u(0.92), 0, 0, Math.PI * 2); });
    blob(ctx, black, ink, u(0.1), () => { ctx.ellipse(u(9.45), u(4.6 + by), u(0.82), u(0.92), 0, 0, Math.PI * 2); });
    glint(ctx, u(6.32 + ex), u(4.25 + by + edy), u(0.28));
    glint(ctx, u(9.22 + ex), u(4.25 + by + edy), u(0.28));
  }

  // ── NOSE + MOUTH ────────────────────────────────────────────
  fill(ctx, black, 0.92, () => {
    ctx.ellipse(u(8), u(5.7 + by), u(0.24), u(0.17), 0, 0, Math.PI * 2);
  });
  if (mood === 'tired') {
    // Flat neutral mouth — too tired to smile
    stroke(ctx, brownDark, u(0.16), 0.7, () => {
      ctx.moveTo(u(7.4), u(6.35 + by));
      ctx.lineTo(u(8.6), u(6.35 + by));
    });
  } else {
    stroke(ctx, brownDark, u(0.16), 0.85, () => {
      ctx.moveTo(u(7.3), u(6.2 + by));
      ctx.quadraticCurveTo(u(8), u(6.78 + by), u(8.7), u(6.2 + by));
    });
  }
}
