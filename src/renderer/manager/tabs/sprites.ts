import { SpriteType, SpriteInfo } from '../../../shared/types';
import { drawPikachu } from '../../sprites/pikachu';
import { drawEevee } from '../../sprites/eevee';
import { drawGengar } from '../../sprites/gengar';
import { drawSnorlax } from '../../sprites/snorlax';
import { drawBulbasaur } from '../../sprites/bulbasaur';
import { drawMewtwo } from '../../sprites/mewtwo';
import { drawSquirtle } from '../../sprites/squirtle';
import { drawCharmander } from '../../sprites/charmander';
import { drawJigglypuff } from '../../sprites/jigglypuff';
import { drawPsyduck } from '../../sprites/psyduck';
import { drawMeowth } from '../../sprites/meowth';
import { drawClefairy } from '../../sprites/clefairy';
import { drawMagikarp } from '../../sprites/magikarp';
import { drawAbra } from '../../sprites/abra';
import { drawSlowpoke } from '../../sprites/slowpoke';
import { drawDitto } from '../../sprites/ditto';
import { drawTogepi } from '../../sprites/togepi';
import { drawMew } from '../../sprites/mew';
import { drawVulpix } from '../../sprites/vulpix';
import { drawUmbreon } from '../../sprites/umbreon';
import { drawSylveon } from '../../sprites/sylveon';
import { drawFlareon } from '../../sprites/flareon';

type TypeColor = { label: string; bg: string; text: string };
const TYPE_COLORS: Record<string, TypeColor> = {
  Electric: { label: '⚡ Electric', bg: '#f0c040', text: '#333' },
  Normal:   { label: '⬜ Normal',   bg: '#a8a878', text: '#fff' },
  Ghost:    { label: '👻 Ghost',    bg: '#705898', text: '#fff' },
  Dark:     { label: '🌑 Dark',     bg: '#705848', text: '#fff' },
  Water:    { label: '💧 Water',    bg: '#6890f0', text: '#fff' },
  Fire:     { label: '🔥 Fire',     bg: '#f08030', text: '#fff' },
  Grass:    { label: '🌿 Grass',    bg: '#78c850', text: '#fff' },
  Poison:   { label: '☠️ Poison',   bg: '#a040a0', text: '#fff' },
  Psychic:  { label: '🔮 Psychic',  bg: '#f85888', text: '#fff' },
  Normal2:  { label: '🎵 Normal',   bg: '#a8a878', text: '#fff' },
  Fairy:    { label: '✨ Fairy',    bg: '#ee99ac', text: '#fff' },
};

const SPRITE_META: Record<SpriteType, { name: string; type?: string }> = {
  cat:        { name: 'Cat' },
  pikachu:    { name: 'Pikachu',    type: 'Electric' },
  eevee:      { name: 'Eevee',      type: 'Normal' },
  gengar:     { name: 'Gengar',     type: 'Ghost' },
  snorlax:    { name: 'Snorlax',    type: 'Normal' },
  bulbasaur:  { name: 'Bulbasaur',  type: 'Grass' },
  mewtwo:     { name: 'Mewtwo',     type: 'Psychic' },
  squirtle:   { name: 'Squirtle',   type: 'Water' },
  charmander: { name: 'Charmander', type: 'Fire' },
  jigglypuff: { name: 'Jigglypuff', type: 'Normal' },
  psyduck:    { name: 'Psyduck',    type: 'Water' },
  meowth:     { name: 'Meowth',     type: 'Normal' },
  clefairy:   { name: 'Clefairy',   type: 'Fairy' },
  magikarp:   { name: 'Magikarp',   type: 'Water' },
  abra:       { name: 'Abra',       type: 'Psychic' },
  slowpoke:   { name: 'Slowpoke',   type: 'Water' },
  ditto:      { name: 'Ditto',      type: 'Normal' },
  togepi:     { name: 'Togepi',     type: 'Fairy' },
  mew:        { name: 'Mew',        type: 'Psychic' },
  vulpix:     { name: 'Vulpix',     type: 'Fire' },
  umbreon:    { name: 'Umbreon',    type: 'Dark' },
  sylveon:    { name: 'Sylveon',    type: 'Fairy' },
  flareon:    { name: 'Flareon',    type: 'Fire' },
};

