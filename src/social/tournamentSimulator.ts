import { StanceType } from '../types/combat.ts';

export interface TournamentContestant {
  id: string;
  name: string;
  avatar: string;
  title: string;
  seed: number;
  baseWpm: number;
  currentWpm: number;
  accuracy: number;
  health: number;
  beamProgress: number; // -100 to 100
  stance: StanceType;
  odds: number;
  eliminated: boolean;
  score: number;
}

export type TournamentRoundId = 'QF' | 'SF' | 'GF';
export type MatchStatus = 'pending' | 'active' | 'completed';

export interface TournamentMatch {
  id: string;
  round: TournamentRoundId;
  name: string;
  matchIndex: number;
  contestant1: TournamentContestant | null;
  contestant2: TournamentContestant | null;
  winner: TournamentContestant | null;
  status: MatchStatus;
  oddsC1: number;
  oddsC2: number;
}

export interface TournamentBracket {
  rounds: {
    QF: TournamentMatch[];
    SF: TournamentMatch[];
    GF: TournamentMatch[];
  };
  currentRound: TournamentRoundId;
  activeMatchId: string;
  champion: TournamentContestant | null;
  isComplete: boolean;
}

export const TOURNAMENT_SEEDS: Omit<
  TournamentContestant,
  'currentWpm' | 'health' | 'beamProgress' | 'eliminated' | 'score'
>[] = [
  {
    id: 'c1',
    name: 'CYBER_SHINOBI',
    avatar: '[SHN]',
    title: 'Burst Assassin',
    seed: 1,
    baseWpm: 124,
    accuracy: 0.98,
    stance: 'strike',
    odds: 1.4,
  },
  {
    id: 'c2',
    name: 'ADA_AEGIS',
    avatar: '[ADA]',
    title: 'Cryptographic Anchor',
    seed: 2,
    baseWpm: 98,
    accuracy: 0.96,
    stance: 'counter',
    odds: 2.1,
  },
  {
    id: 'c3',
    name: 'GLITCH_CORRUPT',
    avatar: '[GLT]',
    title: 'Interface Scrambler',
    seed: 3,
    baseWpm: 94,
    accuracy: 0.94,
    stance: 'disrupt',
    odds: 2.8,
  },
  {
    id: 'c4',
    name: 'BUFFER_OVERRUN',
    avatar: '[BUF]',
    title: 'Memory Flooder',
    seed: 4,
    baseWpm: 88,
    accuracy: 0.93,
    stance: 'strike',
    odds: 3.5,
  },
  {
    id: 'c5',
    name: 'NULL_POINTER',
    avatar: '[NUL]',
    title: 'Exception Tank',
    seed: 5,
    baseWpm: 82,
    accuracy: 0.92,
    stance: 'counter',
    odds: 4.2,
  },
  {
    id: 'c6',
    name: 'SYNTAX_PANIC',
    avatar: '[SYN]',
    title: 'High-Entropy Disruptor',
    seed: 6,
    baseWpm: 76,
    accuracy: 0.91,
    stance: 'disrupt',
    odds: 5.0,
  },
  {
    id: 'c7',
    name: 'STACK_SMASHER',
    avatar: '[STK]',
    title: 'Brute Force Underdog',
    seed: 7,
    baseWpm: 72,
    accuracy: 0.89,
    stance: 'strike',
    odds: 6.5,
  },
  {
    id: 'c8',
    name: 'BIT_FLIPPER',
    avatar: '[BIT]',
    title: 'Chaotic Specialist',
    seed: 8,
    baseWpm: 68,
    accuracy: 0.88,
    stance: 'disrupt',
    odds: 8.0,
  },
];

export function computeMatchupOdds(
  cA: TournamentContestant,
  cB: TournamentContestant
): { oddsA: number; oddsB: number } {
  const powerA = cA.baseWpm * (cA.accuracy || 0.95);
  const powerB = cB.baseWpm * (cB.accuracy || 0.95);

  const ratioA = powerB / Math.max(1, powerA);
  const ratioB = powerA / Math.max(1, powerB);

  const rawOddsA = Math.max(1.15, Math.min(8.5, 1.85 * ratioA));
  const rawOddsB = Math.max(1.15, Math.min(8.5, 1.85 * ratioB));

  return {
    oddsA: Math.round(rawOddsA * 10) / 10,
    oddsB: Math.round(rawOddsB * 10) / 10,
  };
}

export function createTournamentContestants(): TournamentContestant[] {
  return TOURNAMENT_SEEDS.map(seed => ({
    ...seed,
    currentWpm: seed.baseWpm,
    health: 100,
    beamProgress: 0,
    eliminated: false,
    score: 0,
  }));
}

