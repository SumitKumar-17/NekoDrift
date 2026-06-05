// Snorlax — programmatic canvas 2D renderer

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

export function drawSnorlax(ctx: C, frame: number, scale: number): void {
  const u = (n: number) => n * scale;
  const t = frame;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Snorlax slowly bobs (always sleeping)
  const bobY = Math.sin(t * 0.025) * 0.3;
  const by = bobY;

  const teal = '#4a8c7a';
  const darkTeal = '#2d6655';
  const cream = '#f0e8c8';
  const tan = '#d4c090';
  const black = '#1a1a1a';
  const nailColor = '#8ab8a8';

  // ── BIG ROUND BODY ────────────────────────────────────────
  fill(ctx, teal, 1, () => { ctx.ellipse(u(8), u(10.5 + by), u(6.2), u(4.8), 0, 0, Math.PI * 2); });

  // ── CREAM BELLY ───────────────────────────────────────────
  fill(ctx, cream, 1, () => { ctx.ellipse(u(8), u(11.0 + by), u(4.2), u(3.8), 0, 0, Math.PI * 2); });

  // ── ARMS (round stubs lying forward) ─────────────────────
  fill(ctx, teal, 1, () => { ctx.ellipse(u(2.8), u(11.5 + by), u(2.0), u(1.3), 0.35, 0, Math.PI * 2); });
  fill(ctx, teal, 1, () => { ctx.ellipse(u(13.2), u(11.5 + by), u(2.0), u(1.3), -0.35, 0, Math.PI * 2); });
  // Nail lines on arms
  for (let i = -1; i <= 1; i++) {
    stroke(ctx, darkTeal, u(0.1), 0.5, () => {
      ctx.moveTo(u(2.2 + i * 0.45), u(12.5 + by));
      ctx.lineTo(u(2.0 + i * 0.4), u(13.1 + by));
    });
    stroke(ctx, darkTeal, u(0.1), 0.5, () => {
      ctx.moveTo(u(13.8 - i * 0.45), u(12.5 + by));
      ctx.lineTo(u(14.0 - i * 0.4), u(13.1 + by));
    });
  }

  // ── SMALL HEAD ────────────────────────────────────────────
  fill(ctx, teal, 1, () => { ctx.arc(u(8), u(5.8 + by), u(3.2), 0, Math.PI * 2); });

  // ── TINY EARS ─────────────────────────────────────────────
  fill(ctx, teal, 1, () => { ctx.arc(u(4.8), u(3.5 + by), u(1.1), 0, Math.PI * 2); });
  fill(ctx, teal, 1, () => { ctx.arc(u(11.2), u(3.5 + by), u(1.1), 0, Math.PI * 2); });
  fill(ctx, darkTeal, 0.55, () => { ctx.arc(u(4.8), u(3.5 + by), u(0.6), 0, Math.PI * 2); });
  fill(ctx, darkTeal, 0.55, () => { ctx.arc(u(11.2), u(3.5 + by), u(0.6), 0, Math.PI * 2); });

  // ── FACE (always asleep) ──────────────────────────────────
  // Closed eyes as happy arcs
  stroke(ctx, black, u(0.24), 0.85, () => {
    ctx.moveTo(u(5.8), u(5.6 + by));
    ctx.quadraticCurveTo(u(6.6), u(5.0 + by), u(7.2), u(5.6 + by));
  });
  stroke(ctx, black, u(0.24), 0.85, () => {
    ctx.moveTo(u(8.8), u(5.6 + by));
    ctx.quadraticCurveTo(u(9.4), u(5.0 + by), u(10.2), u(5.6 + by));
  });

  // Small nose
  fill(ctx, darkTeal, 0.8, () => { ctx.ellipse(u(8), u(6.5 + by), u(0.42), u(0.3), 0, 0, Math.PI * 2); });

  // Tiny smile
  stroke(ctx, darkTeal, u(0.18), 0.7, () => {
    ctx.moveTo(u(7.4), u(7.1 + by));
    ctx.quadraticCurveTo(u(8), u(7.5 + by), u(8.6), u(7.1 + by));
  });

  // ── FEET (small round nubs at bottom) ─────────────────────
  fill(ctx, teal, 1, () => { ctx.ellipse(u(5.5), u(14.8 + by), u(1.8), u(1.1), 0, 0, Math.PI * 2); });
  fill(ctx, teal, 1, () => { ctx.ellipse(u(10.5), u(14.8 + by), u(1.8), u(1.1), 0, 0, Math.PI * 2); });
  fill(ctx, nailColor, 0.65, () => { ctx.ellipse(u(5.2), u(15.2 + by), u(0.5), u(0.35), -0.2, 0, Math.PI * 2); });
  fill(ctx, nailColor, 0.65, () => { ctx.ellipse(u(5.8), u(15.3 + by), u(0.5), u(0.35), 0.1, 0, Math.PI * 2); });
  fill(ctx, nailColor, 0.65, () => { ctx.ellipse(u(10.2), u(15.2 + by), u(0.5), u(0.35), -0.1, 0, Math.PI * 2); });
  fill(ctx, nailColor, 0.65, () => { ctx.ellipse(u(10.8), u(15.3 + by), u(0.5), u(0.35), 0.2, 0, Math.PI * 2); });
}
