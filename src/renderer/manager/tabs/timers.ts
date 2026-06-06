import { CatSettings, PomodoroState } from '../../../shared/types';

function pad(n: number): string { return String(n).padStart(2, '0'); }
function fmtMs(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function initTimersTab(api: any, settings: CatSettings): void {
  // ── Pomodoro ─────────────────────────────────────────────────
  const pomoTime    = document.getElementById('pomo-time')!;
  const pomoMode    = document.getElementById('pomo-mode')!;
  const pomoSession = document.getElementById('pomo-session')!;
  const pomoToggle  = document.getElementById('toggle-pomo') as HTMLInputElement;
  const pomoFocus   = document.getElementById('pomo-focus') as HTMLInputElement;
  const pomoBreak   = document.getElementById('pomo-break') as HTMLInputElement;

  pomoToggle.checked  = settings.pomodoroEnabled;
  pomoFocus.value     = String(settings.pomodoroFocusMin);
  pomoBreak.value     = String(settings.pomodoroBreakMin);

  function applyPomoState(state: PomodoroState | null): void {
    if (!state || state.mode === 'idle') {
      pomoMode.textContent    = 'IDLE';
      pomoMode.className      = 'pomo-mode mode-idle';
      pomoTime.textContent    = `${pad(settings.pomodoroFocusMin)}:00`;
      pomoSession.textContent = '';
      return;
    }
    pomoMode.textContent    = state.mode === 'focus' ? 'FOCUS' : 'BREAK';
    pomoMode.className      = `pomo-mode mode-${state.mode}`;
    pomoTime.textContent    = fmtMs(state.remainingMs);
    pomoSession.textContent = `Session ${state.session}`;
  }

  // Fetch current state on open
  api.getPomoState().then((s: PomodoroState | null) => applyPomoState(s));

  // Live updates
  (window as any).nekodrift.onPomodoroState((s: PomodoroState) => applyPomoState(s));

  document.getElementById('btn-pomo-start')!.addEventListener('click', () => {
    api.pomodoroControl('start');
  });
  document.getElementById('btn-pomo-pause')!.addEventListener('click', () => {
    api.pomodoroControl('pause');
  });
  document.getElementById('btn-pomo-reset')!.addEventListener('click', () => {
    api.pomodoroControl('reset');
    applyPomoState(null);
  });

  // ── Stretch ──────────────────────────────────────────────────
  const stretchToggle   = document.getElementById('toggle-stretch') as HTMLInputElement;
  const stretchInterval = document.getElementById('stretch-interval') as HTMLInputElement;
  stretchToggle.checked   = settings.stretchEnabled;
  stretchInterval.value   = String(settings.stretchIntervalMin);

  // ── Daily Reminder ───────────────────────────────────────────
  const remToggle  = document.getElementById('toggle-reminder') as HTMLInputElement;
  const remHour    = document.getElementById('reminder-hour') as HTMLInputElement;
  const remMin     = document.getElementById('reminder-min') as HTMLInputElement;
  const remMsg     = document.getElementById('reminder-msg') as HTMLInputElement;
  remToggle.checked = settings.reminderEnabled;
  remHour.value     = String(settings.reminderHour);
  remMin.value      = String(settings.reminderMinute);
  remMsg.value      = settings.reminderMessage;

  // ── Save ─────────────────────────────────────────────────────
  document.getElementById('btn-save-timers')!.addEventListener('click', async () => {
    await api.saveSettings({
      pomodoroEnabled:    pomoToggle.checked,
      pomodoroFocusMin:   parseInt(pomoFocus.value) || 25,
      pomodoroBreakMin:   parseInt(pomoBreak.value) || 5,
      stretchEnabled:     stretchToggle.checked,
      stretchIntervalMin: parseInt(stretchInterval.value) || 30,
      reminderEnabled:    remToggle.checked,
      reminderHour:       parseInt(remHour.value) || 0,
      reminderMinute:     parseInt(remMin.value) || 0,
      reminderMessage:    remMsg.value.trim() || 'Hey! Check in time!',
    });
    showSaveToast('Timers saved');
  });
}

function showSaveToast(msg: string): void {
  const toast = document.getElementById('save-toast')!;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
