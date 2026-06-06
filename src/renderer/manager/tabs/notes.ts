import { CatSettings } from '../../../shared/types';

export function initNotesTab(api: any, settings: CatSettings): void {
  const stickyToggle = document.getElementById('toggle-sticky') as HTMLInputElement;
  const stickyText   = document.getElementById('sticky-text') as HTMLTextAreaElement;
  const pinnedToggle = document.getElementById('toggle-pinned') as HTMLInputElement;
  const pinnedMsg    = document.getElementById('pinned-msg') as HTMLInputElement;

  stickyToggle.checked = settings.stickyNoteEnabled;
  stickyText.value     = settings.stickyNote;
  pinnedToggle.checked = settings.fixedMessageEnabled;
  pinnedMsg.value      = settings.fixedMessage;

  document.getElementById('btn-save-notes')!.addEventListener('click', async () => {
    await api.saveSettings({
      stickyNoteEnabled:  stickyToggle.checked,
      stickyNote:         stickyText.value,
      fixedMessageEnabled: pinnedToggle.checked,
      fixedMessage:        pinnedMsg.value,
    });
    showSaveToast('Notes saved');
  });
}

function showSaveToast(msg: string): void {
  const toast = document.getElementById('save-toast')!;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