export function createTournamentBracket(): TournamentBracket {
  const contestants = createTournamentContestants();
  const cMap = new Map<string, TournamentContestant>();
  contestants.forEach(c => cMap.set(c.id, c));

  const getC = (id: string): TournamentContestant => {
    const found = cMap.get(id);
    if (!found) {
      throw new Error(`Seed contestant with id ${id} not found`);
    }
    return found;
  };

  // Quarterfinals pairings:
  // QF1: 1v8 (c1 vs c8)
  // QF2: 4v5 (c4 vs c5)
  // QF3: 2v7 (c2 vs c7)
  // QF4: 3v6 (c3 vs c6)
  const qf1A = getC('c1');
  const qf1B = getC('c8');
  const odds1 = computeMatchupOdds(qf1A, qf1B);

  const qf2A = getC('c4');
  const qf2B = getC('c5');
  const odds2 = computeMatchupOdds(qf2A, qf2B);

  const qf3A = getC('c2');
  const qf3B = getC('c7');
  const odds3 = computeMatchupOdds(qf3A, qf3B);

  const qf4A = getC('c3');
  const qf4B = getC('c6');
  const odds4 = computeMatchupOdds(qf4A, qf4B);

  const QF: TournamentMatch[] = [
    {
      id: 'qf-1',
      round: 'QF',
      name: 'Quarterfinal 1',
      matchIndex: 0,
      contestant1: { ...qf1A, odds: odds1.oddsA },
      contestant2: { ...qf1B, odds: odds1.oddsB },
      winner: null,
      status: 'pending',
      oddsC1: odds1.oddsA,
      oddsC2: odds1.oddsB,
    },
    {
      id: 'qf-2',
      round: 'QF',
      name: 'Quarterfinal 2',
      matchIndex: 1,
      contestant1: { ...qf2A, odds: odds2.oddsA },
      contestant2: { ...qf2B, odds: odds2.oddsB },
      winner: null,
      status: 'pending',
      oddsC1: odds2.oddsA,
      oddsC2: odds2.oddsB,
    },
    {
      id: 'qf-3',
      round: 'QF',
      name: 'Quarterfinal 3',
      matchIndex: 2,
      contestant1: { ...qf3A, odds: odds3.oddsA },
      contestant2: { ...qf3B, odds: odds3.oddsB },
      winner: null,
      status: 'pending',
      oddsC1: odds3.oddsA,
      oddsC2: odds3.oddsB,
    },
    {
      id: 'qf-4',
      round: 'QF',
      name: 'Quarterfinal 4',
      matchIndex: 3,
      contestant1: { ...qf4A, odds: odds4.oddsA },
      contestant2: { ...qf4B, odds: odds4.oddsB },
      winner: null,
      status: 'pending',
      oddsC1: odds4.oddsA,
      oddsC2: odds4.oddsB,
    },
  ];

  const SF: TournamentMatch[] = [
    {
      id: 'sf-1',
      round: 'SF',
      name: 'Semifinal 1',
      matchIndex: 0,
      contestant1: null,
      contestant2: null,
      winner: null,
      status: 'pending',
      oddsC1: 2.0,
      oddsC2: 2.0,
    },
    {
      id: 'sf-2',
      round: 'SF',
      name: 'Semifinal 2',
      matchIndex: 1,
      contestant1: null,
      contestant2: null,
      winner: null,
      status: 'pending',
      oddsC1: 2.0,
      oddsC2: 2.0,
    },
  ];

  const GF: TournamentMatch[] = [
    {
      id: 'gf-1',
      round: 'GF',
      name: 'Grand Finals',
      matchIndex: 0,
      contestant1: null,
      contestant2: null,
      winner: null,
      status: 'pending',
      oddsC1: 2.0,
      oddsC2: 2.0,
    },
  ];

  return {
    rounds: { QF, SF, GF },
    currentRound: 'QF',
    activeMatchId: 'qf-1',
    champion: null,
    isComplete: false,
  };
}

