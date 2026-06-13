import { STRETCH_MESSAGES } from '../shared/constants';

type StretchCallback = (message: string) => void;

export class StretchTimer {
  private callback: StretchCallback;
  private intervalMs: number;
  private userName: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private snoozeTimer: ReturnType<typeof setTimeout> | null = null;
  private lastStretch = Date.now();

  constructor(callback: StretchCallback, intervalMinutes: number, userName: string) {
    this.callback = callback;
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.userName = userName;
  }

  start(): void {
    this.timer = setInterval(() => {
      const msg = STRETCH_MESSAGES[Math.floor(Math.random() * STRETCH_MESSAGES.length)];
      this.callback(msg(this.userName));
      this.lastStretch = Date.now();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.snoozeTimer) { clearTimeout(this.snoozeTimer); this.snoozeTimer = null; }
  }

  restart(intervalMinutes: number, userName: string): void {
    this.stop();
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.userName = userName;
    this.start();
  }

  snooze(minutes: number): void {
    this.stop();
    this.snoozeTimer = setTimeout(() => {
      this.snoozeTimer = null;
      this.start();
    }, minutes * 60 * 1000);
  }
}
