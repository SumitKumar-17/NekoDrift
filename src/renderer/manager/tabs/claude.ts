import { CatSettings } from '../../../shared/types';

const HOOKS_JSON = `{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-thinking 2>/dev/null || true" }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "curl -sf -X POST http://127.0.0.1:27182/api/ai-done 2>/dev/null || true" }]
    }]
  }
}`;

export function initClaudeTab(api: any, settings: CatSettings): void {
  const toggle = document.getElementById('toggle-claude') as HTMLInputElement;
  toggle.checked = settings.claudeIntegration;

  document.getElementById('btn-copy-hooks')!.addEventListener('click', () => {
    navigator.clipboard.writeText(HOOKS_JSON).then(() => {
      showSaveToast('Copied to clipboard!');
    });
  });

  document.getElementById('btn-save-claude')!.addEventListener('click', async () => {
    await api.saveSettings({ claudeIntegration: toggle.checked });
    showSaveToast('Saved');
  });
}

function showSaveToast(msg: string): void {
  const toast = document.getElementById('save-toast')!;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
