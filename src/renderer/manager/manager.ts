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

  const nameEl = document.getElementById('sidebar-cat-name');
  if (nameEl && settings.catName) nameEl.textContent = settings.catName;

  initSpritesTab(api);
  initTimersTab(api, settings);
  initNotesTab(api, settings);
  initClaudeTab(api, settings);
  initSystemTab(api, settings);
}

init();

// ── Keyboard shortcuts ────────────────────────────────────────
const TAB_KEYS: Record<string, string> = {
  '1': 'sprites', '2': 'timers', '3': 'notes', '4': 'claude', '5': 'system',
};

// ── Konami Code easter egg ────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;
document.addEventListener('keydown', (e) => {
  // Tab shortcuts (only when not typing in an input/textarea)
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
  if (!isTyping && TAB_KEYS[e.key]) {
    showTab(TAB_KEYS[e.key]);
    return;
  }

  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      api.catRemoteAction?.('pet');
      setTimeout(() => api.catRemoteAction?.('jump'), 400);
      setTimeout(() => api.catRemoteAction?.('surprise'), 900);
      // Flash the whole panel briefly
      document.body.style.transition = 'background 0.2s';
      document.body.style.background = '#FFD700';
      setTimeout(() => { document.body.style.background = ''; }, 500);
      const toast = document.getElementById('save-toast');
      if (toast) {
        toast.textContent = '🎉 Party mode!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
      }
    }
  } else {
    konamiIdx = e.key === KONAMI[0] ? 1 : 0;
  }
});
