export class SoundEngine {
  private ac: AudioContext | null = null;
  enabled = true;

  private ctx(): AudioContext {
    if (!this.ac) this.ac = new AudioContext();
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }

  purr(durationSec = 0.9): void {
    if (!this.enabled) return;
    try {
      const ac = this.ctx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      osc.frequency.value = 26;
      osc.type = 'sawtooth';
      lfo.frequency.value = 28;
      lfoGain.gain.value = 9;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.11, ac.currentTime + 0.12);
      gain.gain.setValueAtTime(0.11, ac.currentTime + durationSec - 0.1);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ac.destination);
      lfo.start();
      osc.start();
      osc.stop(ac.currentTime + durationSec);
      lfo.stop(ac.currentTime + durationSec);
    } catch (_) {}
  }

  meow(): void {
    if (!this.enabled) return;
    try {
      const ac = this.ctx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.28);
      osc.frequency.exponentialRampToValueAtTime(560, ac.currentTime + 0.48);
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.04);
      gain.gain.setValueAtTime(0.18, ac.currentTime + 0.36);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.58);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.62);
    } catch (_) {}
  }

  chime(): void {
    if (!this.enabled) return;
    try {
      const ac = this.ctx();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + i * 0.14;
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
    } catch (_) {}
  }

  alert(): void {
    if (!this.enabled) return;
    try {
      const ac = this.ctx();
      [440, 554, 440].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + i * 0.18;
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
        gain.gain.linearRampToValueAtTime(0, t + 0.16);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (_) {}
  }

  pop(): void {
    if (!this.enabled) return;
    try {
      const ac = this.ctx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.setValueAtTime(300, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.1);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.12);
    } catch (_) {}
  }
}
