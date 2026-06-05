// ── Particle effects: steam, zzz, hearts ──────────────────────

export function drawSteam(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number,
): void {
  const t = frame;
  for (let i = 0; i < 4; i++) {
    const offset = (i * 20 + t * 1.8) % 56;
    const alpha = (1 - offset / 56) * 0.65;
    const size = scale * 1.5 + (offset / 56) * scale * 3.5;
    const px = x + (i - 1.5) * scale * 3.5;
    const py = y - offset * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? '#ffbb88' : '#ffddbb';
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawZzz(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number,
): void {
  const t = frame;
  ctx.font = `bold ${scale * 5}px monospace`;
  const zs = ['z', 'z', 'Z'];
  zs.forEach((z, i) => {
    const off = ((t + i * 35) % 105) / 105;
    ctx.globalAlpha = Math.sin(off * Math.PI) * 0.65;
    ctx.fillStyle = '#7a8fa8';
    ctx.fillText(z, x + i * scale * 4, y - off * scale * 10);
  });
  ctx.globalAlpha = 1;
}

export function drawHearts(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number,
): void {
  const t = frame;
  for (let i = 0; i < 3; i++) {
    const off = ((t + i * 28) % 70) / 70;
    const alpha = Math.sin(off * Math.PI) * 0.75;
    if (alpha < 0.05) continue;
    const px = x + (i - 1) * scale * 5 + Math.sin(off * Math.PI * 2) * scale * 1.5;
    const py = y - off * scale * 10;
    const sz = scale * 1.2;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f4a7b9';
    ctx.font = `${Math.round(sz * 2.5)}px serif`;
    ctx.fillText('♡', px - sz, py);
  }
  ctx.globalAlpha = 1;
}
