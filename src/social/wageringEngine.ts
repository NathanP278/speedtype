import { TournamentContestant } from './tournamentSimulator.ts';

export interface ActiveWager {
  contestantId: string;
  contestantName: string;
  amount: number;
  odds: number;
  potentialPayout: number;
}

export class WageringEngine {
  private currentWager: ActiveWager | null = null;

  public getActiveWager(): ActiveWager | null {
    return this.currentWager;
  }

  public placeWager(
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

    const potentialPayout = Math.round(amount * contestant.odds);

    const wager: ActiveWager = {
      contestantId: contestant.id,
      contestantName: contestant.name,
      amount,
      odds: contestant.odds,
      potentialPayout,
    };

    this.currentWager = wager;
    return { success: true, wager };
  }

  public resolveWager(winnerContestantId: string): { won: boolean; payout: number } {
    if (!this.currentWager) return { won: false, payout: 0 };

    const won = this.currentWager.contestantId === winnerContestantId;
    const payout = won ? this.currentWager.potentialPayout : 0;

    this.currentWager = null;
    return { won, payout };
  }
}
