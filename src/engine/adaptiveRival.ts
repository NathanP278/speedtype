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

export function createAdaptiveRivalProfile(
  calibration: UserCalibration,
  difficulty: RivalDifficultyLevel = 'equal'
): BotProfile {
  const config = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;
  const rivalWpm = Math.max(25, Math.round(calibration.netWpm * config.multiplier));
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
