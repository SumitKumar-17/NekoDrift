import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawDitto(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;

  // Ditto is a fluid blob — everything wobbles organically
  const t = frame * 0.04;
  const wobbleX = Math.sin(t * 1.3) * 0.8 * s;
  const wobbleY = Math.cos(t * 1.1) * 0.5 * s;
  const blobScale = 1 + Math.sin(t * 0.9) * 0.04;
  const bob = Math.sin(t * Math.PI) * 0.7 * s;

  groundShadow(ctx, cx + wobbleX * 0.3, 15.5 * s, 5.5 * s, 1.5 * s, 0.2);

  ctx.save();
  ctx.translate(cx + wobbleX, 9 * s + bob);
  ctx.scale(blobScale, 1 / blobScale);

  // ── Main blob body ────────────────────────────────────────────
  // Ditto's iconic purple/lavender color
  const bodyGrad = radialGrad(ctx, -1 * s, -3 * s, 7 * s, '#C8A8E8', '#8060B8');

  // Organic blob shape using multiple bezier curves
  fill(ctx, 'transparent', 0, () => {}); // clear path
  ctx.save();
  ctx.fillStyle = bodyGrad as unknown as string;
  ctx.strokeStyle = 'rgba(80,40,140,0.6)';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();

  // Complex blob outline with wobble
  const w1 = Math.sin(t * 1.7) * 0.6 * s;
  const w2 = Math.cos(t * 1.4) * 0.5 * s;
  const w3 = Math.sin(t * 1.9) * 0.7 * s;
  const w4 = Math.cos(t * 1.2) * 0.6 * s;

  ctx.moveTo(0, -5 * s + w1);
  ctx.bezierCurveTo(
    3 * s + w2, -6 * s,
    7 * s, -3 * s + w3,
    6.5 * s + w4, 1 * s
  );
  ctx.bezierCurveTo(
    6 * s, 4 * s + w1,
    4 * s + w2, 6 * s,
    0, 6.5 * s + w3
  );
  ctx.bezierCurveTo(
    -4 * s + w4, 6 * s,
    -6.5 * s, 4 * s + w1,
    -6.5 * s + w2, 1 * s
  );
  ctx.bezierCurveTo(
    -7 * s + w3, -2 * s,
    -4 * s + w4, -6 * s,
    0, -5 * s + w1
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Blob highlight (lighter patch on top)
  fill(ctx, '#E0C8FF', 0.3, () => {
    ctx.ellipse(-1.5 * s, -3 * s, 2.5 * s, 2 * s, -0.4, 0, Math.PI * 2);
  });

  // ── Ditto's signature face: simple dot eyes and curvy mouth ──
  const edx = eyeDir ? eyeDir.dx * 0.3 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.2 * s : 0;
  const eyeY = -1.2 * s + wobbleY * 0.3;
  const blink = (frame % 80) < 3;
  const happy = mood === 'happy';

  if (!blink) {
    // Small round black eyes — classic Ditto dots
    fill(ctx, '#2A1845', 1, () => {
      ctx.arc(-1.5 * s + edx, eyeY + edy, 0.7 * s, 0, Math.PI * 2);
      ctx.arc(1.5 * s + edx, eyeY + edy, 0.7 * s, 0, Math.PI * 2);
    });
    // White glints in each eye
    glint(ctx, -1.5 * s + edx - 0.25 * s, eyeY + edy - 0.25 * s, 0.2 * s);
    glint(ctx, 1.5 * s + edx - 0.25 * s, eyeY + edy - 0.25 * s, 0.2 * s);
  } else {
    stroke(ctx, '#2A1845', 0.6 * s, 1, () => {
      ctx.arc(-1.5 * s, eyeY + 0.4 * s, 0.5 * s, Math.PI, 0);
      ctx.arc(1.5 * s, eyeY + 0.4 * s, 0.5 * s, Math.PI, 0);
    });
  }

  // Ditto's iconic wavy mouth
  const mouthY = eyeY + 2.2 * s;
  const mouthWobble = Math.sin(t * 2) * 0.3 * s;
  ctx.save();
  ctx.strokeStyle = '#2A1845';
  ctx.lineWidth = 0.7 * s;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  if (happy) {
    ctx.arc(0, mouthY - 0.3 * s, 1.5 * s, Math.PI * 1.1, Math.PI * 1.9);
  } else {
    // Classic Ditto wavy/neutral mouth
    ctx.moveTo(-2.2 * s, mouthY);
    ctx.bezierCurveTo(
      -1.0 * s, mouthY + 0.8 * s + mouthWobble,
      1.0 * s, mouthY - 0.8 * s + mouthWobble,
      2.2 * s, mouthY
    );
  }
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // end scaled blob

  // ── Morphing tendrils at the bottom ──────────────────────────
  // A few drip-like extensions
  for (let i = 0; i < 3; i++) {
    const dripPhase = t * 1.3 + i * 1.1;
    const dripLen = (1 + Math.sin(dripPhase) * 0.4) * 2 * s;
    const dripX = cx + (i - 1) * 3.5 * s + Math.sin(dripPhase * 0.7) * 0.5 * s;
    const baseY = 14 * s + bob;
    const alpha = 0.35 + Math.sin(dripPhase) * 0.1;
    fill(ctx, '#A080D0', alpha, () => {
      ctx.ellipse(dripX, baseY + dripLen * 0.5, 0.8 * s, dripLen * 0.5 + 0.3 * s, 0, 0, Math.PI * 2);
    });
  }

  // ── Transform sparkle when mood=happy ─────────────────────────
  if (happy) {
    const sparkColors = ['#E8C8FF', '#C8A0FF', '#F0E0FF'];
    for (let i = 0; i < 3; i++) {
      const sp = (frame * 0.5 + i * 20) % 40;
      const life = sp / 40;
      const alpha = Math.sin(life * Math.PI) * 0.7;
      if (alpha < 0.05) continue;
      const angle = (i / 3) * Math.PI * 2 + frame * 0.03;
      const dist = 8 * s + life * 3 * s;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sparkColors[i];
      ctx.font = `${1.2 * s}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('✦', cx + Math.cos(angle) * dist, 9 * s + bob - 3 * s + Math.sin(angle) * dist * 0.4);
      ctx.restore();
    }
  }
}
