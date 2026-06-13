import { PomodoroState } from '../shared/types';

type PomodoroCallback = (state: PomodoroState) => void;

export class PomodoroTimer {
  private mode: 'focus' | 'break' | 'idle' = 'idle';
  private remainingMs = 0;
  private session = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private focusMs: number;
  private breakMs: number;
  private cb: PomodoroCallback;

  constructor(focusMin: number, breakMin: number, cb: PomodoroCallback) {
    this.focusMs = focusMin * 60_000;
    this.breakMs = breakMin * 60_000;
    this.cb = cb;
  }

  start(): void {
    if (this.timer) return; // already ticking
    if (this.mode === 'idle') {
      // Fresh start
      this.mode = 'focus';
      this.remainingMs = this.focusMs;
      this.session++;
    }
    // else: resuming from pause — mode and remainingMs are already set
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.emit();
    }
  }

  reset(): void {
    this.clearTimer();
    this.mode = 'idle';
    this.remainingMs = 0;
    this.session = 0;
    this.emit();
  }

  restart(focusMin: number, breakMin: number): void {
    this.focusMs = focusMin * 60_000;
    this.breakMs = breakMin * 60_000;
    this.stop();
  }

  stop(): void {
    this.clearTimer();
    this.mode = 'idle';
    this.remainingMs = 0;
    this.session = 0;
    // no emit — caller is discarding the timer, not completing a session
  }

  private clearTimer(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  getState(): PomodoroState {
    return { mode: this.mode, remainingMs: this.remainingMs, session: this.session, running: this.timer !== null };
  }

  private tick(): void {
    if (this.mode === 'idle') return;
    this.remainingMs -= 1000;
    if (this.remainingMs <= 0) {
      if (this.mode === 'focus') {
        this.mode = 'break';
        this.remainingMs = this.breakMs;
      } else {
        this.mode = 'focus';
        this.remainingMs = this.focusMs;
        this.session++;
      }
    }
    this.emit();
  }

  private emit(): void {
    this.cb(this.getState());
  }
}
