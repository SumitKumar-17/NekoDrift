import { CatMood } from '../../shared/types';

export class MoodSystem {
  private petCount = 0;
  private lastPetTime = 0;
  private stretchDone = 0;
  private overheatCount = 0;
  private typingBursts = 0;
  private sessionStartTime = Date.now();

  onPet(): void {
    this.petCount++;
    this.lastPetTime = Date.now();
    // Petting resets typing fatigue
    this.typingBursts = Math.max(0, this.typingBursts - 3);
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
}
