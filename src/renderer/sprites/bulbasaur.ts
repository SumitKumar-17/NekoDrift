import { fill, stroke, blob, radialGrad, groundShadow, glint, Ctx } from './sprite-utils';

export function drawBulbasaur(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood = 'content',
): void {
  const u = (n: number) => n * scale;
  const t = frame;

  const bob      = Math.sin(t * 0.05) * 0.3;
  const walk     = Math.sin(t * 0.14);
  const blinkOpen = !((t % 190) > 182);
  const legL     = walk * 0.45;
  const legR     = -walk * 0.45;
  const tailSwing = Math.sin(t * 0.06) * 8;

  // ── Palette ──────────────────────────────────────────────────
  const ink      = '#1a3a0a';
  const green    = '#78C850';
  const greenMid = '#5aA838';
  const greenDark= '#3a7820';
  const belly    = '#A8E870';
  const spot     = '#2a5a08';
  const bulbBase = '#4a9830';
  const bulbDark = '#2a6010';
  const bulbLight= '#6ac840';
  const pink     = '#F0B8B8';
  const eye      = '#C03030';
  const eyeDark  = '#601010';
  const white    = '#FFFFFF';
  const lw       = u(0.22);

  const bodyGrad = radialGrad(ctx, u(8), u(10.5 + bob), u(4.2), green, greenDark);
  const headGrad = radialGrad(ctx, u(7), u(6.2 + bob), u(3.2), green, greenMid);
  const bulbGrad = radialGrad(ctx, u(10.5), u(5.5 + bob), u(3.5), bulbLight, bulbDark);

  groundShadow(ctx, u(8), u(15.6), u(3.8), u(0.8), 0.18);

  // ── Back legs ────────────────────────────────────────────────
  ctx.save();
  ctx.translate(u(8), u(13.5 + bob));

  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(legR - 2.1), u(0.4), u(1.0), u(1.4), 0, 0, Math.PI * 2);
  });
  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(legL + 2.1), u(0.4), u(1.0), u(1.4), 0, 0, Math.PI * 2);
  });
  // Back feet
  blob(ctx, green, ink, lw, () => {
    ctx.ellipse(u(legR - 2.1), u(1.8), u(1.3), u(0.55), 0, 0, Math.PI * 2);
  });
  blob(ctx, green, ink, lw, () => {
    ctx.ellipse(u(legL + 2.1), u(1.8), u(1.3), u(0.55), 0, 0, Math.PI * 2);
  });

  ctx.restore();

  // ── Body ─────────────────────────────────────────────────────
  blob(ctx, bodyGrad, ink, lw, () => {
    ctx.ellipse(u(8), u(10.5 + bob), u(4.0), u(3.2), 0, 0, Math.PI * 2);
  });

  // Belly patch
  fill(ctx, belly, 0.7, () => {
    ctx.ellipse(u(7.6), u(11.0 + bob), u(2.2), u(1.8), 0, 0, Math.PI * 2);
  });

  // Body spots (dark patches)
  const spots = [
    { x: 5.5, y: 10.0, rx: 0.9, ry: 0.65, a: -0.3 },
    { x: 10.2, y: 9.5, rx: 0.8, ry: 0.6, a: 0.4 },
    { x: 6.8, y: 12.4, rx: 0.7, ry: 0.5, a: 0.2 },
  ];
  for (const s of spots) {
    fill(ctx, spot, 0.55, () => {
      ctx.save();
      ctx.translate(u(s.x), u(s.y + bob));
      ctx.rotate(s.a);
      ctx.ellipse(0, 0, u(s.rx), u(s.ry), 0, 0, Math.PI * 2);
      ctx.restore();
    });
  }

  // ── Bulb on back ─────────────────────────────────────────────
  ctx.save();
  ctx.translate(u(10.2), u(7.2 + bob));
  ctx.rotate(tailSwing * Math.PI / 180 * 0.3);

  // Bulb base (wide bottom)
  blob(ctx, bulbGrad, ink, lw, () => {
    ctx.ellipse(0, u(0.8), u(2.0), u(2.5), 0, 0, Math.PI * 2);
  });

  // Bulb stripes (darker vertical lines)
  for (let i = -1; i <= 1; i++) {
    stroke(ctx, bulbDark, u(0.18), 0.45, () => {
      ctx.moveTo(u(i * 0.7), u(-0.5));
      ctx.lineTo(u(i * 0.8), u(2.8));
    });
  }

  // Bulb leaf (two leaves poking out)
  blob(ctx, bulbBase, ink, u(0.18), () => {
    ctx.moveTo(0, u(-1.0));
    ctx.quadraticCurveTo(u(-1.8), u(-2.2), u(-1.4), u(-3.2));
    ctx.quadraticCurveTo(u(-0.3), u(-2.0), u(0), u(-1.0));
  });
  blob(ctx, bulbBase, ink, u(0.18), () => {
    ctx.moveTo(0, u(-1.0));
    ctx.quadraticCurveTo(u(1.8), u(-2.2), u(1.4), u(-3.2));
    ctx.quadraticCurveTo(u(0.3), u(-2.0), u(0), u(-1.0));
  });
  ctx.restore();

  // ── Front legs ───────────────────────────────────────────────
  ctx.save();
  ctx.translate(u(8), u(12.5 + bob));

  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(legL - 2.0), u(-0.4), u(0.9), u(1.5), legL * 0.15, 0, Math.PI * 2);
  });
  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(legR + 2.0), u(-0.4), u(0.9), u(1.5), legR * 0.15, 0, Math.PI * 2);
  });
  // Front feet
  blob(ctx, green, ink, lw, () => {
    ctx.ellipse(u(legL - 2.0), u(1.2), u(1.1), u(0.5), 0, 0, Math.PI * 2);
  });
  blob(ctx, green, ink, lw, () => {
    ctx.ellipse(u(legR + 2.0), u(1.2), u(1.1), u(0.5), 0, 0, Math.PI * 2);
  });

  ctx.restore();

  // ── Head ─────────────────────────────────────────────────────
  blob(ctx, headGrad, ink, lw, () => {
    ctx.ellipse(u(7.2), u(6.5 + bob), u(3.0), u(2.8), 0, 0, Math.PI * 2);
  });

  // Head spots
  fill(ctx, spot, 0.4, () => {
    ctx.ellipse(u(5.4), u(6.0 + bob), u(0.8), u(0.55), -0.2, 0, Math.PI * 2);
  });

  // Ears (small rounded bumps)
  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(5.2), u(4.3 + bob), u(1.1), u(0.9), -0.4, 0, Math.PI * 2);
  });
  blob(ctx, greenMid, ink, lw, () => {
    ctx.ellipse(u(9.1), u(4.3 + bob), u(1.1), u(0.9), 0.4, 0, Math.PI * 2);
  });

  // ── Eyes ─────────────────────────────────────────────────────
  const eyeBaseX = [5.8, 8.6];
  const eyeBaseY = u(6.2 + bob);
  const eDx = eyeDir ? eyeDir.dx * u(0.18) : 0;
  const eDy = eyeDir ? eyeDir.dy * u(0.18) : 0;

  for (const ex of eyeBaseX) {
    blob(ctx, white, ink, lw * 0.8, () => {
      if (blinkOpen) {
        ctx.ellipse(u(ex), eyeBaseY, u(0.7), u(0.72), 0, 0, Math.PI * 2);
      } else {
        // Blink: just a line
        ctx.moveTo(u(ex - 0.7), eyeBaseY);
        ctx.lineTo(u(ex + 0.7), eyeBaseY);
      }
    });
    if (blinkOpen) {
      // Iris (red/dark)
      fill(ctx, eye, 1, () => {
        ctx.ellipse(u(ex) + eDx, eyeBaseY + eDy, u(0.4), u(0.42), 0, 0, Math.PI * 2);
      });
      fill(ctx, eyeDark, 1, () => {
        ctx.ellipse(u(ex) + eDx * 1.2, eyeBaseY + eDy * 1.2, u(0.2), u(0.21), 0, 0, Math.PI * 2);
      });
      glint(ctx, u(ex) + eDx - u(0.22), eyeBaseY + eDy - u(0.22), u(0.12));
    }
  }

  // Nose
  fill(ctx, pink, 0.9, () => {
    ctx.ellipse(u(7.2), u(7.5 + bob), u(0.35), u(0.22), 0, 0, Math.PI * 2);
  });

  // Mouth
  if (mood === 'happy') {
    stroke(ctx, ink, lw * 0.8, 0.9, () => {
      ctx.moveTo(u(6.2), u(7.9 + bob));
      ctx.quadraticCurveTo(u(7.2), u(8.6 + bob), u(8.2), u(7.9 + bob));
    });
  } else {
    stroke(ctx, ink, lw * 0.8, 0.7, () => {
      ctx.moveTo(u(6.5), u(8.0 + bob));
      ctx.lineTo(u(7.9), u(8.0 + bob));
    });
  }
}
