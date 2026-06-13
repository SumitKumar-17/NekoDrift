import { powerMonitor } from 'electron';
import { IDLE_THRESHOLD_MS } from '../shared/constants';

type IdleCallback = (isIdle: boolean) => void;

export class IdleDetector {
  private callback: IdleCallback;
  private interval: ReturnType<typeof setInterval> | null = null;
  private isIdle = false;

  constructor(callback: IdleCallback) {
    this.callback = callback;
  }

  start(): void {
    // Track system idle via powerMonitor
    this.interval = setInterval(() => {
      const systemIdleSecs = powerMonitor.getSystemIdleTime();
      const nowIdle = systemIdleSecs * 1000 >= IDLE_THRESHOLD_MS;

      if (nowIdle !== this.isIdle) {
        this.isIdle = nowIdle;
        this.callback(nowIdle);
      }
    }, 5000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getIsIdle(): boolean {
    return this.isIdle;
  }
}
