import { TYPING_COOLDOWN_MS } from '../shared/constants';

type TypingCallback = (isTyping: boolean) => void;

export class KeyboardTracker {
  private callback: TypingCallback;
  private isTyping = false;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private uiohook: any = null;

  constructor(callback: TypingCallback) {
    this.callback = callback;
  }

  async start(): Promise<void> {
    try {
      // Dynamically import uiohook-napi (native module)
      const { uIOhook } = await import('uiohook-napi');
      this.uiohook = uIOhook;

      uIOhook.on('keydown', () => {
        this.onKeyPress();
      });

      uIOhook.start();
    } catch (err) {
      // uiohook may fail in some environments — fallback gracefully
      console.warn('uiohook-napi not available, keyboard tracking disabled:', err);
    }
  }

  stop(): void {
    try {
      if (this.uiohook) {
        this.uiohook.stop();
      }
    } catch (_) {}

    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }
  }

  private onKeyPress(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.callback(true);
    }

    // Reset cooldown on every keypress
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.isTyping = false;
      this.callback(false);
    }, TYPING_COOLDOWN_MS);
  }

  getIsTyping(): boolean {
    return this.isTyping;
  }
}
