import { CatColor } from '../../../shared/types';
import { CAT_COLORS } from '../../../shared/constants';

// ── Pomodoro timer HUD ────────────────────────────────────────

export function drawPomodoroTimer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  remainingMs: number,
  mode: 'focus' | 'break' | 'idle',
  scale: number,
): void {
  if (mode === 'idle') return;
  const min = Math.floor(remainingMs / 60000);
  const sec = Math.floor((remainingMs % 60000) / 1000);
  const emoji = mode === 'focus' ? '🍅' : '☕';
  const text = `${emoji} ${min}:${String(sec).padStart(2, '0')}`;
  const fontSize = Math.max(11, scale * 3.2);
  ctx.font = `700 ${fontSize}px 'Inter', monospace`;
  const tw = ctx.measureText(text).width + 14;
  const th = fontSize + 10;

  const urgent = remainingMs < 60_000;
  const pulse = urgent ? 0.6 + 0.4 * Math.sin(Date.now() / 300) : 1;

  ctx.save();
  // Soft drop shadow so the pill floats above the desktop
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.globalAlpha = 0.95 * pulse;
  // Vertical gradient fill for a glossier capsule
  const grad = ctx.createLinearGradient(0, y - th / 2, 0, y + th / 2);
  if (mode === 'focus') { grad.addColorStop(0, '#f4724f'); grad.addColorStop(1, '#d8492e'); }
  else { grad.addColorStop(0, '#5aa0e6'); grad.addColorStop(1, '#3a7fc8'); }
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - tw / 2, y - th / 2, tw, th, th / 2);
  else ctx.rect(x - tw / 2, y - th / 2, tw, th);
  ctx.fill();
  ctx.restore();

  // Glossy top highlight
  ctx.save();
  ctx.globalAlpha = 0.16 * pulse;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - tw / 2 + 3, y - th / 2 + 2, tw - 6, th / 2 - 1, th / 4);
  else ctx.rect(x - tw / 2 + 3, y - th / 2 + 2, tw - 6, th / 2 - 1);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── Speech bubble (transient messages + pinned sticky note) ───

export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  catX: number,
  catY: number,
  scale: number,
  isPinned = false,
): void {
  const padding = 9;
  const fontSize = Math.max(11, scale * 3.5);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

  const maxW = 200;
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW - padding * 2 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const lineH = fontSize + 4;
  const textW = Math.min(maxW - padding * 2, Math.max(...lines.map(l => ctx.measureText(l).width)));
  const bW = textW + padding * 2;
  const bH = lines.length * lineH + padding * 1.5;
  const bX = catX - bW / 2;
  const bY = catY - bH - 16;
  const r = 9;

  ctx.save();
  // Soft drop shadow lifts the bubble off the desktop
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = isPinned ? 'rgba(255,247,214,0.98)' : 'rgba(255,255,255,0.98)';
  ctx.beginPath();
  ctx.moveTo(bX + r, bY);
  ctx.lineTo(bX + bW - r, bY);
  ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + r);
  ctx.lineTo(bX + bW, bY + bH - r);
  ctx.quadraticCurveTo(bX + bW, bY + bH, bX + bW - r, bY + bH);
  ctx.lineTo(bX + r, bY + bH);
  ctx.quadraticCurveTo(bX, bY + bH, bX, bY + bH - r);
  ctx.lineTo(bX, bY + r);
  ctx.quadraticCurveTo(bX, bY, bX + r, bY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isPinned ? '#e8c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isPinned ? 'rgba(255,245,200,0.97)' : 'rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.moveTo(catX - 7, bY + bH);
  ctx.lineTo(catX, bY + bH + 12);
  ctx.lineTo(catX + 7, bY + bH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isPinned ? '#e8c06a' : '#f4a7b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isPinned ? '#8b6200' : '#d94f70';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => {
    ctx.fillText(l, bX + padding, bY + padding + fontSize + i * lineH);
  });
}

// ── Ghost reference for the pixel pattern editor ──────────────

export function drawCatGhost(
  ctx: CanvasRenderingContext2D,
  color: CatColor,
  cellSize: number,
): void {
  const pal = CAT_COLORS[color];
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * cellSize, y * cellSize, w * cellSize, h * cellSize);
  };
  ctx.globalAlpha = 0.3;
  px(4, 1, 8, 6, pal.body);
  px(3, 2, 10, 5, pal.body);
  px(3, 0, 3, 3, pal.body);
  px(10, 0, 3, 3, pal.body);
  px(4, 6, 8, 6, pal.body);
  px(5, 7, 6, 4, pal.belly);
  px(4, 11, 2, 3, pal.body);
  px(10, 11, 2, 3, pal.body);
  px(6, 11, 2, 3, pal.body);
  px(8, 11, 2, 3, pal.body);
  px(10, 9, 2, 4, pal.body);
  ctx.globalAlpha = 1;
}
