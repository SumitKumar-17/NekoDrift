import { CatSettings, CatColor } from '../../shared/types';

declare global {
  interface Window {
    nekodrift: {
      getSettings: () => Promise<CatSettings>;
      saveSettings: (s: Partial<CatSettings>) => Promise<CatSettings>;
      dismissStretch: () => void;
      snoozeStretch: (min: number) => void;
      openSettings: () => void;
      quit: () => void;
      onboardingDone: (s: Partial<CatSettings>) => void;
      onCatSettings: (cb: (s: CatSettings) => void) => void;
      onCatSpeech: (cb: (msg: string | null) => void) => void;
      onStretchReminder: (cb: (msg: string) => void) => void;
      onIdleChanged: (cb: (isIdle: boolean) => void) => void;
      onTypingChanged: (cb: (isTyping: boolean) => void) => void;
    };
  }
}

const SIZE_LABELS: Record<number, string> = {
  1: 'Small (1×)',
  2: 'Medium (2×)',
  3: 'Large (3×)',
};

let currentColor: CatColor = 'orange';

async function init() {
  const settings = await window.nekodrift.getSettings();

  // Populate fields
  (document.getElementById('input-name') as HTMLInputElement).value = settings.name;
  (document.getElementById('input-cat-name') as HTMLInputElement).value = settings.catName;
  (document.getElementById('input-interval') as HTMLInputElement).value = String(settings.stretchIntervalMin);
  (document.getElementById('toggle-stretch') as HTMLInputElement).checked = settings.stretchEnabled;
  (document.getElementById('toggle-ontop') as HTMLInputElement).checked = settings.alwaysOnTop;
  (document.getElementById('toggle-login') as HTMLInputElement).checked = settings.startOnLogin;
  (document.getElementById('toggle-sound') as HTMLInputElement).checked = settings.soundEnabled;
  (document.getElementById('input-size') as HTMLInputElement).value = String(settings.size);
  (document.getElementById('size-label') as HTMLElement).textContent = SIZE_LABELS[settings.size];

  currentColor = settings.color;
  updateSwatches();

  // Swatch click
  document.querySelectorAll('.swatch').forEach((el) => {
    el.addEventListener('click', () => {
      currentColor = (el as HTMLElement).dataset.color as CatColor;
      updateSwatches();
    });
  });

  // Size slider
  const sizeInput = document.getElementById('input-size') as HTMLInputElement;
  sizeInput.addEventListener('input', () => {
    (document.getElementById('size-label') as HTMLElement).textContent =
      SIZE_LABELS[Number(sizeInput.value)];
  });

  // Save
  document.getElementById('btn-save')!.addEventListener('click', async () => {
    const updated: Partial<CatSettings> = {
      name: (document.getElementById('input-name') as HTMLInputElement).value.trim() || 'hooman',
      catName: (document.getElementById('input-cat-name') as HTMLInputElement).value.trim() || 'NekoDrift',
      stretchIntervalMin: Number((document.getElementById('input-interval') as HTMLInputElement).value),
      stretchEnabled: (document.getElementById('toggle-stretch') as HTMLInputElement).checked,
      alwaysOnTop: (document.getElementById('toggle-ontop') as HTMLInputElement).checked,
      startOnLogin: (document.getElementById('toggle-login') as HTMLInputElement).checked,
      soundEnabled: (document.getElementById('toggle-sound') as HTMLInputElement).checked,
      size: Number((document.getElementById('input-size') as HTMLInputElement).value),
      color: currentColor,
    };

    await window.nekodrift.saveSettings(updated);

    const msg = document.getElementById('saved-msg')!;
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2500);
  });
}

function updateSwatches() {
  document.querySelectorAll('.swatch').forEach((el) => {
    const isActive = (el as HTMLElement).dataset.color === currentColor;
    el.classList.toggle('active', isActive);
  });
}

init();
