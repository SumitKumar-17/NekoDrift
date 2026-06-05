type ReminderCallback = (message: string) => void;

export class MessageReminder {
  private timer: ReturnType<typeof setInterval> | null = null;
  private hour: number;
  private minute: number;
  private message: string;
  private lastFiredDate = '';
  private cb: ReminderCallback;

  constructor(hour: number, minute: number, message: string, cb: ReminderCallback) {
    this.hour = hour;
    this.minute = minute;
    this.message = message;
    this.cb = cb;
  }

  start(): void {
    this.timer = setInterval(() => this.check(), 30_000); // check every 30s
    this.check();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  update(hour: number, minute: number, message: string): void {
    this.hour = hour;
    this.minute = minute;
    this.message = message;
    this.lastFiredDate = ''; // allow re-fire if time matches
  }

  private check(): void {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (now.getHours() === this.hour && now.getMinutes() === this.minute && this.lastFiredDate !== dateKey) {
      this.lastFiredDate = dateKey;
      this.cb(this.message);
    }
  }
}
