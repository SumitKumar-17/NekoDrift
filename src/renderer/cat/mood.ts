import { CatMood } from '../../shared/types';

export class MoodSystem {
  private petCount = 0;
  private lastPetTime = 0;
  private stretchDone = 0;
  private overheatCount = 0;
  private sessionStartTime = Date.now();

  onPet(): void {
    this.petCount++;
    this.lastPetTime = Date.now();
  }

  onStretchDone(): void { this.stretchDone++; }

  onOverheat(): void { this.overheatCount++; }

  getMood(): CatMood {
    const now = Date.now();
    const sessionMin = (now - this.sessionStartTime) / 60_000;
    const timeSincePet = (now - this.lastPetTime) / 60_000;

    if (this.overheatCount >= 3) return 'tired';
    if (sessionMin > 30 && this.petCount === 0) return 'lonely';
    if (this.lastPetTime > 0 && timeSincePet < 5) return 'happy';
    return 'content';
  }
}
