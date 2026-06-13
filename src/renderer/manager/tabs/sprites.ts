import { SpriteType, SpriteInfo } from '../../../shared/types';

const SPRITE_META: Record<SpriteType, { emoji: string; name: string }> = {
  cat:     { emoji: '🐱', name: 'Cat' },
  pikachu: { emoji: '⚡', name: 'Pikachu' },
  eevee:   { emoji: '🦊', name: 'Eevee' },
  gengar:  { emoji: '👻', name: 'Gengar' },
  snorlax: { emoji: '😴', name: 'Snorlax' },
};

export function initSpritesTab(api: any): void {
  const listEl   = document.getElementById('sprites-list')!;
  const addGrid  = document.getElementById('sprites-add-grid')!;

  // ── Add grid ────────────────────────────────────────────────
  addGrid.innerHTML = '';
  for (const [type, meta] of Object.entries(SPRITE_META) as [SpriteType, typeof SPRITE_META[SpriteType]][]) {
    if (type === 'cat') continue;
    const btn = document.createElement('button');
    btn.className = 'add-sprite-btn';
    btn.innerHTML = `<span class="add-sprite-emoji">${meta.emoji}</span><span>${meta.name}</span>`;
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
      const meta = SPRITE_META[sprite.type] ?? { emoji: '?', name: sprite.type };
      const card = document.createElement('div');
      card.className = 'sprite-card';
      card.innerHTML = `
        <div class="sprite-card-icon">${meta.emoji}</div>
        <div class="sprite-card-info">
          <div class="sprite-card-name">${meta.name}</div>
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
