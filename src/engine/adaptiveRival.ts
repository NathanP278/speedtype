import { BotProfile } from './botOpponent.ts';
import { UserCalibration } from './calibration.ts';

export type RivalDifficultyLevel = 'relaxed' | 'equal' | 'challenger' | 'boss';

export interface DifficultyConfig {
  id: RivalDifficultyLevel;
  label: string;
  multiplier: number;
  badge: string;
  description: string;
}

export const RIVAL_DIFFICULTIES: Record<RivalDifficultyLevel, DifficultyConfig> = {
  relaxed: {
    id: 'relaxed',
    label: 'WARMUP',
    multiplier: 0.85,
    badge: '0.85x',
    description: 'Casual pacing for warmups (-15% speed)',
  },
  equal: {
    id: 'equal',
    label: 'EVEN MATCH',
    multiplier: 1.0,
    badge: '1.0x',
    description: 'Tuned exactly to your calibrated WPM',
  },
  challenger: {
    id: 'challenger',
    label: 'CHALLENGER',
    multiplier: 1.15,
    badge: '1.15x',
    description: 'Pushes your tempo with +15% speed surge',
  },
  boss: {
    id: 'boss',
    label: 'CYBER BOSS',
    multiplier: 1.3,
    badge: '1.30x',
    description: 'High-speed duel for master typists (+30% speed)',
  },
};

/**
 * Draws a fresh rival WPM for a single match.
 * Applies a [-20, +5] variance window around the base WPM so every match
 * feels different — the rival is never a perfectly predictable robot.
 * Minimum 15 WPM to avoid an unplayably slow experience.
 */
export function drawRivalWpm(
  calibration: UserCalibration | null,
  difficulty: RivalDifficultyLevel = 'equal'
): number {
  const config = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;
  const basePlayerWpm = calibration?.netWpm ?? 65;
  const baseWpm = Math.max(25, Math.round(basePlayerWpm * config.multiplier));

  // Variance window: -20 to +5 (negative-skewed — rivals are occasionally easier, rarely harder)
  const varianceLow = -20;
  const varianceHigh = 5;
  const variance = Math.round(varianceLow + Math.random() * (varianceHigh - varianceLow));

  return Math.max(15, baseWpm + variance);
}

export function createAdaptiveRivalProfile(
  calibration: UserCalibration,
  difficulty: RivalDifficultyLevel = 'equal'
): BotProfile {
  const config = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;
  const rivalWpm = drawRivalWpm(calibration, difficulty);
  const rivalAccuracy = Math.min(0.99, Math.max(0.88, (calibration.accuracy / 100) * 0.98));

  const titles: Record<RivalDifficultyLevel, string> = {
    relaxed: `Sparring Bot (${rivalWpm} WPM)`,
    equal: `Calibrated Twin (${rivalWpm} WPM)`,
    challenger: `Ascendant Challenger (${rivalWpm} WPM)`,
    boss: `Overclock Matrix Boss (${rivalWpm} WPM)`,
  };

  const avatars: Record<RivalDifficultyLevel, string> = {
    relaxed: '[SPAR]',
    equal: '[TWIN]',
    challenger: '[CHLG]',
    boss: '[BOSS]',
  };

  return {
    id: `adaptive-${difficulty}-${rivalWpm}`,
    name: `RIVAL // ${config.label}`,
    avatar: avatars[difficulty],
    title: titles[difficulty],
    wpm: rivalWpm,
    accuracy: rivalAccuracy,
    preferredStance: 'strike',
    stanceSwitchChance: 0.15,
  };
}