// Draw a sprite into a 52×52 canvas at scale 3 for the add-grid preview
type DrawFn = (ctx: CanvasRenderingContext2D, frame: number, scale: number) => void;
const DRAW: Partial<Record<SpriteType, DrawFn>> = {
  pikachu:   (ctx, f, s) => drawPikachu(ctx, f, s),
  eevee:     (ctx, f, s) => drawEevee(ctx, f, s),
  gengar:    (ctx, f, s) => drawGengar(ctx, f, s),
  snorlax:   (ctx, f, s) => drawSnorlax(ctx, f, s),
  bulbasaur: (ctx, f, s) => drawBulbasaur(ctx, f, s),
  mewtwo:    (ctx, f, s) => drawMewtwo(ctx, f, s),
  squirtle:   (ctx, f, s) => drawSquirtle(ctx, f, s),
  charmander: (ctx, f, s) => drawCharmander(ctx, f, s),
  jigglypuff: (ctx, f, s) => drawJigglypuff(ctx, f, s),
  psyduck:    (ctx, f, s) => drawPsyduck(ctx, f, s),
  meowth:     (ctx, f, s) => drawMeowth(ctx, f, s),
  clefairy:   (ctx, f, s) => drawClefairy(ctx, f, s),
  magikarp:   (ctx, f, s) => drawMagikarp(ctx, f, s),
  abra:       (ctx, f, s) => drawAbra(ctx, f, s),
  slowpoke:   (ctx, f, s) => drawSlowpoke(ctx, f, s),
  ditto:      (ctx, f, s) => drawDitto(ctx, f, s),
  togepi:     (ctx, f, s) => drawTogepi(ctx, f, s),
  mew:        (ctx, f, s) => drawMew(ctx, f, s),
  vulpix:     (ctx, f, s) => drawVulpix(ctx, f, s),
  umbreon:    (ctx, f, s) => drawUmbreon(ctx, f, s),
  sylveon:    (ctx, f, s) => drawSylveon(ctx, f, s),
  flareon:    (ctx, f, s) => drawFlareon(ctx, f, s),
};

const PREVIEW_SCALE = 3;
const PREVIEW_PX = PREVIEW_SCALE * 16 + 8; // 56px

// Shared RAF loop for all animated previews — one loop, many canvases
let previewFrame = 0;
const previewCanvases: Array<{ cv: HTMLCanvasElement; type: SpriteType; scale: number }> = [];

