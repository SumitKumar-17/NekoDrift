import { TYPING_COOLDOWN_MS, OVERHEAT_WPM } from '../shared/constants';

type TypingCallback = (isTyping: boolean) => void;
type HeatCallback = (level: number) => void;
type ScrollCallback = () => void;

export class KeyboardTracker {
  private typingCb: TypingCallback;
  private heatCb: HeatCallback;
  private scrollCb: ScrollCallback;
  private isTyping = false;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private hookActive = false;

  // WPM tracking
  private keyTimes: number[] = [];
  private heatLevel = 0;
  private heatDecayTimer: ReturnType<typeof setInterval> | null = null;

  constructor(typingCb: TypingCallback, heatCb: HeatCallback = () => {}, scrollCb: ScrollCallback = () => {}) {
    this.typingCb = typingCb;
    this.heatCb = heatCb;
    this.scrollCb = scrollCb;
  }

  async start(): Promise<void> {
    try {
      const { uIOhook } = require('uiohook-napi');

      uIOhook.on('keydown', () => this.onKeyPress());
      uIOhook.on('wheel', () => this.onScroll());
      uIOhook.start();
      this.hookActive = true;
      console.log('[KeyboardTracker] uiohook-napi started');
    } catch (err) {
      console.warn('[KeyboardTracker] uiohook-napi unavailable, keyboard tracking disabled');
    }

    // Decay heat level over time
    this.heatDecayTimer = setInterval(() => {
      if (!this.isTyping && this.heatLevel > 0) {
        this.heatLevel = Math.max(0, this.heatLevel - 1);
        this.heatCb(this.heatLevel);
      }
    }, 3000);
  }

  stop(): void {
    if (this.hookActive) {
      try {
        const { uIOhook } = require('uiohook-napi');
        uIOhook.stop();
      } catch (_) {}
    }
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    if (this.heatDecayTimer) clearInterval(this.heatDecayTimer);
  }

  private onKeyPress(): void {
    const now = Date.now();
    this.keyTimes.push(now);
    // Keep only last 30 seconds of key events
    this.keyTimes = this.keyTimes.filter(t => now - t < 30_000);

    // WPM = (keystrokes / 5) per minute (standard: 5 chars = 1 word)
    const keystrokesPerMin = (this.keyTimes.length / 30) * 60;
    const wpm = keystrokesPerMin / 5;

    if (wpm > OVERHEAT_WPM) {
      const newHeat = Math.min(3, this.heatLevel + 1);
      if (newHeat !== this.heatLevel) {
        this.heatLevel = newHeat;
        this.heatCb(this.heatLevel);
      }
    }

    if (!this.isTyping) {
      this.isTyping = true;
      this.typingCb(true);
    }
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.isTyping = false;
      this.typingCb(false);
    }, TYPING_COOLDOWN_MS);
  }

  private onScroll(): void {
    this.scrollCb();
  }
}
