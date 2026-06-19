import { Ctx, blob, radialGrad, groundShadow, glint, fill, stroke } from './sprite-utils';

export function drawTogepi(
  ctx: Ctx,
  frame: number,
  scale: number,
  eyeDir?: { dx: number; dy: number },
  mood?: string,
): void {
  const s  = scale;
  const cx = 8 * s;
  const bob = Math.sin(frame * 0.05) * 0.6 * s;
  const happy = mood === 'happy';

  // Happy togepi hops
  const hop = happy ? Math.abs(Math.sin(frame * 0.12)) * 1.5 * s : 0;

  groundShadow(ctx, cx, 15.5 * s - hop * 0.3, 4.5 * s, 1.2 * s, 0.2 - hop * 0.03);

  // ── Eggshell body ────────────────────────────────────────────
  const bodyY = 10 * s + bob - hop;
  const eggGrad = radialGrad(ctx, cx - 1.5 * s, bodyY - 3 * s, 5.5 * s, '#FFFFF0', '#F0EEDD');
  blob(ctx, eggGrad, '#C8C0A0', 0.8 * s, () => {
    // Classic egg oval — wider at bottom
    ctx.ellipse(cx, bodyY, 5 * s, 5.5 * s, 0, 0, Math.PI * 2);
  });

  // ── Egg pattern triangles (Togepi's shell markings) ──────────
  // Red triangles
  const triData = [
    { x: cx - 2.5 * s, y: bodyY - 1 * s, r: 1.0 * s, color: '#E84848' },
    { x: cx + 1.5 * s, y: bodyY - 3 * s, r: 0.8 * s, color: '#E84848' },
    { x: cx - 0.5 * s, y: bodyY + 2 * s, r: 0.9 * s, color: '#4888E8' },
    { x: cx + 2.8 * s, y: bodyY + 0.5 * s, r: 0.75 * s, color: '#4888E8' },
    { x: cx - 3 * s, y: bodyY + 2.5 * s, r: 0.7 * s, color: '#E84848' },
  ];
  for (const tri of triData) {
    fill(ctx, tri.color, 0.75, () => {
      ctx.moveTo(tri.x, tri.y - tri.r);
      ctx.lineTo(tri.x + tri.r * 0.866, tri.y + tri.r * 0.5);
      ctx.lineTo(tri.x - tri.r * 0.866, tri.y + tri.r * 0.5);
      ctx.closePath();
    });
  }

  // ── Shell crack lines ─────────────────────────────────────────
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#C0B890';
  ctx.lineWidth = 0.5 * s;
  ctx.lineCap = 'round';
  // Jagged crack on the upper shell
  ctx.beginPath();
  ctx.moveTo(cx - 2 * s, bodyY - 2.5 * s);
  ctx.lineTo(cx - 1 * s, bodyY - 4 * s);
  ctx.lineTo(cx, bodyY - 3.5 * s);
  ctx.lineTo(cx + 1 * s, bodyY - 4.5 * s);
  ctx.lineTo(cx + 2 * s, bodyY - 2.5 * s);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Tiny arms poking out ──────────────────────────────────────
  const armWave = Math.sin(frame * 0.06) * 8;
  ctx.save();
  ctx.translate(cx - 5.5 * s, bodyY);
  ctx.rotate((-armWave * Math.PI) / 180);
  blob(ctx, '#FFFFF0', '#C8C0A0', 0.5 * s, () => {
    ctx.ellipse(0, 0, 1 * s, 1.8 * s, 0.3, 0, Math.PI * 2);
  });
  ctx.restore();

  ctx.save();
  ctx.translate(cx + 5.5 * s, bodyY);
  ctx.rotate((armWave * Math.PI) / 180);
  blob(ctx, '#FFFFF0', '#C8C0A0', 0.5 * s, () => {
    ctx.ellipse(0, 0, 1 * s, 1.8 * s, -0.3, 0, Math.PI * 2);
  });
  ctx.restore();

  // ── Head peeking out from top of egg ─────────────────────────
  const headY = bodyY - 5 * s;
  const headGrad = radialGrad(ctx, cx - s, headY - s, 3 * s, '#FFF8E0', '#F0D8A0');
  blob(ctx, headGrad, '#C8B080', 0.75 * s, () => {
    ctx.arc(cx, headY, 3 * s, 0, Math.PI * 2);
  });

  // ── Togepi's spike crown (3 spikes on top) ────────────────────
  const spikeColors = ['#E84848', '#4888E8', '#E84848'];
  for (let i = 0; i < 3; i++) {
    const sx = cx + (i - 1) * 1.6 * s;
    const spikeWobble = Math.sin(frame * 0.05 + i * 1.2) * 0.3 * s;
    fill(ctx, spikeColors[i], 0.85, () => {
      ctx.moveTo(sx - 0.7 * s, headY - 2.8 * s);
      ctx.lineTo(sx, headY - 4.5 * s + spikeWobble);
      ctx.lineTo(sx + 0.7 * s, headY - 2.8 * s);
      ctx.closePath();
    });
  }

  // ── Face ────────────────────────────────────────────────────
  const edx = eyeDir ? eyeDir.dx * 0.2 * s : 0;
  const edy = eyeDir ? eyeDir.dy * 0.15 * s : 0;
  const eyeY = headY + 0.3 * s;
  const blink = (frame % 70) < 3;

  if (!blink) {
    blob(ctx, '#ffffff', '#C8B080', 0.35 * s, () => {
      ctx.ellipse(cx - 1.3 * s, eyeY, 1.1 * s, 1.2 * s, 0, 0, Math.PI * 2);
    });
    blob(ctx, '#ffffff', '#C8B080', 0.35 * s, () => {
      ctx.ellipse(cx + 1.3 * s, eyeY, 1.1 * s, 1.2 * s, 0, 0, Math.PI * 2);
    });
    // Blue-grey iris
    fill(ctx, '#5060A0', 1, () => {
      ctx.arc(cx - 1.3 * s + edx, eyeY + edy, 0.65 * s, 0, Math.PI * 2);
      ctx.arc(cx + 1.3 * s + edx, eyeY + edy, 0.65 * s, 0, Math.PI * 2);
    });
    fill(ctx, '#1A1A2A', 1, () => {
      ctx.arc(cx - 1.3 * s + edx, eyeY + edy, 0.35 * s, 0, Math.PI * 2);
      ctx.arc(cx + 1.3 * s + edx, eyeY + edy, 0.35 * s, 0, Math.PI * 2);
    });
    glint(ctx, cx - 1.3 * s + edx - 0.15 * s, eyeY + edy - 0.2 * s, 0.15 * s);
    glint(ctx, cx + 1.3 * s + edx - 0.15 * s, eyeY + edy - 0.2 * s, 0.15 * s);
  } else {
    stroke(ctx, '#C8B080', 0.5 * s, 1, () => {
      ctx.arc(cx - 1.3 * s, eyeY + 0.35 * s, 0.65 * s, Math.PI, 0);
      ctx.arc(cx + 1.3 * s, eyeY + 0.35 * s, 0.65 * s, Math.PI, 0);
    });
  }

  // Tiny nose dots
  fill(ctx, '#C8B080', 0.6, () => {
    ctx.arc(cx - 0.4 * s, eyeY + 0.9 * s, 0.22 * s, 0, Math.PI * 2);
    ctx.arc(cx + 0.4 * s, eyeY + 0.9 * s, 0.22 * s, 0, Math.PI * 2);
  });

  // Happy smile / neutral
  stroke(ctx, '#C8B080', 0.45 * s, 0.8, () => {
    if (happy) {
      ctx.arc(cx, eyeY + 2.2 * s, 1.2 * s, Math.PI * 1.1, Math.PI * 1.9);
    } else {
      ctx.arc(cx, eyeY + 1.8 * s, 0.8 * s, Math.PI * 1.15, Math.PI * 1.85);
    }
  });

  // ── Rosy cheeks ────────────────────────────────────────────────
  fill(ctx, '#FFB0B0', 0.3, () => {
    ctx.ellipse(cx - 2.6 * s, eyeY + 1 * s, 1.0 * s, 0.7 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 2.6 * s, eyeY + 1 * s, 1.0 * s, 0.7 * s, 0, 0, Math.PI * 2);
  });

  // ── Happy sparkles ────────────────────────────────────────────
  if (happy) {
    for (let i = 0; i < 3; i++) {
      const sp = (frame * 0.6 + i * 15) % 45;
      const life = sp / 45;
      const alpha = Math.sin(life * Math.PI) * 0.6;
      if (alpha < 0.05) continue;
      const angle = (i / 3) * Math.PI * 2 + frame * 0.04;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ['#FFE060', '#FF88BB', '#88DDFF'][i];
      ctx.font = `${1.0 * s}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('✦', cx + Math.cos(angle) * 6 * s, headY - 1 * s + Math.sin(angle) * 3 * s - life * 2 * s);
      ctx.restore();
    }
  }
}
