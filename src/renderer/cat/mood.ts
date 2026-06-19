import { CatMood } from '../../shared/types';

export class MoodSystem {
  private petCount = 0;
  private lastPetTime = 0;
  private stretchDone = 0;
  private overheatCount = 0;
  private typingBursts = 0;
  private sessionStartTime = Date.now();
  private lastFeedTime = Date.now(); // starts "fed" at boot
  private feedCount = 0;

  onPet(): void {
    this.petCount++;
    this.lastPetTime = Date.now();
    // Petting resets typing fatigue
    this.typingBursts = Math.max(0, this.typingBursts - 3);
  }

  onFeed(): void {
    this.feedCount++;
    this.lastFeedTime = Date.now();
  }

  getHungerLevel(): 'full' | 'hungry' | 'starving' {
    const minSinceFed = (Date.now() - this.lastFeedTime) / 60_000;
    if (minSinceFed < 60) return 'full';
    if (minSinceFed < 180) return 'hungry';
    return 'starving';
  }

  onStretchDone(): void { this.stretchDone++; }

  onOverheat(): void { this.overheatCount++; }

  onTyping(): void { this.typingBursts++; }

  getMood(): CatMood {
    const now = Date.now();
    const sessionMin = (now - this.sessionStartTime) / 60_000;
    const timeSincePet = (now - this.lastPetTime) / 60_000;

    if (this.overheatCount >= 3 || this.typingBursts >= 12) return 'tired';
    if (sessionMin > 30 && this.petCount === 0) return 'lonely';
    if (this.lastPetTime > 0 && timeSincePet < 5) return 'happy';
    return 'content';
  }

  getStats(): { mood: CatMood; petCount: number; sessionMin: number; overheats: number; typingBursts: number; lastPetMin: number; hunger: string; feedCount: number } {
    const now = Date.now();
    return {
      mood: this.getMood(),
      petCount: this.petCount,
      sessionMin: Math.round((now - this.sessionStartTime) / 60_000),
      overheats: this.overheatCount,
      typingBursts: Math.min(this.typingBursts, 99),
      lastPetMin: this.lastPetTime > 0 ? Math.round((now - this.lastPetTime) / 60_000) : -1,
      hunger: this.getHungerLevel(),
      feedCount: this.feedCount,
    };
  }
}
