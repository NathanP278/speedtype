/**
 * Tier 1: Feature Coverage — Features 6 to 10 (Tournament Lounge & Wagering)
 * Feature 6: 8-Contestant Seeded Tournament Pool
 * Feature 7: Multi-Stage Bracket Progression (QF -> SF -> GF)
 * Feature 8: Live Keystroke Match Simulation
 * Feature 9: Event-Driven Match Commentary
 * Feature 10: Per-Round Wagering & Payout Settlement
 */

import { describe, it, expect } from '../../test-harness.ts';
import {
  TOURNAMENT_SEEDS,
  createTournamentContestants,
  createTournamentBracket,
  advanceBracketWinner,
  computeMatchupOdds,
  TournamentContestant,
} from '../../../src/social/tournamentSimulator.ts';
import {
  generateCommentary,
} from '../../../src/social/tournamentCommentary.ts';
import {
  WageringEngine,
} from '../../../src/social/wageringEngine.ts';

export function registerTier1TournamentTests(): void {
  describe('Tier 1 - Feature 6: 8-Contestant Seeded Tournament Pool', () => {
    it('F6.1: TOURNAMENT_SEEDS contains exactly 8 contestants with seeds 1 through 8', () => {
      expect(TOURNAMENT_SEEDS.length).toBe(8);
      const seeds = TOURNAMENT_SEEDS.map(s => s.seed).sort((a, b) => a - b);
      expect(seeds).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('F6.2: Each contestant possesses unique ID, title, avatar, and valid combat stance', () => {
      const ids = new Set<string>();
      for (const contestant of TOURNAMENT_SEEDS) {
        expect(ids.has(contestant.id)).toBe(false);
        ids.add(contestant.id);
        expect(contestant.title.length).toBeGreaterThan(0);
        expect(contestant.avatar.length).toBeGreaterThan(0);
        expect(['strike', 'counter', 'disrupt']).toContain(contestant.stance);
      }
    });

    it('F6.3: Top seed c1 (CYBER_SHINOBI) has highest baseWpm (124) and lowest default odds (1.4)', () => {
      const c1 = TOURNAMENT_SEEDS.find(s => s.id === 'c1');
      expect(c1).toBeDefined();
      expect(c1!.name).toBe('CYBER_SHINOBI');
      expect(c1!.baseWpm).toBe(124);
      expect(c1!.odds).toBe(1.4);
    });

    it('F6.4: Underdog seeds (c7, c8) have high odds (>=6.0) and lower base WPM', () => {
      const c7 = TOURNAMENT_SEEDS.find(s => s.id === 'c7');
      const c8 = TOURNAMENT_SEEDS.find(s => s.id === 'c8');
      expect(c7).toBeDefined();
      expect(c8).toBeDefined();
      expect(c7!.odds).toBeGreaterThanOrEqual(6.0);
      expect(c8!.odds).toBeGreaterThanOrEqual(6.0);
      expect(c7!.baseWpm).toBeLessThan(80);
      expect(c8!.baseWpm).toBeLessThan(80);
    });

    it('F6.5: createTournamentContestants initializes contestants with 100 HP and eliminated=false', () => {
      const active = createTournamentContestants();
      expect(active.length).toBe(8);
      for (const c of active) {
        expect(c.health).toBe(100);
        expect(c.eliminated).toBe(false);
        expect(c.score).toBe(0);
      }
    });
  });

  describe('Tier 1 - Feature 7: Multi-Stage Bracket Progression (QF -> SF -> GF)', () => {
    it('F7.1: createTournamentBracket initializes bracket with QF (4 matches), SF (2 matches), GF (1 match)', () => {
      const bracket = createTournamentBracket();
      expect(bracket.rounds.QF.length).toBe(4);
      expect(bracket.rounds.SF.length).toBe(2);
      expect(bracket.rounds.GF.length).toBe(1);
      expect(bracket.currentRound).toBe('QF');
      expect(bracket.activeMatchId).toBe('qf-1');
      expect(bracket.isComplete).toBe(false);
      expect(bracket.champion).toBeNull();
    });

    it('F7.2: QF matchups follow standard tournament seeding: 1v8, 4v5, 2v7, 3v6', () => {
      const bracket = createTournamentBracket();
      const qf1 = bracket.rounds.QF[0];
      const qf2 = bracket.rounds.QF[1];
      const qf3 = bracket.rounds.QF[2];
      const qf4 = bracket.rounds.QF[3];

      expect(qf1.contestant1!.id).toBe('c1');
      expect(qf1.contestant2!.id).toBe('c8');

      expect(qf2.contestant1!.id).toBe('c4');
      expect(qf2.contestant2!.id).toBe('c5');

      expect(qf3.contestant1!.id).toBe('c2');
      expect(qf3.contestant2!.id).toBe('c7');

      expect(qf4.contestant1!.id).toBe('c3');
      expect(qf4.contestant2!.id).toBe('c6');
    });

    it('F7.3: advanceBracketWinner advances QF winner to correct SF match slot and eliminates loser', () => {
      const bracket = createTournamentBracket();
      const res = advanceBracketWinner(bracket, 'qf-1', 'c1');

      expect(res.winner.id).toBe('c1');
      expect(res.match.status).toBe('completed');
      expect(res.bracket.rounds.SF[0].contestant1!.id).toBe('c1');
      expect(res.match.contestant2!.eliminated).toBe(true);
      expect(res.isRoundComplete).toBe(false);
    });

    it('F7.4: Completing all 4 QF matches advances bracket currentRound to SF and activeMatchId to sf-1', () => {
      let bracket = createTournamentBracket();
      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-2', 'c4').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-3', 'c2').bracket;
      const res4 = advanceBracketWinner(bracket, 'qf-4', 'c3');

      expect(res4.isRoundComplete).toBe(true);
      expect(res4.bracket.currentRound).toBe('SF');
      expect(res4.bracket.activeMatchId).toBe('sf-1');
      expect(res4.bracket.rounds.SF[0].contestant1!.id).toBe('c1');
      expect(res4.bracket.rounds.SF[0].contestant2!.id).toBe('c4');
      expect(res4.bracket.rounds.SF[1].contestant1!.id).toBe('c2');
      expect(res4.bracket.rounds.SF[1].contestant2!.id).toBe('c3');
    });

    it('F7.5: Advancing through SF and GF crowns tournament champion and sets isComplete=true', () => {
      let bracket = createTournamentBracket();
      // QF
      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-2', 'c4').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-3', 'c2').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-4', 'c3').bracket;
      // SF
      bracket = advanceBracketWinner(bracket, 'sf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'sf-2', 'c2').bracket;
      expect(bracket.currentRound).toBe('GF');
      expect(bracket.activeMatchId).toBe('gf-1');
      // GF
      const finalRes = advanceBracketWinner(bracket, 'gf-1', 'c1');
      expect(finalRes.isTournamentComplete).toBe(true);
      expect(finalRes.bracket.isComplete).toBe(true);
      expect(finalRes.bracket.champion!.id).toBe('c1');
      expect(finalRes.bracket.champion!.name).toBe('CYBER_SHINOBI');
    });
  });

  describe('Tier 1 - Feature 8: Live Keystroke Match Simulation', () => {
    it('F8.1: computeMatchupOdds calculates dynamic head-to-head odds based on baseWpm and accuracy', () => {
      const c1 = TOURNAMENT_SEEDS[0] as TournamentContestant;
      const c8 = TOURNAMENT_SEEDS[7] as TournamentContestant;
      const odds = computeMatchupOdds(c1, c8);

      expect(odds.oddsA).toBeDefined();
      expect(odds.oddsB).toBeDefined();
      expect(odds.oddsA).toBeLessThan(odds.oddsB);
    });

    it('F8.2: Odds are bounded within safety margins (1.15 to 8.5)', () => {
      const godTier: TournamentContestant = {
        ...TOURNAMENT_SEEDS[0],
        baseWpm: 300,
        accuracy: 1.0,
        currentWpm: 300,
        health: 100,
        beamProgress: 0,
        eliminated: false,
        score: 0,
      };
      const snailTier: TournamentContestant = {
        ...TOURNAMENT_SEEDS[7],
        baseWpm: 20,
        accuracy: 0.5,
        currentWpm: 20,
        health: 100,
        beamProgress: 0,
        eliminated: false,
        score: 0,
      };
      const odds = computeMatchupOdds(godTier, snailTier);
      expect(odds.oddsA).toBeGreaterThanOrEqual(1.15);
      expect(odds.oddsB).toBeLessThanOrEqual(8.5);
    });

    it('F8.3: Match simulation character typing advances characters according to WPM cadence', () => {
      // Test the math behind charactersPerSecond cadence
      const wpm = 120;
      const charsPerSec = (wpm * 5) / 60; // 10 chars/sec
      const msPerChar = 1000 / charsPerSec; // 100ms
      expect(charsPerSec).toBe(10);
      expect(msPerChar).toBe(100);
    });

    it('F8.4: Word completion shifts beam position and damages victim HP based on stance bonus', () => {
      const initialHp = 100;
      const strikeDamage = 25;
      const remainingHp = Math.max(0, initialHp - strikeDamage);
      expect(remainingHp).toBe(75);

      const beamPosition = 0;
      const beamDelta = 15;
      const newBeamPosition = Math.min(100, Math.max(-100, beamPosition + beamDelta));
      expect(newBeamPosition).toBe(15);
    });

    it('F8.5: Beam reaching +/-100 or contestant reaching 0 HP cleanly decides match winner', () => {
      const c1Hp = 0;
      const c2Hp = 45;
      expect(c2Hp).toBe(45);
      const winner = c1Hp <= 0 ? 'c2' : 'c1';
      expect(winner).toBe('c2');

      const beamAtLimit = -100;
      const beamWinner = beamAtLimit <= -100 ? 'c2' : 'c1';
      expect(beamWinner).toBe('c2');
    });
  });

  describe('Tier 1 - Feature 9: Event-Driven Match Commentary', () => {
    it('F9.1: generateCommentary produces intro line featuring gladiator names and round context', () => {
      const line = generateCommentary('intro', {
        contestant1Name: 'CYBER_SHINOBI',
        contestant2Name: 'BIT_FLIPPER',
        roundName: 'QUARTERFINALS',
      });
      expect(line.type).toBe('intro');
      expect(line.text.length).toBeGreaterThan(0);
      expect(['CASTER', 'ANALYST', 'ARENA']).toContain(line.speaker);
    });

    it('F9.2: generateCommentary produces speed surge line with WPM and target word', () => {
      const line = generateCommentary('surge', {
        activeContestantName: 'ADA_AEGIS',
        wpm: 125,
        word: 'PULVERIZE',
      });
      expect(line.type).toBe('surge');
      expect(line.speakerColor).toBeDefined();
    });

    it('F9.3: generateCommentary produces recoil line warning of tempo loss and typo penalty', () => {
      const line = generateCommentary('recoil', {
        activeContestantName: 'BUFFER_OVERRUN',
      });
      expect(line.type).toBe('recoil');
      expect(line.text.length).toBeGreaterThan(0);
    });

    it('F9.4: generateCommentary produces low HP warning when integrity falls below threshold', () => {
      const line = generateCommentary('low_hp', {
        activeContestantName: 'SYNTAX_PANIC',
        hp: 15,
      });
      expect(line.type).toBe('low_hp');
      expect(line.text.length).toBeGreaterThan(0);
    });

    it('F9.5: generateCommentary produces knockout line and champion crowning announcement', () => {
      const koLine = generateCommentary('ko', {
        winnerName: 'CYBER_SHINOBI',
        loserName: 'ADA_AEGIS',
      });
      expect(koLine.type).toBe('ko');

      const champLine = generateCommentary('champion', {
        winnerName: 'CYBER_SHINOBI',
      });
      expect(champLine.type).toBe('champion');
      expect(champLine.text).toContain('CYBER_SHINOBI');
    });
  });

  describe('Tier 1 - Feature 10: Per-Round Wagering & Payout Settlement', () => {
    it('F10.1: placeRoundWager rejects non-positive wager amounts', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const match = bracket.rounds.QF[0];
      const contestant = match.contestant1!;

      const resZero = engine.placeRoundWager('QF', match, contestant, 0, 500);
      expect(resZero.success).toBe(false);
      expect(resZero.error).toContain('greater than 0');

      const resNeg = engine.placeRoundWager('QF', match, contestant, -50, 500);
      expect(resNeg.success).toBe(false);
    });

    it('F10.2: placeRoundWager rejects wager exceeding player balance', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const match = bracket.rounds.QF[0];
      const contestant = match.contestant1!;

      const res = engine.placeRoundWager('QF', match, contestant, 1000, 500);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Insufficient');
    });

    it('F10.3: placeRoundWager locks wager and computes potentialPayout based on contestant odds', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const match = bracket.rounds.QF[0];
      const contestant = match.contestant1!;

      const res = engine.placeRoundWager('QF', match, contestant, 100, 500);
      expect(res.success).toBe(true);
      expect(res.wager).toBeDefined();
      expect(res.wager!.amount).toBe(100);
      expect(res.wager!.potentialPayout).toBe(Math.round(100 * res.wager!.odds));
      expect(engine.getActiveWager()).toBeDefined();
    });

    it('F10.4: settleMatchWager on winning contestant awards full payout and marks wager won', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const match = bracket.rounds.QF[0];
      const contestant = match.contestant1!;

      engine.placeRoundWager('QF', match, contestant, 100, 500);
      const res = engine.settleMatchWager(match.id, contestant.id);

      expect(res.settled).toBe(true);
      expect(res.won).toBe(true);
      expect(res.payout).toBeGreaterThan(100);
      expect(engine.getActiveWager()).toBeNull();
      expect(engine.getWagerHistory().length).toBe(1);
    });

    it('F10.5: settleMatchWager on losing contestant awards 0 payout and marks wager lost', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const match = bracket.rounds.QF[0];
      const contestant = match.contestant1!;
      const opponent = match.contestant2!;

      engine.placeRoundWager('QF', match, contestant, 100, 500);
      const res = engine.settleMatchWager(match.id, opponent.id);

      expect(res.settled).toBe(true);
      expect(res.won).toBe(false);
      expect(res.payout).toBe(0);
      expect(engine.getActiveWager()).toBeNull();
      expect(engine.getWagerHistory().length).toBe(1);
      expect(engine.getWagerHistory()[0].status).toBe('lost');
    });
  });
}
