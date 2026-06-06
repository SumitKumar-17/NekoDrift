import { BrowserWindow, screen } from "electron";

import { getAppStateSnapshot } from "./app-state.js";
import { defaultPetWindowSize } from "./display.js";
import { createDefaultPetWindow, loadDefaultPetContent, registerEyeFollowWindow } from "./pet-window.js";
import { info } from "./logger.js";

const MAX_EXTRA_PETS = 4;
const extraPetWindows: BrowserWindow[] = [];

export function spawnExtraPet(): void {
  const alive = extraPetWindows.filter((w) => !w.isDestroyed());
  if (alive.length >= MAX_EXTRA_PETS) return;

  const workArea = screen.getPrimaryDisplay().workArea;
  const margin = 60;
  const x = Math.round(workArea.x + margin + Math.random() * (workArea.width - defaultPetWindowSize.width - margin * 2));
  const y = Math.round(workArea.y + margin + Math.random() * (workArea.height - defaultPetWindowSize.height - margin * 2));
  const position = { x, y };

  const prefs = getAppStateSnapshot().preferences;

  const window = createDefaultPetWindow({
    position,
    paused: false,
    display: null,
    badge: null,
    onPositionChanged: () => void 0,
    onHideRequested: () => { window.destroy(); },
    onBubbleDismissed: undefined,
  });

  registerEyeFollowWindow(window);

  window.on("closed", () => {
    const idx = extraPetWindows.indexOf(window);
    if (idx !== -1) extraPetWindows.splice(idx, 1);
    info("pet.extra", "closed", {});
  });

  extraPetWindows.push(window);
  info("pet.extra", "spawned", { position, total: extraPetWindows.filter((w) => !w.isDestroyed()).length });

  void loadDefaultPetContent(window, false);

  if (prefs.userName) {
    setTimeout(() => {
      if (!window.isDestroyed()) {
        void loadDefaultPetContent(window, false, { message: `Hi${prefs.userName ? ` ${prefs.userName}` : ""}! 👋` });
        setTimeout(() => { if (!window.isDestroyed()) void loadDefaultPetContent(window, false); }, 3000);
      }
    }, 600);
  }
}

export function getExtraPetCount(): number {
  return extraPetWindows.filter((w) => !w.isDestroyed()).length;
}

export function dismissAllExtraPets(): void {
  for (const w of extraPetWindows) {
    if (!w.isDestroyed()) w.destroy();
  }
  extraPetWindows.length = 0;
}
