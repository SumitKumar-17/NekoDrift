import { drawPikachu } from '../../src/renderer/sprites/pikachu';
import { drawEevee } from '../../src/renderer/sprites/eevee';
import { drawGengar } from '../../src/renderer/sprites/gengar';
import { drawSnorlax } from '../../src/renderer/sprites/snorlax';
import { drawCat } from '../../src/renderer/cat/pixel-cat';
import { drawSpeechBubble, drawPomodoroTimer } from '../../src/renderer/cat/drawing/overlays';
import { drawHearts, drawSteam } from '../../src/renderer/cat/drawing/particles';

const SCALE = 8;          // big so we can see detail
const CELL  = 16 * SCALE + 80;
const FRAME = 40;

interface Tile { label: string; render: (ctx: CanvasRenderingContext2D) => void; }

const cat = (color: string, animation: string, frame: number) =>
  (c: CanvasRenderingContext2D) => drawCat(c, { color: color as any, pattern: 'none', animation: animation as any, frame, scale: SCALE });

const tiles: Tile[] = [
  { label: 'Pikachu', render: (c) => drawPikachu(c, FRAME, SCALE) },
  { label: 'Eevee',   render: (c) => drawEevee(c, FRAME, SCALE) },
  { label: 'Gengar',  render: (c) => drawGengar(c, FRAME, SCALE) },
  { label: 'Snorlax', render: (c) => drawSnorlax(c, FRAME, SCALE) },
  { label: 'Cat idle', render: cat('orange', 'idle', 40) },
  { label: 'Cat happy', render: cat('white', 'happy', 40) },
];
const LIGHT_BG = true;

const cols = 3;
const rows = Math.ceil(tiles.length / cols);
const root = document.getElementById('root') as HTMLCanvasElement;
root.width  = cols * CELL;
root.height = rows * CELL;
const rctx = root.getContext('2d')!;

// background — light so soft ground shadows are visible
for (let y = 0; y < root.height; y += 16) {
  for (let x = 0; x < root.width; x += 16) {
    if (LIGHT_BG) rctx.fillStyle = ((x + y) / 16) % 2 === 0 ? '#dfe2e8' : '#d3d7df';
    else rctx.fillStyle = ((x + y) / 16) % 2 === 0 ? '#3a3a3a' : '#2c2c2c';
    rctx.fillRect(x, y, 16, 16);
  }
}

tiles.forEach((tile, i) => {
  const cx = (i % cols) * CELL;
  const cy = Math.floor(i / cols) * CELL;
  const off = document.createElement('canvas');
  off.width = CELL; off.height = CELL;
  const octx = off.getContext('2d')!;
  octx.save();
  octx.translate(20, 20);
  tile.render(octx);
  octx.restore();
  rctx.drawImage(off, cx, cy);
  rctx.fillStyle = LIGHT_BG ? '#222' : '#fff';
  rctx.font = '16px sans-serif';
  rctx.fillText(tile.label, cx + 8, cy + 22);
});

(window as any).__READY__ = true;
