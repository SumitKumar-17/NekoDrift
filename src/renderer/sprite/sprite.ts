import { SpriteType } from '../../shared/types';
import { drawPikachu } from '../sprites/pikachu';
import { drawEevee } from '../sprites/eevee';
import { drawGengar } from '../sprites/gengar';
import { drawSnorlax } from '../sprites/snorlax';

declare const window: Window & {
  nekodrift: {
    onEyeDir: (cb: (dir: { dx: number; dy: number }) => void) => void;
    onSpriteEyeDir: (cb: (id: string, dir: { dx: number; dy: number }) => void) => void;
    onIdleChanged: (cb: (isIdle: boolean) => void) => void;
  };
};
const canvas = document.getElementById('sprite-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Config state
let spriteType: SpriteType = 'pikachu';
let scale = 4;  // 4px per unit → 64px default
let eyeDir = { dx: 0, dy: 0 };
let frame = 0;
let isIdle = false;

function resize() {
  const size = scale * 16 + 80; // 16 units + padding
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Translate to center sprite in canvas
  const pad = 40;
  ctx.save();
  ctx.translate(pad / 2, pad / 2);
  switch (spriteType) {
    case 'pikachu': drawPikachu(ctx, frame, scale, eyeDir); break;
    case 'eevee':   drawEevee(ctx, frame, scale, eyeDir); break;
    case 'gengar':  drawGengar(ctx, frame, scale, eyeDir); break;
    case 'snorlax': drawSnorlax(ctx, frame, scale); break;
  }
  ctx.restore();
}

function tick() {
  frame += isIdle ? 0.35 : 1;
  draw();
  requestAnimationFrame(tick);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('type') as SpriteType | null;
  const s = params.get('scale');
  if (t) spriteType = t;
  if (s) scale = parseInt(s, 10) || 4;

  resize();
  tick();

  window.nekodrift.onEyeDir((dir) => {
    if (dir) eyeDir = dir;
  });

  const myId = params.get('id');
  window.nekodrift.onSpriteEyeDir((id, dir) => {
    if (id === myId && dir) eyeDir = dir;
  });

  window.nekodrift.onIdleChanged((idle) => { isIdle = idle; });
}

init();
