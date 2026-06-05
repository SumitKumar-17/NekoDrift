import { IPC, SpriteType, SpriteInfo } from '../../shared/types';

declare const window: Window & {
  nekoDrift: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    on(channel: string, fn: (...args: unknown[]) => void): void;
  };
};

const api = window.nekoDrift;

const SPRITE_META: Record<SpriteType, { emoji: string; name: string }> = {
  cat:     { emoji: '🐱', name: 'Cat' },
  pikachu: { emoji: '⚡', name: 'Pikachu' },
  eevee:   { emoji: '🦊', name: 'Eevee' },
  gengar:  { emoji: '👻', name: 'Gengar' },
  snorlax: { emoji: '😴', name: 'Snorlax' },
};

const listEl = document.getElementById('sprite-list')!;
const addGrid = document.getElementById('add-grid')!;

function renderList(sprites: SpriteInfo[]) {
  listEl.innerHTML = '';
  if (sprites.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="big">🌙</div>
        No sprites active.<br>Add one below!
      </div>`;
    return;
  }

  for (const sprite of sprites) {
    const meta = SPRITE_META[sprite.type] ?? { emoji: '?', name: sprite.type };
    const card = document.createElement('div');
    card.className = 'sprite-card';
    card.innerHTML = `
      <div class="sprite-emoji">${meta.emoji}</div>
      <div class="sprite-info">
        <div class="sprite-name">${meta.name}</div>
        <div class="sprite-id">${sprite.id}</div>
      </div>
      <div class="sprite-actions">
        <button class="btn btn-remove" data-id="${sprite.id}">Remove</button>
      </div>`;
    card.querySelector('.btn-remove')!.addEventListener('click', async () => {
      await api.invoke(IPC.SPRITE_REMOVE, sprite.id);
      await refresh();
    });
    listEl.appendChild(card);
  }
}

async function refresh() {
  const sprites = await api.invoke(IPC.SPRITE_LIST) as SpriteInfo[];
  renderList(sprites);
}

function buildAddGrid() {
  addGrid.innerHTML = '';
  for (const [type, meta] of Object.entries(SPRITE_META) as [SpriteType, { emoji: string; name: string }][]) {
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.innerHTML = `<span class="em">${meta.emoji}</span> ${meta.name}`;
    btn.addEventListener('click', async () => {
      await api.invoke(IPC.SPRITE_ADD, type);
      await refresh();
    });
    addGrid.appendChild(btn);
  }
}

async function init() {
  buildAddGrid();
  await refresh();
}

init();
