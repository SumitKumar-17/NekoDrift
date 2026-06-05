// Gengar — programmatic canvas 2D renderer

type C = CanvasRenderingContext2D;

function fill(ctx: C, color: string, alpha: number, shape: () => void) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); shape(); ctx.fill(); ctx.restore();
}
function stroke(ctx: C, color: string, width: number, alpha: number, shape: () => void) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); shape(); ctx.stroke(); ctx.restore();
}

export function drawGengar(ctx: C, frame: number, scale: number, eyeDir?: { dx: number; dy: number }): void {
  const u = (n: number) => n * scale;
  const t = frame;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const bobY = Math.sin(t * 0.06) * 0.45;
  const blinkOpen = !((t % 160) > 154);
  const by = bobY;

  const purple = '#7b52ab';
  const darkPurple = '#4a2d7a';
  const lightPurple = '#9b72cb';
  const red = '#cc2222';
  const white = '#ffffff';
  const black = '#1a1a1a';
  const pink = '#ff88aa';

  // ── BODY (spiky round shape) ──────────────────────────────
  // Draw spiky outline manually
  const spikes = 12;
  const cx = u(8), cy = u(10 + by);
  const innerR = u(4.2), outerR = u(5.0);
  fill(ctx, purple, 1, () => {
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      else ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
  });
  // Soft belly highlight
  fill(ctx, lightPurple, 0.38, () => { ctx.ellipse(u(7.5), u(9.5 + by), u(2.5), u(2.0), -0.15, 0, Math.PI * 2); });

  // ── ARMS (stubby) ─────────────────────────────────────────
  fill(ctx, purple, 1, () => {
    ctx.moveTo(u(3.5), u(9.5 + by));
    ctx.bezierCurveTo(u(1.5), u(8.5 + by), u(0.8), u(11 + by), u(2.5), u(11.5 + by));
    ctx.bezierCurveTo(u(3.2), u(11.8 + by), u(3.5), u(10.5 + by), u(3.5), u(9.5 + by));
    ctx.closePath();
  });
  fill(ctx, purple, 1, () => {
    ctx.moveTo(u(12.5), u(9.5 + by));
    ctx.bezierCurveTo(u(14.5), u(8.5 + by), u(15.2), u(11 + by), u(13.5), u(11.5 + by));
    ctx.bezierCurveTo(u(12.8), u(11.8 + by), u(12.5), u(10.5 + by), u(12.5), u(9.5 + by));
    ctx.closePath();
  });

  // ── HEAD ─────────────────────────────────────────────────
  // Spiky head
  const hSpikes = 8, hcx = u(8), hcy = u(4.5 + by);
  const hiR = u(3.4), hoR = u(4.1);
  fill(ctx, purple, 1, () => {
    for (let i = 0; i < hSpikes * 2; i++) {
      const angle = (i * Math.PI) / hSpikes - Math.PI / 2;
      const r = i % 2 === 0 ? hoR : hiR;
      if (i === 0) ctx.moveTo(hcx + Math.cos(angle) * r, hcy + Math.sin(angle) * r);
      else ctx.lineTo(hcx + Math.cos(angle) * r, hcy + Math.sin(angle) * r);
    }
    ctx.closePath();
  });

  // ── EYES ─────────────────────────────────────────────────
  const ey = 4.0 + by;
  if (!blinkOpen) {
    stroke(ctx, red, u(0.2), 0.9, () => {
      ctx.moveTo(u(5.8), u(ey)); ctx.lineTo(u(7.0), u(ey));
      ctx.moveTo(u(9.0), u(ey)); ctx.lineTo(u(10.2), u(ey));
    });
  } else {
    // Spiral red eyes
    fill(ctx, red, 1, () => { ctx.arc(u(6.4), u(ey), u(0.85), 0, Math.PI * 2); });
    fill(ctx, red, 1, () => { ctx.arc(u(9.6), u(ey), u(0.85), 0, Math.PI * 2); });
    // White pupils
    const ex = eyeDir ? eyeDir.dx * 0.22 : 0;
    const edy = eyeDir ? eyeDir.dy * 0.14 : 0;
    fill(ctx, white, 1, () => { ctx.arc(u(6.4 + ex), u(ey + edy), u(0.38), 0, Math.PI * 2); });
    fill(ctx, white, 1, () => { ctx.arc(u(9.6 + ex), u(ey + edy), u(0.38), 0, Math.PI * 2); });
  }

  // ── WIDE GRIN ─────────────────────────────────────────────
  fill(ctx, white, 1, () => {
    ctx.arc(u(8), u(5.5 + by), u(2.8), Math.PI * 0.1, Math.PI * 0.9);
  });
  fill(ctx, black, 0.92, () => {
    ctx.arc(u(8), u(5.5 + by), u(2.8), Math.PI * 0.1, Math.PI * 0.9);
    // Remove just the teeth strip
  });
  // Re-draw white teeth as rectangles
  fill(ctx, white, 1, () => {
    ctx.arc(u(8), u(6.8 + by), u(2.6), Math.PI * 0.1, Math.PI * 0.9);
  });
  // Teeth dividers
  for (let i = 0; i < 5; i++) {
    const tx = u(5.2 + i * 1.1);
    stroke(ctx, purple, u(0.12), 0.9, () => {
      ctx.moveTo(tx, u(5.9 + by)); ctx.lineTo(tx, u(7.2 + by));
    });
  }
  // Pink tongue
  fill(ctx, pink, 0.85, () => { ctx.ellipse(u(8), u(7.2 + by), u(1.2), u(0.7), 0, 0, Math.PI * 2); });

  // ── TINY FEET ─────────────────────────────────────────────
  fill(ctx, darkPurple, 0.9, () => { ctx.ellipse(u(5.8), u(14.2 + by), u(1.3), u(0.78), -0.15, 0, Math.PI * 2); });
  fill(ctx, darkPurple, 0.9, () => { ctx.ellipse(u(10.2), u(14.2 + by), u(1.3), u(0.78), 0.15, 0, Math.PI * 2); });
}
