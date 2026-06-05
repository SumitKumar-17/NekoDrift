import { TYPING_COOLDOWN_MS } from '../shared/constants';

type TypingCallback = (isTyping: boolean) => void;

export class KeyboardTracker {
  private callback: TypingCallback;
  private isTyping = false;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private hookActive = false;

  constructor(callback: TypingCallback) {
    this.callback = callback;
  }

  async start(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { uIOhook } = require('uiohook-napi');

      uIOhook.on('keydown', () => this.onKeyPress());
      uIOhook.start();
      this.hookActive = true;
      console.log('[KeyboardTracker] uiohook-napi started');
    } catch (err) {
      console.warn('[KeyboardTracker] uiohook-napi unavailable, keyboard tracking disabled');
    }
  }

  stop(): void {
    if (this.hookActive) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { uIOhook } = require('uiohook-napi');
        uIOhook.stop();
      } catch (_) {}
    }
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
  }

  private onKeyPress(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.callback(true);
    }
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.isTyping = false;
      this.callback(false);
    }, TYPING_COOLDOWN_MS);
  }
}