export function advanceBracketWinner(
  bracket: TournamentBracket,
  matchId: string,
  winnerId: string
): {
  bracket: TournamentBracket;
  match: TournamentMatch;
  winner: TournamentContestant;
  isRoundComplete: boolean;
  isTournamentComplete: boolean;
} {
  const newBracket: TournamentBracket = {
    ...bracket,
    rounds: {
      QF: bracket.rounds.QF.map(m => ({ ...m })),
      SF: bracket.rounds.SF.map(m => ({ ...m })),
      GF: bracket.rounds.GF.map(m => ({ ...m })),
    },
  };

  // Find target match
  let targetMatch: TournamentMatch | undefined;
  let targetRound: TournamentRoundId = 'QF';

  for (const roundKey of ['QF', 'SF', 'GF'] as const) {
    const found = newBracket.rounds[roundKey].find(m => m.id === matchId);
    if (found) {
      targetMatch = found;
      targetRound = roundKey;
      break;
    }
  }

  if (!targetMatch) {
    throw new Error(`Match ${matchId} not found in tournament bracket`);
  }

  if (!targetMatch.contestant1 || !targetMatch.contestant2) {
    throw new Error(`Match ${matchId} does not have two active contestants`);
  }

  const c1 = targetMatch.contestant1;
  const c2 = targetMatch.contestant2;
  const winnerIsC1 = c1.id === winnerId;
  const winner = winnerIsC1 ? { ...c1, health: 100, score: c1.score + 1 } : { ...c2, health: 100, score: c2.score + 1 };
  const loser = winnerIsC1 ? { ...c2, eliminated: true } : { ...c1, eliminated: true };

  targetMatch.winner = winner;
  targetMatch.status = 'completed';
  if (winnerIsC1) {
    targetMatch.contestant1 = winner;
    targetMatch.contestant2 = loser;
  } else {
    targetMatch.contestant1 = loser;
    targetMatch.contestant2 = winner;
  }

  // Advance winner into next bracket slot
  if (targetRound === 'QF') {
    if (matchId === 'qf-1') {
      newBracket.rounds.SF[0].contestant1 = { ...winner };
    } else if (matchId === 'qf-2') {
      newBracket.rounds.SF[0].contestant2 = { ...winner };
    } else if (matchId === 'qf-3') {
      newBracket.rounds.SF[1].contestant1 = { ...winner };
    } else if (matchId === 'qf-4') {
      newBracket.rounds.SF[1].contestant2 = { ...winner };
    }

    // Recalculate SF match odds if both contestants are set
    const sf1 = newBracket.rounds.SF[0];
    if (sf1.contestant1 && sf1.contestant2) {
      const odds = computeMatchupOdds(sf1.contestant1, sf1.contestant2);
      sf1.oddsC1 = odds.oddsA;
      sf1.oddsC2 = odds.oddsB;
      sf1.contestant1.odds = odds.oddsA;
      sf1.contestant2.odds = odds.oddsB;
    }

    const sf2 = newBracket.rounds.SF[1];
    if (sf2.contestant1 && sf2.contestant2) {
      const odds = computeMatchupOdds(sf2.contestant1, sf2.contestant2);
      sf2.oddsC1 = odds.oddsA;
      sf2.oddsC2 = odds.oddsB;
      sf2.contestant1.odds = odds.oddsA;
      sf2.contestant2.odds = odds.oddsB;
    }
  } else if (targetRound === 'SF') {
    if (matchId === 'sf-1') {
      newBracket.rounds.GF[0].contestant1 = { ...winner };
    } else if (matchId === 'sf-2') {
      newBracket.rounds.GF[0].contestant2 = { ...winner };
    }

    // Recalculate GF match odds if both finalists are set
    const gf1 = newBracket.rounds.GF[0];
    if (gf1.contestant1 && gf1.contestant2) {
      const odds = computeMatchupOdds(gf1.contestant1, gf1.contestant2);
      gf1.oddsC1 = odds.oddsA;
      gf1.oddsC2 = odds.oddsB;
      gf1.contestant1.odds = odds.oddsA;
      gf1.contestant2.odds = odds.oddsB;
    }
  } else if (targetRound === 'GF') {
    newBracket.champion = winner;
    newBracket.isComplete = true;
  }

  // Check round completion
  const currentRoundMatches = newBracket.rounds[targetRound];
  const isRoundComplete = currentRoundMatches.every(m => m.status === 'completed');
  const isTournamentComplete = newBracket.isComplete;

  if (isRoundComplete) {
    if (targetRound === 'QF') {
      newBracket.currentRound = 'SF';
      newBracket.activeMatchId = 'sf-1';
    } else if (targetRound === 'SF') {
      newBracket.currentRound = 'GF';
      newBracket.activeMatchId = 'gf-1';
    }
  } else {
    // Move activeMatchId to next pending match in the round
    const nextPending = currentRoundMatches.find(m => m.status === 'pending');
    if (nextPending) {
      newBracket.activeMatchId = nextPending.id;
    }
  }

  return {
    bracket: newBracket,
    match: targetMatch,
    winner,
    isRoundComplete,
    isTournamentComplete,
  };
}
