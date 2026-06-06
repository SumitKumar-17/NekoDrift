import { Menu, Tray, type MenuItemConstructorOptions } from "electron";

import { getAppStateSnapshot } from "./app-state.js";
import { createTrayIcon } from "./assets.js";
import { hideDefaultPet, isDefaultPetVisible, setDefaultPetPaused, showDefaultPet } from "./default-pet-controller.js";
import { dismissAllExtraPets, getExtraPetCount, spawnExtraPet } from "./extra-pets-controller.js";
import { quitNekoDrift } from "./lifecycle.js";
import { info, openLogsFolder } from "./logger.js";
import { shellState, togglePaused } from "./state.js";
import { getUpdateStatus, openUpdateReleasePage } from "./update-checker.js";
import { openControlCenterWindow } from "./windows.js";

let tray: Tray | null = null;

export function createAppTray(): Tray {
  if (tray) {
    return tray;
  }

  tray = new Tray(createTrayIcon());
  tray.setToolTip("NekoDrift");
  refreshTrayMenu();
  info("tray", "created");
  console.log("NekoDrift tray created.");

  return tray;
}

export function refreshTrayMenu(): void {
  if (!tray) {
    return;
  }

  const state = getAppStateSnapshot();
  const defaultPet = state.pets.installed.find((pet) => pet.id === state.preferences.defaultPetId && !pet.broken) ?? state.pets.installed[0];
  const defaultPetName = defaultPet?.displayName ?? "Built-in Pet";

  const menu = Menu.buildFromTemplate([
    {
      label: "NekoDrift",
      enabled: false,
    },
    ...createUpdateMenuItems(),
    { type: "separator" },
    {
      label: `Default Pet: ${defaultPetName}`,
      click: () => openControlCenterWindow("pets"),
    },
    {
      label: isDefaultPetVisible() ? "Hide Default Pet" : "Show Default Pet",
      click: () => {
        if (isDefaultPetVisible()) {
          hideDefaultPet();
        } else {
          showDefaultPet();
        }

        refreshTrayMenu();
      },
    },
    {
      label: shellState.paused ? "Resume All Pets" : "Pause All Pets",
      click: () => {
        const paused = togglePaused();
        setDefaultPetPaused(paused);
        info("tray", "pause toggled", { paused });
        console.log(paused ? "NekoDrift paused." : "NekoDrift resumed.");
        refreshTrayMenu();
      },
    },
    {
      label: "Spawn Another Pet",
      enabled: getExtraPetCount() < 4,
      click: () => { spawnExtraPet(); refreshTrayMenu(); },
    },
    ...(getExtraPetCount() > 0 ? [{
      label: `Dismiss Extra Pets (${getExtraPetCount()})`,
      click: () => { dismissAllExtraPets(); refreshTrayMenu(); },
    } as MenuItemConstructorOptions] : []),
    { type: "separator" as const },
    {
      label: "Manage Pets...",
      click: () => openControlCenterWindow("pets"),
    },
    {
      label: "Control Center...",
      click: () => openControlCenterWindow(),
    },
    {
      label: "Integrations...",
      click: () => openControlCenterWindow("integrations"),
    },
    {
      label: "Plugins...",
      click: () => openControlCenterWindow("plugins"),
    },
    {
      label: "Settings...",
      click: () => openControlCenterWindow("settings"),
    },
    {
      label: "Open Logs Folder...",
      click: () => { void openLogsFolder(); },
    },
    { type: "separator" },
    {
      label: "Quit NekoDrift",
      click: () => quitNekoDrift(),
    },
  ]);

  tray.setContextMenu(menu);
}

function createUpdateMenuItems(): MenuItemConstructorOptions[] {
  const status = getUpdateStatus();
  if (status.state !== "available") return [];
  return [
    {
      label: `Update available: ${status.latestVersion ?? "latest"}...`,
      click: () => { void openUpdateReleasePage(); },
    },
  ];
}
