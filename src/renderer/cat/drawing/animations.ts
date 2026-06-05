import { CatAnimation } from '../../../shared/types';

export interface AnimState {
  bobY: number;
  tailSwing: number;
  blinkOpen: boolean;
  legOffset: number;
  bodySquish: number;
}

export function computeAnimState(
  animation: CatAnimation,
  frame: number,
  mood: string,
): AnimState {
  const t = frame;
  let bobY = 0;
  let tailSwing = 0;
  let blinkOpen = true;
  let legOffset = 0;
  let bodySquish = 1;

  const moodTailMult = mood === 'happy' ? 1.4 : mood === 'lonely' ? 0.5 : 1;
  const moodBlinkRate = mood === 'tired' ? 60 : mood === 'happy' ? 220 : 180;

  switch (animation) {
    case 'idle':
      bobY = Math.sin(t * 0.04) * (mood === 'tired' ? 0.6 : 0.35);
      tailSwing = Math.sin(t * 0.06) * 15 * moodTailMult;
      blinkOpen = !((t % moodBlinkRate) > (moodBlinkRate - 10));
      break;

    case 'walk':
    case 'run': {
      const speed = animation === 'run' ? 0.25 : 0.15;
      bobY = Math.abs(Math.sin(t * speed)) * 0.6;
      tailSwing = Math.sin(t * speed * 2) * 20 * moodTailMult;
      legOffset = Math.sin(t * speed) * 2;
      break;
    }

    case 'type':
      bobY = Math.sin(t * 0.18) * 0.4;
      tailSwing = Math.sin(t * 0.14) * 22;
      blinkOpen = !((t % 70) > 55);
      break;

    case 'hunt':
      bobY = 2 + Math.abs(Math.sin(t * 0.3)) * 0.5;
      tailSwing = Math.sin(t * 0.08) * 5;
      legOffset = Math.sin(t * 0.4) * 1.5;
      blinkOpen = !((t % 60) > 55);
      break;

    case 'purr':
      bobY = Math.sin(t * 0.06) * 0.3;
      tailSwing = Math.sin(t * 0.08) * 22 * moodTailMult;
      blinkOpen = !((t % 90) > 75);
      break;

    case 'overheat':
      bobY = Math.sin(t * 0.35) * 0.6;
      tailSwing = Math.sin(t * 0.4) * 12;
      legOffset = Math.sin(t * 0.5) * 1;
      break;

    case 'paper':
      bobY = Math.sin(t * 0.08) * 0.3;
      tailSwing = Math.sin(t * 0.12) * 14;
      break;

    case 'think':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.04) * 8;
      blinkOpen = !((t % 120) > 105);
      break;

    case 'jump':
      bobY = -Math.abs(Math.sin(t * 0.2)) * 3.5;
      tailSwing = Math.sin(t * 0.4) * 30;
      bodySquish = 0.85 + Math.abs(Math.sin(t * 0.2)) * 0.22;
      break;

    case 'sit':
      bobY = Math.sin(t * 0.04) * 0.2;
      tailSwing = Math.sin(t * 0.05) * 12 * moodTailMult;
      blinkOpen = !((t % moodBlinkRate) > (moodBlinkRate - 10));
      break;

    case 'sleep':
      bobY = Math.sin(t * 0.02) * 0.3;
      blinkOpen = false;
      break;

    case 'stretch':
      tailSwing = Math.sin(t * 0.05) * 5;
      blinkOpen = !((t % 200) > 195);
      break;

    case 'happy':
      bobY = Math.abs(Math.sin(t * 0.22)) * 1.8;
      tailSwing = Math.sin(t * 0.26) * 28;
      break;

    case 'surprised':
      tailSwing = Math.sin(t * 0.4) * 5;
      break;
  }

  return { bobY, tailSwing, blinkOpen, legOffset, bodySquish };
}