function startPreviewLoop(): void {
  if ((startPreviewLoop as any)._started) return;
  (startPreviewLoop as any)._started = true;

  let last = 0;
  const tick = (ts: number) => {
    if (ts - last >= 50) {  // ~20fps for battery friendliness
      last = ts;
      previewFrame++;
      for (const { cv, type, scale } of previewCanvases) {
        if (!document.body.contains(cv)) continue;
        const ctx = cv.getContext('2d')!;
        const draw = DRAW[type];
        if (!draw) continue;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.translate(4, 4);
        draw(ctx, previewFrame, scale);
        ctx.restore();
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function makePreviewCanvas(type: SpriteType, size = 48): HTMLCanvasElement {
  const scale = Math.round(size / 16);
  const px = scale * 16 + 8;
  const cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  cv.style.width = `${size}px`;
  cv.style.height = `${size}px`;
  cv.style.imageRendering = 'auto';

  const draw = DRAW[type];
  if (draw) {
    const ctx = cv.getContext('2d')!;
    ctx.save();
    ctx.translate(4, 4);
    draw(ctx, previewFrame, scale);
    ctx.restore();
    previewCanvases.push({ cv, type, scale });
    startPreviewLoop();
  } else {
    const ctx = cv.getContext('2d')!;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', px / 2, px / 2);
  }
  return cv;
}

export function initSpritesTab(api: any): void {
  const listEl   = document.getElementById('sprites-list')!;
  const addGrid  = document.getElementById('sprites-add-grid')!;

  // ── Add grid ────────────────────────────────────────────────
  addGrid.innerHTML = '';
  const addTypes: SpriteType[] = ['pikachu', 'eevee', 'gengar', 'snorlax', 'bulbasaur', 'mewtwo', 'squirtle', 'charmander', 'jigglypuff', 'psyduck', 'meowth', 'clefairy', 'magikarp', 'abra', 'slowpoke', 'ditto', 'togepi', 'mew', 'vulpix', 'umbreon', 'sylveon', 'flareon'];
  for (const type of addTypes) {
    const meta = SPRITE_META[type];
    const btn = document.createElement('button');
    btn.className = 'add-sprite-btn';

    const preview = makePreviewCanvas(type);
    const label = document.createElement('span');
    label.textContent = meta.name;

    btn.append(preview, label);

    if (meta.type) {
      const tc = TYPE_COLORS[meta.type];
      if (tc) {
        const badge = document.createElement('span');
        badge.textContent = tc.label;
        badge.style.cssText = `font-size:9px;padding:1px 5px;border-radius:3px;background:${tc.bg};color:${tc.text};font-weight:700;opacity:0.9`;
        btn.appendChild(badge);
      }
    }
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await api.addSprite(type);
      await refresh();
      btn.disabled = false;
    });
    addGrid.appendChild(btn);
  }

  // ── Sprite list ─────────────────────────────────────────────
  async function refresh(): Promise<void> {
    const sprites: SpriteInfo[] = await api.listSprites();
    renderList(sprites);
  }

  function renderList(sprites: SpriteInfo[]): void {
    listEl.innerHTML = '';
    if (!sprites.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌙</div>
          <div>No sprites active — add one below</div>
        </div>`;
      return;
    }

    for (const sprite of sprites) {
      const meta = SPRITE_META[sprite.type] ?? { name: sprite.type };
      const card = document.createElement('div');
      card.className = 'sprite-card';

      const preview = makePreviewCanvas(sprite.type, 36);
      preview.style.flexShrink = '0';

      const typeBadgeHtml = meta.type && TYPE_COLORS[meta.type]
        ? `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${TYPE_COLORS[meta.type].bg};color:${TYPE_COLORS[meta.type].text};font-weight:700;opacity:0.9">${TYPE_COLORS[meta.type].label}</span>`
        : '';

      card.innerHTML = `
        <div class="sprite-card-info">
          <div class="sprite-card-name">${meta.name} ${typeBadgeHtml}</div>
          <div class="sprite-card-id">${sprite.id}</div>
        </div>
        <div class="sprite-card-controls">
          <div class="size-control">
            <span class="size-label">Size</span>
            <input type="range" class="size-slider"
              min="1" max="4" step="1" value="${sprite.size ?? 2}"
              data-id="${sprite.id}" />
            <span class="size-val">${sprite.size ?? 2}×</span>
          </div>
          <button class="btn-remove" data-id="${sprite.id}" title="Remove">✕</button>
        </div>`;

      card.prepend(preview);

      const slider   = card.querySelector<HTMLInputElement>('.size-slider')!;
      const sizeVal  = card.querySelector<HTMLElement>('.size-val')!;

      slider.addEventListener('input', () => {
        sizeVal.textContent = `${slider.value}×`;
      });
      slider.addEventListener('change', () => {
        api.resizeSprite(sprite.id, parseInt(slider.value));
      });

      card.querySelector<HTMLButtonElement>('.btn-remove')!.addEventListener('click', async () => {
        await api.removeSprite(sprite.id);
        await refresh();
      });

      listEl.appendChild(card);
    }
  }

  refresh();
}
