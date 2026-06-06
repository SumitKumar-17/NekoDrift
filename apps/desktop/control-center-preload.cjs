const { contextBridge, ipcRenderer } = require("electron");

const api = {
  getPetsState: () => ipcRenderer.invoke("nekodrift:get-pets-state"),
  getDashboardSnapshot: () => ipcRenderer.invoke("nekodrift:get-dashboard-snapshot"),
  getSettingsState: () => ipcRenderer.invoke("nekodrift:get-settings-state"),
  updatePreferences: (patch) => ipcRenderer.invoke("nekodrift:update-preferences", patch),
  getReactionAnimationSettings: () => ipcRenderer.invoke("nekodrift:get-reaction-animation-settings"),
  getLaunchAtLogin: () => ipcRenderer.invoke("nekodrift:get-launch-at-login"),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke("nekodrift:set-launch-at-login", enabled),
  getUpdateStatus: () => ipcRenderer.invoke("nekodrift:get-update-status"),
  checkForUpdates: () => ipcRenderer.invoke("nekodrift:check-for-updates"),
  openUpdateReleasePage: () => ipcRenderer.invoke("nekodrift:open-update-release-page"),
  resetDefaultPetPosition: () => ipcRenderer.invoke("nekodrift:reset-default-pet-position"),
  getPluginsSnapshot: () => ipcRenderer.invoke("nekodrift:plugins-snapshot"),
  getPluginCatalogSnapshot: (refresh) => ipcRenderer.invoke("nekodrift:plugins-catalog-snapshot", refresh),
  setPluginEnabled: (id, enabled) => ipcRenderer.invoke("nekodrift:plugins-set-enabled", id, enabled),
  savePluginConfig: (id, config) => ipcRenderer.invoke("nekodrift:plugins-save-config", id, config),
  reloadPlugin: (id) => ipcRenderer.invoke("nekodrift:plugins-reload", id),
  executePluginCommand: (id, commandId) => ipcRenderer.invoke("nekodrift:plugins-execute-command", id, commandId),
  loadLocalPlugin: () => ipcRenderer.invoke("nekodrift:plugins-load-local"),
  installCatalogPlugin: (id) => ipcRenderer.invoke("nekodrift:plugins-install-catalog", id),
  updateCatalogPlugin: (id) => ipcRenderer.invoke("nekodrift:plugins-update-catalog", id),
  uninstallPlugin: (id) => ipcRenderer.invoke("nekodrift:plugins-uninstall", id),
  getCatalog: () => ipcRenderer.invoke("nekodrift:get-catalog"),
  getCatalogPage: (page) => ipcRenderer.invoke("nekodrift:get-catalog-page", page),
  getCatalogSearch: () => ipcRenderer.invoke("nekodrift:get-catalog-search"),
  getCodexPets: () => ipcRenderer.invoke("nekodrift:get-codex-pets"),
  setDefaultPet: (petId) => ipcRenderer.invoke("nekodrift:set-default-pet", petId),
  installPet: (petId) => ipcRenderer.invoke("nekodrift:install-pet", petId),
  installLocalPet: () => ipcRenderer.invoke("nekodrift:install-local-pet"),
  importCodexPet: (petId) => ipcRenderer.invoke("nekodrift:import-codex-pet", petId),
  openGallery: () => ipcRenderer.invoke("nekodrift:open-gallery"),
  removePet: (petId) => ipcRenderer.invoke("nekodrift:remove-pet", petId),
  onRouteChange: (callback) => {
    const listener = (_event, route) => callback(route);
    ipcRenderer.on("nekodrift:control-center-route", listener);
    return () => ipcRenderer.removeListener("nekodrift:control-center-route", listener);
  },
  getIntegrationsState: (selectedPetId, commandMode) => ipcRenderer.invoke("nekodrift:agent-setup-snapshot", selectedPetId, commandMode),
  runIntegrationAction: (action, selectedPetId, commandMode) => ipcRenderer.invoke("nekodrift:agent-setup-action", action, selectedPetId, commandMode),
  updateIntegrationCommandPaths: (patch) => ipcRenderer.invoke("nekodrift:agent-setup-command-paths", patch),
};

contextBridge.exposeInMainWorld("nekoDriftControlCenter", api);
