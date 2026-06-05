import { IPC, SpriteType } from '../../shared/types';
import { drawPikachu } from '../sprites/pikachu';
import { drawEevee } from '../sprites/eevee';
import { drawGengar } from '../sprites/gengar';
import { drawSnorlax } from '../sprites/snorlax';

declare const window: Window & {
  nekoDrift: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    on(channel: string, fn: (...args: unknown[]) => void): void;
  };
};

const api = window.nekoDrift;
const canvas = document.getElementById('sprite-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Config state
let spriteType: SpriteType = 'pikachu';
let scale = 4;  // 4px per unit → 64px default
let eyeDir = { dx: 0, dy: 0 };
let frame = 0;
let animId = 0;

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

  // Per-pixel hit test: pass-through transparent areas
  const hit = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const allTransparent = hit.data.every((_, i) => i % 4 !== 3 || hit.data[i] < 25);
  api.invoke(IPC.SET_IGNORE_MOUSE, allTransparent);
}

function tick() {
  frame++;
  draw();
  animId = requestAnimationFrame(tick);
}

async function init() {
  // Receive config from main process via URL search params (spriteId is in query)
  const params = new URLSearchParams(window.location.search);
  const t = params.get('type') as SpriteType | null;
  const s = params.get('scale');
  if (t) spriteType = t;
  if (s) scale = parseInt(s, 10) || 4;

  resize();
  tick();

  // Eye direction updates
  api.on(IPC.EYE_DIR, (...args) => {
    const dir = args[0] as { dx: number; dy: number } | null;
    if (dir) eyeDir = dir;
  });

  // Sprite-specific eye dir (keyed by sprite id)
  api.on(IPC.SPRITE_EYE_DIR, (...args) => {
    const [id, dir] = args as [string, { dx: number; dy: number }];
    const myId = params.get('id');
    if (id === myId && dir) eyeDir = dir;
  });
}

init();
