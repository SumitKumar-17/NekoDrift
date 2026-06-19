// ── Particle effects: steam, zzz, hearts, sparkles ─────────────

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

// A plump filled heart centred at (cx, cy), half-width ~s.
function heartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s);
  ctx.bezierCurveTo(cx - s * 1.3, cy, cx - s * 0.85, cy - s * 1.15, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.85, cy - s * 1.15, cx + s * 1.3, cy, cx, cy + s);
  ctx.closePath();
}

export function drawHearts(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number,
): void {
  const t = frame;
  for (let i = 0; i < 3; i++) {
    const off = ((t + i * 28) % 70) / 70;
    const alpha = Math.sin(off * Math.PI) * 0.8;
    if (alpha < 0.05) continue;
    const px = x + (i - 1) * scale * 5 + Math.sin(off * Math.PI * 2 + i) * scale * 1.8;
    const py = y - off * scale * 11;
    // gentle pop-in then drift: grow quickly, hold
    const sz = scale * (1.0 + Math.min(1, off * 4) * 0.5);

    ctx.save();
    ctx.globalAlpha = alpha;
    // soft pink body
    ctx.fillStyle = '#f48fb0';
    heartShape(ctx, px, py, sz);
    ctx.fill();
    // glossy catch-light on the left lobe
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(px - sz * 0.45, py - sz * 0.45, sz * 0.22, sz * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Small sparkle burst (used for pet feedback, celebrations)
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = rot + (i * Math.PI * 2) / 5 - Math.PI / 2;
    const a2 = rot + ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    else ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    ctx.lineTo(cx + r * 0.42 * Math.cos(a2), cy + r * 0.42 * Math.sin(a2));
  }
  ctx.closePath();
}

export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number, scale: number,
): void {
  const t = frame;
  const colors = ['#FFE060', '#FF88BB', '#88DDFF', '#AAFFC0', '#FFAA44'];
  for (let i = 0; i < 5; i++) {
    const phase = (t * 1.2 + i * 22) % 60;
    const life = phase / 60;
    const alpha = Math.sin(life * Math.PI) * 0.9;
    if (alpha < 0.05) continue;
    const angle = (i * Math.PI * 2) / 5;
    const dist = scale * (4 + life * 10);
    const px = x + Math.cos(angle + t * 0.04) * dist;
    const py = y - scale * 4 + Math.sin(angle + t * 0.04) * dist * 0.5;
    const sz = scale * (0.8 + (1 - life) * 1.0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[i % colors.length];
    drawStar(ctx, px, py, sz, (t * 0.08 + i) % (Math.PI * 2));
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Month 0-11 based seasonal overlay particles (snow, hearts, etc.)
export function drawSeasonalParticles(
  ctx: CanvasRenderingContext2D,
  canvasW: number, canvasH: number,
  frame: number,
  scale: number,
): void {
  const month = new Date().getMonth(); // 0=Jan..11=Dec
  if (month === 11 || month === 0) {
    // Dec–Jan: falling snowflakes
    for (let i = 0; i < 8; i++) {
      const cycle = 120;
      const phase = (frame * 0.5 + i * 15) % cycle;
      const life = phase / cycle;
      const alpha = Math.sin(life * Math.PI) * 0.55;
      if (alpha < 0.04) continue;
      const x = (((i * 137 + phase * 3) % canvasW) + canvasW) % canvasW;
      const y = life * canvasH * 0.9;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#EEEEFF';
      ctx.font = `${scale * 2}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('❄', x, y);
      ctx.restore();
    }
  } else if (month === 1) {
    // Feb: floating pink hearts
    for (let i = 0; i < 4; i++) {
      const cycle = 90;
      const phase = (frame * 0.4 + i * 22) % cycle;
      const life = phase / cycle;
      const alpha = Math.sin(life * Math.PI) * 0.4;
      if (alpha < 0.04) continue;
      const x = 20 + i * (canvasW / 4) + Math.sin(life * Math.PI * 2 + i) * 10;
      const y = (1 - life) * canvasH;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${scale * 2.5}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('💕', x, y);
      ctx.restore();
    }
  } else if (month === 9) {
    // Oct: spooky ghost wisps
    for (let i = 0; i < 3; i++) {
      const cycle = 100;
      const phase = (frame * 0.3 + i * 33) % cycle;
      const life = phase / cycle;
      const alpha = Math.sin(life * Math.PI) * 0.3;
      if (alpha < 0.03) continue;
      const x = 15 + i * (canvasW / 3) + Math.sin(life * Math.PI * 4 + i) * 8;
      const y = (1 - life) * canvasH * 0.8 + 10;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${scale * 2}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('👻', x, y);
      ctx.restore();
    }
  }
}
