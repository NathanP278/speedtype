import { StanceType } from '../types/combat.ts';

export interface TournamentContestant {
  id: string;
  name: string;
  avatar: string;
  seed: number;
  baseWpm: number;
  currentWpm: number;
  health: number;
  beamProgress: number; // -100 to 100
  stance: StanceType;
  odds: number;
  eliminated: boolean;
  score: number;
}

export const TOURNAMENT_SEEDS: Omit<TournamentContestant, 'currentWpm' | 'health' | 'beamProgress' | 'eliminated' | 'score'>[] = [
  { id: 'c1', name: 'CYBER_SHINOBI', avatar: '[SHN]', seed: 1, baseWpm: 124, stance: 'strike', odds: 1.4 },
  { id: 'c2', name: 'ADA_AEGIS', avatar: '[ADA]', seed: 2, baseWpm: 98, stance: 'counter', odds: 2.1 },
  { id: 'c3', name: 'GLITCH_CORRUPT', avatar: '[GLT]', seed: 3, baseWpm: 94, stance: 'disrupt', odds: 2.8 },
  { id: 'c4', name: 'BUFFER_OVERRUN', avatar: '[BUF]', seed: 4, baseWpm: 88, stance: 'strike', odds: 3.5 },
  { id: 'c5', name: 'NULL_POINTER', avatar: '[NUL]', seed: 5, baseWpm: 82, stance: 'counter', odds: 4.2 },
  { id: 'c6', name: 'SYNTAX_PANIC', avatar: '[SYN]', seed: 6, baseWpm: 76, stance: 'disrupt', odds: 5.0 },
];

export function createTournamentBracket(): TournamentContestant[] {
  return TOURNAMENT_SEEDS.map(seed => ({
    ...seed,
    currentWpm: seed.baseWpm,
    health: 100,
    beamProgress: 0,
    eliminated: false,
    score: 0,
  }));
}
