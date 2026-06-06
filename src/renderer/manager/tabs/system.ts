import { CatSettings } from '../../../shared/types';

export function initSystemTab(api: any, settings: CatSettings): void {
  const ontopToggle = document.getElementById('toggle-ontop') as HTMLInputElement;
  const loginToggle = document.getElementById('toggle-login') as HTMLInputElement;
  const dndToggle   = document.getElementById('toggle-dnd') as HTMLInputElement;

  ontopToggle.checked = settings.alwaysOnTop;
  loginToggle.checked = settings.startOnLogin;
  dndToggle.checked   = settings.dndEnabled;

  document.getElementById('btn-open-settings')!.addEventListener('click', () => {
    api.openSettings();
  });

  document.getElementById('btn-save-system')!.addEventListener('click', async () => {
    await api.saveSettings({
      alwaysOnTop:  ontopToggle.checked,
      startOnLogin: loginToggle.checked,
      dndEnabled:   dndToggle.checked,
    });
    showSaveToast('System settings saved');
  });
}

function showSaveToast(msg: string): void {
  const toast = document.getElementById('save-toast')!;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
