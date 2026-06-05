import Store from 'electron-store';
import { CatSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

const store = new Store<{ settings: CatSettings; firstRun: boolean }>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    firstRun: true,
  },
});

export function getSettings(): CatSettings {
  // Merge with defaults so new fields are always populated
  return { ...DEFAULT_SETTINGS, ...store.get('settings') };
}

export function saveSettings(settings: Partial<CatSettings>): CatSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  store.set('settings', updated);
  return updated;
}

export function isFirstRun(): boolean {
  return store.get('firstRun');
}

export function setFirstRunDone(): void {
  store.set('firstRun', false);
}
