import Store from 'electron-store';
import { CatSettings, SpriteType } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

export interface SavedSpriteState {
  type: SpriteType;
  x: number;
  y: number;
  size: number;
}

interface StoreSchema {
  settings: CatSettings;
  firstRun: boolean;
  sprites: SavedSpriteState[];
  lifetimePets: number;
  catBirthday: string; // ISO date string
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    firstRun: true,
    sprites: [],
    lifetimePets: 0,
    catBirthday: new Date().toISOString(),
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

export function saveSprites(sprites: SavedSpriteState[]): void {
  store.set('sprites', sprites);
}

export function loadSprites(): SavedSpriteState[] {
  return (store.get('sprites') as SavedSpriteState[]) ?? [];
}

export function getLifetimePets(): number {
  return (store.get('lifetimePets') as number) ?? 0;
}

export function incrementLifetimePets(n = 1): number {
  const v = getLifetimePets() + n;
  store.set('lifetimePets', v);
  return v;
}

export function getCatBirthday(): string {
  return (store.get('catBirthday') as string) || new Date().toISOString();
}

export function getCatAgeDays(): number {
  const birthday = new Date(getCatBirthday());
  const now = new Date();
  return Math.floor((now.getTime() - birthday.getTime()) / (1000 * 60 * 60 * 24));
}
