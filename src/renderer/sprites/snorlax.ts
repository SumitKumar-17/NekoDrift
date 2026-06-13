import { fill, stroke, blob, radialGrad, groundShadow, drawZzz, Ctx } from './sprite-utils';

export function drawSnorlax(ctx: Ctx, frame: number, scale: number, isIdle = false): void {
  const u = (n: number) => n * scale;
  const t = frame;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Slower breath when awake, extra-slow when asleep
  const breathRate = isIdle ? 0.022 : 0.038;
  const breathAmp  = isIdle ? 0.26  : 0.14;
  const by = Math.sin(t * breathRate) * breathAmp;

  // ── Palette ─────────────────────────────────────────────────
  const ink       = '#243845';
  const bodyLight = '#7791a0';
  const bodyMid   = '#5e7888';
  const bodyDeep  = '#43606f';
  const belly     = '#f2ead0';
  const bellyMid  = '#e2d6ad';
  const black     = '#1a1a1a';
  const nail      = '#cfe0e8';
  const zColor    = '#a8d0e0';
  const lw = u(0.3);

  // ── Ground shadow ───────────────────────────────────────────
  groundShadow(ctx, u(8), u(16.0), u(5.6), u(1.1), 0.18);

  // ── ARMS (behind body) ──────────────────────────────────────
  blob(ctx, bodyMid, ink, lw, () => {
    ctx.ellipse(u(2.7), u(11.8 + by), u(2.2), u(1.4), 0.4, 0, Math.PI * 2);
  });
  blob(ctx, bodyMid, ink, lw, () => {
    ctx.ellipse(u(13.3), u(11.8 + by), u(2.2), u(1.4), -0.4, 0, Math.PI * 2);
  });
  // arm claws
  for (let i = -1; i <= 1; i++) {
    stroke(ctx, ink, u(0.13), 0.7, () => {
      ctx.moveTo(u(1.9 + i * 0.5), u(12.9 + by)); ctx.lineTo(u(1.7 + i * 0.44), u(13.7 + by));
    });
    stroke(ctx, ink, u(0.13), 0.7, () => {
      ctx.moveTo(u(14.1 - i * 0.5), u(12.9 + by)); ctx.lineTo(u(14.3 - i * 0.44), u(13.7 + by));
    });
  }

  // ── FEET (behind body, big nubs) ────────────────────────────
  blob(ctx, bodyMid, ink, lw, () => {
    ctx.ellipse(u(5.3), u(15.2 + by), u(2.0), u(1.25), 0, 0, Math.PI * 2);
  });
  blob(ctx, bodyMid, ink, lw, () => {
    ctx.ellipse(u(10.7), u(15.2 + by), u(2.0), u(1.25), 0, 0, Math.PI * 2);
  });
  // foot pads (cream ovals with toe nails)
  fill(ctx, belly, 0.85, () => { ctx.ellipse(u(5.3), u(15.5 + by), u(1.2), u(0.7), 0, 0, Math.PI * 2); });
  fill(ctx, belly, 0.85, () => { ctx.ellipse(u(10.7), u(15.5 + by), u(1.2), u(0.7), 0, 0, Math.PI * 2); });
  for (const fx of [4.6, 5.3, 6.0]) {
    fill(ctx, nail, 0.8, () => { ctx.ellipse(u(fx), u(14.9 + by), u(0.28), u(0.4), 0, 0, Math.PI * 2); });
  }
  for (const fx of [10.0, 10.7, 11.4]) {
    fill(ctx, nail, 0.8, () => { ctx.ellipse(u(fx), u(14.9 + by), u(0.28), u(0.4), 0, 0, Math.PI * 2); });
  }

  // ── HUGE ROUND BODY ─────────────────────────────────────────
  blob(ctx, radialGrad(ctx, u(6.5), u(9.6 + by), u(7.0), bodyLight, bodyDeep), ink, lw, () => {
    ctx.ellipse(u(8), u(11.0 + by), u(6.0), u(4.7), 0, 0, Math.PI * 2);
  });

  // ── CREAM BELLY ─────────────────────────────────────────────
  blob(ctx, radialGrad(ctx, u(7.4), u(10.8 + by), u(4.4), belly, bellyMid), '#c4b884', u(0.16), () => {
    ctx.ellipse(u(8), u(11.6 + by), u(4.2), u(3.7), 0, 0, Math.PI * 2);
  });

  // ── SMALL HEAD (overlaps body top) ──────────────────────────
  blob(ctx, radialGrad(ctx, u(7), u(4.8 + by), u(3.6), bodyLight, bodyMid), ink, lw, () => {
    ctx.arc(u(8), u(5.8 + by), u(3.3), 0, Math.PI * 2);
  });

  // ── ROUND EARS ──────────────────────────────────────────────
  blob(ctx, bodyMid, ink, lw, () => { ctx.arc(u(4.9), u(3.5 + by), u(1.15), 0, Math.PI * 2); });
  blob(ctx, bodyMid, ink, lw, () => { ctx.arc(u(11.1), u(3.5 + by), u(1.15), 0, Math.PI * 2); });
  fill(ctx, bodyDeep, 0.55, () => { ctx.arc(u(4.9), u(3.7 + by), u(0.6), 0, Math.PI * 2); });
  fill(ctx, bodyDeep, 0.55, () => { ctx.arc(u(11.1), u(3.7 + by), u(0.6), 0, Math.PI * 2); });

  // ── FACE ─────────────────────────────────────────────────────
  if (isIdle) {
    // Sleeping: closed happy-arc eyes
    stroke(ctx, black, u(0.26), 0.9, () => {
      ctx.moveTo(u(5.6), u(5.6 + by));
      ctx.quadraticCurveTo(u(6.5), u(4.9 + by), u(7.3), u(5.6 + by));
    });
    stroke(ctx, black, u(0.26), 0.9, () => {
      ctx.moveTo(u(8.7), u(5.6 + by));
      ctx.quadraticCurveTo(u(9.5), u(4.9 + by), u(10.4), u(5.6 + by));
    });
  } else {
    // Awake: tiny beady eyes (Snorlax canonical look)
    const blinkOpen = !((t % 260) > 252);
    if (blinkOpen) {
      fill(ctx, black, 0.9, () => { ctx.arc(u(6.4), u(5.15 + by), u(0.42), 0, Math.PI * 2); });
      fill(ctx, black, 0.9, () => { ctx.arc(u(9.6), u(5.15 + by), u(0.42), 0, Math.PI * 2); });
      // tiny glints
      fill(ctx, '#ffffff', 0.75, () => { ctx.arc(u(6.26), u(5.03 + by), u(0.14), 0, Math.PI * 2); });
      fill(ctx, '#ffffff', 0.75, () => { ctx.arc(u(9.46), u(5.03 + by), u(0.14), 0, Math.PI * 2); });
    } else {
      // blink: thin arcs
      stroke(ctx, black, u(0.22), 0.85, () => {
        ctx.moveTo(u(5.9), u(5.15 + by)); ctx.lineTo(u(6.9), u(5.15 + by));
        ctx.moveTo(u(9.1), u(5.15 + by)); ctx.lineTo(u(10.1), u(5.15 + by));
      });
    }
  }
  // rosy cheeks (always)
  fill(ctx, '#d49a9a', 0.3, () => { ctx.ellipse(u(5.6), u(6.5 + by), u(0.95), u(0.68), 0, 0, Math.PI * 2); });
  fill(ctx, '#d49a9a', 0.3, () => { ctx.ellipse(u(10.4), u(6.5 + by), u(0.95), u(0.68), 0, 0, Math.PI * 2); });
  // nose
  fill(ctx, bodyDeep, 0.85, () => { ctx.ellipse(u(8), u(6.6 + by), u(0.44), u(0.32), 0, 0, Math.PI * 2); });
  // content smile (always)
  stroke(ctx, ink, u(0.2), 0.7, () => {
    ctx.moveTo(u(7.3), u(7.2 + by));
    ctx.quadraticCurveTo(u(8), u(7.7 + by), u(8.7), u(7.2 + by));
  });

  // ── ZZZ floaters (only when idle) ───────────────────────────
  if (isIdle) {
    const zzPhase = (t * 0.012) % 3;
    const zDefs: [number, number, number, number][] = [
      [11.8, 3.8, 0.62, 0.0],
      [13.0, 2.4, 0.80, 1.0],
      [14.2, 0.9, 1.00, 2.0],
    ];
    for (const [zx, zyBase, zs, phaseOff] of zDefs) {
      const p = ((zzPhase + phaseOff) % 3) / 3;
      const zy = zyBase - p * 2.0;
      const alpha = p < 0.15 ? p / 0.15 * 0.85 : p > 0.75 ? (1 - p) / 0.25 * 0.85 : 0.85;
      drawZzz(ctx, u(zx), u(zy + by), u(zs), zColor, alpha);
    }
  }
}
