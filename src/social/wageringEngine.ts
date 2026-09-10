import { TournamentContestant, TournamentMatch, TournamentRoundId } from './tournamentSimulator.ts';

export interface ActiveWager {
  id: string;
  round: TournamentRoundId;
  matchId: string;
  contestantId: string;
  contestantName: string;
  amount: number;
  odds: number;
  potentialPayout: number;
  status: 'active' | 'won' | 'lost';
  payout: number;
  timestamp: number;
}

export interface WagerResolution {
  settled: boolean;
  won: boolean;
  payout: number;
  wager: ActiveWager | null;
  summary: string;
}

export class WageringEngine {
  private currentWager: ActiveWager | null = null;
  private wagerHistory: ActiveWager[] = [];

  public getActiveWager(): ActiveWager | null {
    return this.currentWager;
  }

  public getWagerHistory(): ActiveWager[] {
    return [...this.wagerHistory];
  }

  public clearActiveWager(): void {
    this.currentWager = null;
  }

  public reset(): void {
    this.currentWager = null;
    this.wagerHistory = [];
  }

  /**
   * Places a per-round wager on a specific contestant in an active or upcoming match.
   */
  public placeRoundWager(
    round: TournamentRoundId,
    match: TournamentMatch,
    contestant: TournamentContestant,
    amount: number,
    playerBalance: number
  ): { success: boolean; error?: string; wager?: ActiveWager } {
    if (amount <= 0) {
      return { success: false, error: 'Wager amount must be greater than 0.' };
    }

    if (amount > playerBalance) {
      return { success: false, error: 'Insufficient Kinetic Points (KP) to cover wager.' };
    }

    if (this.currentWager && this.currentWager.status === 'active') {
      return { success: false, error: 'An active wager is already pending for this round.' };
    }

    // Determine odds for this contestant in the match
    let odds = contestant.odds;
    if (match.contestant1 && match.contestant1.id === contestant.id) {
      odds = match.oddsC1;
    } else if (match.contestant2 && match.contestant2.id === contestant.id) {
      odds = match.oddsC2;
    }

    const potentialPayout = Math.round(amount * odds);

    const wager: ActiveWager = {
      id: `wager_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      round,
      matchId: match.id,
      contestantId: contestant.id,
      contestantName: contestant.name,
      amount,
      odds,
      potentialPayout,
      status: 'active',
      payout: 0,
      timestamp: Date.now(),
    };

    this.currentWager = wager;
    return { success: true, wager };
  }

  /**
   * Backward-compatible placeWager for generic calls
   */
  public placeWager(
    contestant: TournamentContestant,
    amount: number,
    playerBalance: number
  ): { success: boolean; error?: string; wager?: ActiveWager } {
    const dummyMatch: TournamentMatch = {
      id: 'legacy-match',
      round: 'QF',
      name: 'Legacy Match',
      matchIndex: 0,
      contestant1: contestant,
      contestant2: null,
      winner: null,
      status: 'pending',
      oddsC1: contestant.odds,
      oddsC2: 2.0,
    };
    return this.placeRoundWager('QF', dummyMatch, contestant, amount, playerBalance);
  }

  /**
   * Resolves a wager on a completed match.
   */
  public settleMatchWager(matchId: string, winnerContestantId: string): WagerResolution {
    if (!this.currentWager || this.currentWager.status !== 'active') {
      return {
        settled: false,
        won: false,
        payout: 0,
        wager: null,
        summary: 'No active wager pending.',
      };
    }

    // Check if the current wager was placed on this match
    if (this.currentWager.matchId !== matchId && this.currentWager.matchId !== 'legacy-match') {
      return {
        settled: false,
        won: false,
        payout: 0,
        wager: this.currentWager,
        summary: 'Active wager is for a different match.',
      };
    }

    const won = this.currentWager.contestantId === winnerContestantId;
    const payout = won ? this.currentWager.potentialPayout : 0;

    const resolvedWager: ActiveWager = {
      ...this.currentWager,
      status: won ? 'won' : 'lost',
      payout,
    };

    this.wagerHistory.push(resolvedWager);
    this.currentWager = null;

    const summary = won
      ? `🎉 WAGER WON! [${resolvedWager.contestantName}] took victory! +${payout} KP awarded!`
      : `💀 WAGER LOST. [${resolvedWager.contestantName}] was eliminated.`;

    return {
      settled: true,
      won,
      payout,
      wager: resolvedWager,
      summary,
    };
  }

  /**
   * Backward-compatible resolveWager
   */
  public resolveWager(winnerContestantId: string): { won: boolean; payout: number } {
    const res = this.settleMatchWager(this.currentWager?.matchId || 'legacy-match', winnerContestantId);
    return { won: res.won, payout: res.payout };
  }
}
