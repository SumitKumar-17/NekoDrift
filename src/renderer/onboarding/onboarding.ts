import { CatColor, CatSettings } from '../../shared/types';
import { drawCat } from '../cat/pixel-cat';

declare global {
  interface Window {
    nekodrift: {
      getSettings: () => Promise<CatSettings>;
      saveSettings: (s: Partial<CatSettings>) => Promise<CatSettings>;
      onboardingDone: (s: Partial<CatSettings>) => void;
      dismissStretch: () => void;
      snoozeStretch: (min: number) => void;
      openSettings: () => void;
      quit: () => void;
      onCatSettings: (cb: (s: CatSettings) => void) => void;
      onCatSpeech: (cb: (msg: string | null) => void) => void;
      onStretchReminder: (cb: (msg: string) => void) => void;
      onIdleChanged: (cb: (isIdle: boolean) => void) => void;
      onTypingChanged: (cb: (isTyping: boolean) => void) => void;
    };
  }
}

let selectedColor: CatColor = 'orange';
let userName = '';
let frame = 0;

const canvas = document.getElementById('cat-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Animate the preview cat
function renderPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(32, 16);
  drawCat(ctx, { color: selectedColor, animation: 'happy', frame, scale: 4 });
  ctx.restore();
  frame++;
  requestAnimationFrame(renderPreview);
}
renderPreview();

// Step navigation
let currentStep = 1;

function goToStep(n: number) {
  document.getElementById(`step-${currentStep}`)?.classList.remove('active');
  document.getElementById(`dot-${currentStep}`)?.classList.remove('active');
  currentStep = n;
  document.getElementById(`step-${currentStep}`)?.classList.add('active');
  document.getElementById(`dot-${currentStep}`)?.classList.add('active');
}

// Step 1
document.getElementById('btn-next-1')!.addEventListener('click', () => {
  userName = (document.getElementById('input-name') as HTMLInputElement).value.trim() || 'hooman';
  goToStep(2);
});

// Step 2 — color swatches
document.querySelectorAll('.swatch').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
    el.classList.add('active');
    selectedColor = (el as HTMLElement).dataset.color as CatColor;
  });
});

document.getElementById('btn-next-2')!.addEventListener('click', () => {
  const nameEl = document.getElementById('user-name-display');
  if (nameEl) nameEl.textContent = userName;
  goToStep(3);
});

// Step 3 — done
document.getElementById('btn-start')!.addEventListener('click', () => {
  window.nekodrift.onboardingDone({
    name: userName,
    color: selectedColor,
    catName: 'NekoDrift',
    stretchIntervalMin: 30,
    stretchEnabled: true,
    soundEnabled: false,
    size: 2,
    alwaysOnTop: true,
    showOnAllDesktops: true,
    startOnLogin: false,
  });
});
