import { CatSettings } from '../../../shared/types';

const MOOD_EMOJI: Record<string, string> = {
  happy: '😸 Happy', content: '😺 Content', tired: '😿 Tired', lonely: '🙀 Lonely',
};

async function refreshStats(api: any): Promise<void> {
  const stats = await api.getCatStats();
  if (!stats) return;

  const el = (id: string) => document.getElementById(id);
  el('stat-mood')!.textContent     = MOOD_EMOJI[stats.mood as string] ?? stats.mood as string;
  el('stat-session')!.textContent  = `${stats.sessionMin}m`;
  el('stat-pets')!.textContent     = String(stats.petCount);
  el('stat-typing')!.textContent   = String(stats.typingBursts);
  el('stat-overheat')!.textContent = String(stats.overheats);
  el('stat-lastpet')!.textContent  = stats.lastPetMin === -1
    ? 'never'
    : `${stats.lastPetMin}m ago`;
  const lifetimeEl = el('stat-lifetime-pets');
  if (lifetimeEl) lifetimeEl.textContent = String(stats.lifetimePets ?? 0);
  const keysEl = el('stat-keys-today');
  if (keysEl) keysEl.textContent = (stats.keysToday ?? 0).toLocaleString();
  const ageEl = el('stat-cat-age');
  if (ageEl) {
    const days = stats.catAgeDays ?? 0;
    ageEl.textContent = days === 0 ? 'born today!' : days === 1 ? '1 day' : `${days} days`;
  }
  const hungerEl = el('stat-hunger');
  if (hungerEl) {
    const hungerEmoji: Record<string, string> = { full: '😋 Full', hungry: '😮‍💨 Hungry', starving: '😿 Starving' };
    hungerEl.textContent = hungerEmoji[stats.hunger as string] ?? (stats.hunger as string) ?? '—';
  }
  const feedCountEl = el('stat-feed-count');
  if (feedCountEl) feedCountEl.textContent = String(stats.feedCount ?? 0);

  // Draw mood sparkline
  const canvas = el('mood-sparkline') as HTMLCanvasElement | null;
  if (canvas && stats.moodHistory?.length) {
    const history: { hour: number; mood: string }[] = stats.moodHistory;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const MOOD_VAL: Record<string, number> = { happy: 4, content: 3, tired: 2, lonely: 1 };
    const MOOD_COLOR: Record<string, string> = {
      happy: '#4CAF50', content: '#66BB6A', tired: '#FF9800', lonely: '#EF5350',
    };
    const px = (i: number) => (i / (history.length - 1 || 1)) * (w - 4) + 2;
    const py = (mood: string) => h - ((MOOD_VAL[mood] ?? 2) / 4) * (h - 6) - 2;

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
    grad.addColorStop(1, 'rgba(76, 175, 80, 0)');
    ctx.beginPath();
    ctx.moveTo(px(0), py(history[0].mood));
    for (let i = 1; i < history.length; i++) ctx.lineTo(px(i), py(history[i].mood));
    ctx.lineTo(px(history.length - 1), h);
    ctx.lineTo(px(0), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Polyline
    ctx.beginPath();
    ctx.moveTo(px(0), py(history[0].mood));
    for (let i = 1; i < history.length; i++) ctx.lineTo(px(i), py(history[i].mood));
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots colored by mood
    for (let i = 0; i < history.length; i++) {
      ctx.beginPath();
      ctx.arc(px(i), py(history[i].mood), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = MOOD_COLOR[history[i].mood] ?? '#aaa';
      ctx.fill();
    }
  }
}

export function initSystemTab(api: any, settings: CatSettings): void {
  const ontopToggle      = document.getElementById('toggle-ontop') as HTMLInputElement;
  const loginToggle      = document.getElementById('toggle-login') as HTMLInputElement;
  const dndToggle          = document.getElementById('toggle-dnd') as HTMLInputElement;
  const dndScheduleToggle  = document.getElementById('toggle-dnd-schedule') as HTMLInputElement;
  const dndHoursRow        = document.getElementById('dnd-hours-row') as HTMLElement;
  const dndStartHour       = document.getElementById('dnd-start-hour') as HTMLInputElement;
  const dndEndHour         = document.getElementById('dnd-end-hour') as HTMLInputElement;
  const allDesktopToggle   = document.getElementById('toggle-all-desktops') as HTMLInputElement;
  const soundToggle        = document.getElementById('sys-toggle-sound') as HTMLInputElement;
  const volumeRange        = document.getElementById('sys-range-volume') as HTMLInputElement;
  const volumeLabel        = document.getElementById('sys-volume-label') as HTMLElement;

  ontopToggle.checked          = settings.alwaysOnTop;
  loginToggle.checked          = settings.startOnLogin;
  dndToggle.checked            = settings.dndEnabled;
  dndScheduleToggle.checked    = settings.dndScheduleEnabled ?? false;
  dndStartHour.value           = String(settings.dndStartHour ?? 22);
  dndEndHour.value             = String(settings.dndEndHour ?? 8);
  dndHoursRow.style.display    = dndScheduleToggle.checked ? '' : 'none';
  allDesktopToggle.checked     = settings.showOnAllDesktops ?? true;

  dndScheduleToggle.addEventListener('change', () => {
    dndHoursRow.style.display = dndScheduleToggle.checked ? '' : 'none';
  });
  soundToggle.checked      = settings.soundEnabled;
  volumeRange.value        = String(settings.soundVolume ?? 70);
  volumeLabel.textContent  = `${settings.soundVolume ?? 70}%`;

  volumeRange.addEventListener('input', () => {
    volumeLabel.textContent = `${volumeRange.value}%`;
  });

  // Quick-action buttons
  document.querySelectorAll<HTMLButtonElement>('.cat-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action!;
      api.catRemoteAction(action);
      btn.style.borderColor = 'var(--accent)';
      setTimeout(() => btn.style.borderColor = '', 600);
    });
  });

  document.getElementById('btn-refresh-stats')!.addEventListener('click', () => refreshStats(api));
  refreshStats(api);
  setInterval(() => refreshStats(api), 30_000);

  document.getElementById('btn-open-settings')!.addEventListener('click', () => {
    api.openSettings();
  });

  document.getElementById('btn-save-system')!.addEventListener('click', async () => {
    await api.saveSettings({
      alwaysOnTop:          ontopToggle.checked,
      startOnLogin:         loginToggle.checked,
      dndEnabled:           dndToggle.checked,
      dndScheduleEnabled:   dndScheduleToggle.checked,
      dndStartHour:         parseInt(dndStartHour.value) || 22,
      dndEndHour:           parseInt(dndEndHour.value) || 8,
      showOnAllDesktops:    allDesktopToggle.checked,
      soundEnabled:         soundToggle.checked,
      soundVolume:          Number(volumeRange.value),
    });
    showSaveToast('System settings saved');
  });

  // ── Export / Import ──────────────────────────────────────────
  document.getElementById('btn-export-settings')?.addEventListener('click', async () => {
    const s = await api.getSettings();
    const json = JSON.stringify(s, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'nekodrift-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    showSaveToast('Settings exported!');
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.saveSettings(parsed);
      showSaveToast('Settings imported!');
      setTimeout(() => location.reload(), 1200);
    } catch {
      showSaveToast('Import failed — invalid file');
    }
  });
}

function showSaveToast(msg: string): void {
  const toast = document.getElementById('save-toast')!;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
