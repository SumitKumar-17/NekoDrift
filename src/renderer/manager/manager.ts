import { CatSettings } from '../../shared/types';
import { initSpritesTab } from './tabs/sprites';
import { initTimersTab }  from './tabs/timers';
import { initNotesTab }   from './tabs/notes';
import { initClaudeTab }  from './tabs/claude';
import { initSystemTab }  from './tabs/system';

const api = (window as any).nekodrift;

// ── Tab routing ───────────────────────────────────────────────
const navItems = document.querySelectorAll<HTMLElement>('[data-tab]');
const pages    = document.querySelectorAll<HTMLElement>('.page');

function showTab(id: string): void {
  navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === id));
  pages.forEach(p => p.classList.toggle('active', p.id === `page-${id}`));
}

navItems.forEach(item => {
  item.addEventListener('click', () => showTab(item.dataset.tab!));
});

// ── Boot ──────────────────────────────────────────────────────
async function init(): Promise<void> {
  const settings: CatSettings = await api.getSettings();

  initSpritesTab(api);
  initTimersTab(api, settings);
  initNotesTab(api, settings);
  initClaudeTab(api, settings);
  initSystemTab(api, settings);
}

init();
