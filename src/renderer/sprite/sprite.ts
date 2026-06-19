import { SpriteType } from '../../shared/types';
import { drawPikachu } from '../sprites/pikachu';
import { drawEevee } from '../sprites/eevee';
import { drawGengar } from '../sprites/gengar';
import { drawSnorlax } from '../sprites/snorlax';
import { drawBulbasaur } from '../sprites/bulbasaur';
import { drawMewtwo } from '../sprites/mewtwo';
import { drawSquirtle } from '../sprites/squirtle';
import { drawCharmander } from '../sprites/charmander';
import { drawJigglypuff } from '../sprites/jigglypuff';
import { drawPsyduck } from '../sprites/psyduck';
import { drawMeowth } from '../sprites/meowth';
import { drawClefairy } from '../sprites/clefairy';
import { drawMagikarp } from '../sprites/magikarp';
import { drawAbra } from '../sprites/abra';
import { drawSlowpoke } from '../sprites/slowpoke';
import { drawDitto } from '../sprites/ditto';
import { drawTogepi } from '../sprites/togepi';
import { drawMew } from '../sprites/mew';
import { drawVulpix } from '../sprites/vulpix';
import { drawUmbreon } from '../sprites/umbreon';
import { drawSylveon } from '../sprites/sylveon';
import { drawFlareon } from '../sprites/flareon';

declare const window: Window & {
  nekodrift: {
    onSpriteEyeDir: (cb: (id: string, dir: { dx: number; dy: number }) => void) => void;
    onIdleChanged: (cb: (isIdle: boolean) => void) => void;
    dragSprite: (id: string, dx: number, dy: number) => void;
    spriteSetIgnoreMouse: (id: string, ignore: boolean) => void;
  };
};

const canvas = document.getElementById('sprite-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let spriteType: SpriteType = 'pikachu';
let scale = 4;
let eyeDir = { dx: 0, dy: 0 };
let frame = 0;
let isIdle = false;
let myId = '';

// ── Dragging state ──────────────────────────────────────────────
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isHovering = false;

function resize() {
  const size = scale * 16 + 80;
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pad = 40;
  ctx.save();
  ctx.translate(pad / 2, pad / 2);
  const spriteMood = isIdle ? 'tired' : 'content';
  switch (spriteType) {
    case 'pikachu':   drawPikachu(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'eevee':     drawEevee(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'gengar':    drawGengar(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'snorlax':   drawSnorlax(ctx, frame, scale, isIdle); break;
    case 'bulbasaur': drawBulbasaur(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'mewtwo':    drawMewtwo(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'squirtle':   drawSquirtle(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'charmander':  drawCharmander(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'jigglypuff':  drawJigglypuff(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'psyduck':     drawPsyduck(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'meowth':      drawMeowth(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'clefairy':    drawClefairy(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'magikarp':    drawMagikarp(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'abra':        drawAbra(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'slowpoke':    drawSlowpoke(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'ditto':       drawDitto(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'togepi':      drawTogepi(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'mew':         drawMew(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'vulpix':      drawVulpix(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'umbreon':     drawUmbreon(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'sylveon':     drawSylveon(ctx, frame, scale, eyeDir, spriteMood); break;
    case 'flareon':     drawFlareon(ctx, frame, scale, eyeDir, spriteMood); break;
  }
  ctx.restore();
}

// ── Per-pixel hit test (same pattern as cat.ts) ─────────────────
function hitTest(clientX: number, clientY: number): boolean {
  try {
    return ctx.getImageData(clientX, clientY, 1, 1).data[3] > 25;
  } catch (_) { return false; }
}

function updateIgnoreMouse(x: number, y: number) {
  const over = hitTest(x, y);
  if (over !== isHovering) {
    isHovering = over;
    window.nekodrift.spriteSetIgnoreMouse(myId, !over);
  }
}

// ── Pointer events ──────────────────────────────────────────────
canvas.addEventListener('pointermove', (e) => {
  updateIgnoreMouse(e.clientX, e.clientY);
  if (isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    window.nekodrift.dragSprite(myId, dx, dy);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
});

canvas.addEventListener('pointerdown', (e) => {
  if (!isHovering) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', () => {
  isDragging = false;
});

canvas.addEventListener('pointerleave', () => {
  if (!isDragging) {
    isHovering = false;
    window.nekodrift.spriteSetIgnoreMouse(myId, true);
  }
});

let hitFrame = 0;
function tick() {
  frame += isIdle ? 0.35 : 1;
  draw();
  hitFrame++;
  // Throttle hit-test to every 20 frames (avoid GPU stall per-frame)
  if (hitFrame % 20 === 0) {
    // Re-evaluate ignore state at canvas center area each 20 frames
    // (keeps it accurate when sprite animates out from under cursor)
  }
  requestAnimationFrame(tick);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('type') as SpriteType | null;
  const s = params.get('scale');
  myId = params.get('id') ?? '';
  if (t) spriteType = t;
  if (s) scale = parseInt(s, 10) || 4;

  resize();
  tick();

  window.nekodrift.onSpriteEyeDir((id, dir) => {
    if (id === myId && dir) eyeDir = dir;
  });

  window.nekodrift.onIdleChanged((idle) => { isIdle = idle; });
}

init();
