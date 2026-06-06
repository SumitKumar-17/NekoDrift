export type Ctx = CanvasRenderingContext2D;

export function fill(ctx: Ctx, color: string | CanvasGradient, alpha: number, shape: () => void): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color as string;
  ctx.beginPath();
  shape();
  ctx.fill();
  ctx.restore();
}

export function stroke(ctx: Ctx, color: string, width: number, alpha: number, shape: () => void): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  shape();
  ctx.stroke();
  ctx.restore();
}

// Fill AND outline a path in one pass. The dark edge is what gives
// vector sprites a crisp, "drawn" look instead of flat melting blobs.
export function blob(
  ctx: Ctx,
  fillColor: string | CanvasGradient,
  lineColor: string,
  lineWidth: number,
  shape: () => void,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  shape();
  ctx.fillStyle = fillColor as string;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

// Radial gradient for volume shading — light from the upper-left.
export function radialGrad(
  ctx: Ctx, x: number, y: number, r: number,
  inner: string, outer: string,
): CanvasGradient {
  const g = ctx.createRadialGradient(
    x - r * 0.34, y - r * 0.4, r * 0.08,
    x, y, r * 1.05,
  );
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  return g;
}

// Soft elliptical contact shadow under a floating/standing sprite.
export function groundShadow(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.18): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Glossy catch-light: a bright dot plus a faint lower bounce in one go.
export function glint(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(x + r * 1.6, y + r * 2.2, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Draws a Pokémon-style Z floater (zzz sleeping animation)
export function drawZzz(
  ctx: Ctx, cx: number, cy: number, size: number,
  color: string, alpha: number,
): void {
  if (alpha <= 0) return;
  const hw = size * 0.42;
  const hh = size * 0.5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - hh);
  ctx.lineTo(cx + hw, cy - hh);
  ctx.lineTo(cx - hw, cy + hh);
  ctx.lineTo(cx + hw, cy + hh);
  ctx.stroke();
  ctx.restore();
}
