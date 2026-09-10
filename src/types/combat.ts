export type StanceType = 'strike' | 'counter' | 'disrupt';

export interface StanceConfig {
  id: StanceType;
  name: string;
  themeColor: string;
  glowColor: string;
  badge: string;
  description: string;
  combatBonus: string;
}

export interface WordTarget {
  id: string;
  text: string;
  stance: StanceType;
  damage: number;
  bonusMultiplier?: number;
}

export interface KeystrokeLog {
  timestamp: number;
  char: string;
  expectedChar: string;
  correct: boolean;
  stance: StanceType;
  wpm: number;
}

export interface BeamState {
  position: number; // -100 (Player Loss) to +100 (Opponent Loss / Player Win)
  velocity: number;
  tension: number;
  dominantStance: StanceType;
  lastImpactTime: number;
  screenShake: number;
}

export interface CombatStats {
  wpm: number;
  peakWpm: number;
  accuracy: number;
  totalKeystrokes: number;
  totalMistakes: number;
  longestStreak: number;
  wordsCompleted: number;
  parriesCount: number;
  overclockCount: number;
}

export interface CombatantState {
  id: 'player' | 'opponent';
  name: string;
  health: number;
  maxHealth: number;
  shield: number;
  superMeter: number;
  stance: StanceType;
  activeWord: WordTarget | null;
  typedText: string;
  cleanStreak: number;
  isOverclocked: boolean;
  isDisrupted: boolean;
  disruptionRemainingMs: number;
  stats: CombatStats;
}

export interface FinisherState {
  active: boolean;
  attackerId: 'player' | 'opponent' | null;
  defenderId: 'player' | 'opponent' | null;
  bossWord: string;
  playerProgress: number; // characters typed
  opponentProgress: number;
  timeRemainingMs: number;
  completed: boolean;
  winnerId: 'player' | 'opponent' | null;
}

export type MatchStatus = 'idle' | 'countdown' | 'in_progress' | 'finisher' | 'game_over';

export interface MatchResult {
  winner: 'player' | 'opponent';
  reason: 'beam_baseline_ko' | 'health_depleted_ko' | 'finisher_boss_ko' | 'sudden_death';
  durationMs: number;
  playerStats: CombatStats;
  opponentStats: CombatStats;
  kpEarned: number;
  timestamp: number;
  koSignatureEquipped?: string;
}
