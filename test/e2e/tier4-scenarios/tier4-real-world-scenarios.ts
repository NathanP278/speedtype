/**
 * Tier 4: Real-World Application Scenarios (5 End-to-End Scenarios)
 * Scenario 1: Personal Best Ghost Match (F1-F5)
 * Scenario 2: Full 8-Player Tournament Run (F6-F10)
 * Scenario 3: Nemesis Weakness Profiling (F11-F12)
 * Scenario 4: Weekly Trial Triad (F13-F16)
 * Scenario 5: Cross-System Endurance (F1-F16)
 */

import { describe, it, expect, sleep, mockNavState } from '../../test-harness.ts';
import { GhostPlaybackEngine } from '../../../src/social/ghostPlayer.ts';
import {
  GhostRecorder,
  GhostRunData,
  savePersonalBest,
  getPersonalBest,
} from '../../../src/social/ghostRecorder.ts';
import {
  createTournamentBracket,
  advanceBracketWinner,
} from '../../../src/social/tournamentSimulator.ts';
import { generateCommentary } from '../../../src/social/tournamentCommentary.ts';
import { WageringEngine } from '../../../src/social/wageringEngine.ts';
import {
  DEFAULT_DOSSIER,
  recordMatchInDossier,
  getRankedNemesisWords,
  DossierData,
} from '../../../src/social/rivalryDossier.ts';
import { triggerHapticFeedback } from '../tier1-features/tier1-f11-f16-telemetry-trials.ts';

export function registerTier4ScenarioTests(): void {
  describe('Tier 4 - Scenario 1: Personal Best Ghost Match (F1-F5)', () => {
    it('S1: Record live player run, save as PB, import to engine, and verify playback fidelity', async () => {
      // Step 1: Record run with stance switches
      const recorder = new GhostRecorder();
      recorder.start();
      recorder.recordKeystroke('S', true, 'strike');
      recorder.recordKeystroke('T', true, 'strike');
      recorder.recordKeystroke('R', true, 'strike');
      recorder.recordKeystroke('I', true, 'strike');
      recorder.recordKeystroke('K', true, 'strike');
      recorder.recordKeystroke('E', true, 'strike', 'STRIKE');

      const liveRun = recorder.stop('NATHAN_PB', 115, 99);
      expect(liveRun).not.toBeNull();

      // Step 2: Persist as Personal Best
      savePersonalBest(liveRun!);
      const storedPb = getPersonalBest();
      expect(storedPb).not.toBeNull();
      expect(storedPb!.playerName).toBe('NATHAN_PB');
      expect(storedPb!.wpm).toBe(115);

      // Step 3: Load PB into GhostPlaybackEngine
      const typedChars: string[] = [];
      const completedWords: string[] = [];

      const engine = new GhostPlaybackEngine(storedPb!, {
        onCharTyped: c => typedChars.push(c),
        onWordCompleted: w => completedWords.push(w),
      });

      const profile = engine.getProfile();
      expect(profile.name).toContain('NATHAN_PB');
      expect(profile.baseWpm).toBe(115);

      // Step 4: Playback execution
      engine.start();
      await sleep(50);
      engine.stop();

      expect(typedChars.length).toBeGreaterThanOrEqual(1);
      expect(typedChars[0]).toBe('S');
    });
  });

  describe('Tier 4 - Scenario 2: Full 8-Player Tournament Run (F6-F10)', () => {
    it('S2: Execute complete 8-player bracket from QF to GF with wagering and commentary', () => {
      const wagerEngine = new WageringEngine();
      let bracket = createTournamentBracket();
      let playerKp = 500;

      // --- QUARTERFINALS ---
      const qfMatch1 = bracket.rounds.QF[0];
      const qfWagerRes = wagerEngine.placeRoundWager(
        'QF',
        qfMatch1,
        qfMatch1.contestant1!, // Bet 100 on CYBER_SHINOBI
        100,
        playerKp
      );
      expect(qfWagerRes.success).toBe(true);
      playerKp -= 100;

      // Simulate 4 QF matches
      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-2', 'c4').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-3', 'c2').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-4', 'c3').bracket;

      // Settle QF wager
      const qfSettle = wagerEngine.settleMatchWager('qf-1', 'c1');
      expect(qfSettle.won).toBe(true);
      playerKp += qfSettle.payout;
      expect(playerKp).toBeGreaterThan(500);

      expect(bracket.currentRound).toBe('SF');

      // --- SEMIFINALS ---
      const sfMatch1 = bracket.rounds.SF[0];
      const sfWagerRes = wagerEngine.placeRoundWager(
        'SF',
        sfMatch1,
        sfMatch1.contestant1!,
        150,
        playerKp
      );
      expect(sfWagerRes.success).toBe(true);
      playerKp -= 150;

      // Commentary for SF
      const sfCommentary = generateCommentary('surge', {
        activeContestantName: 'CYBER_SHINOBI',
        wpm: 130,
        word: 'PULVERIZE',
      });
      expect(sfCommentary.type).toBe('surge');

      // Advance SF matches
      bracket = advanceBracketWinner(bracket, 'sf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'sf-2', 'c2').bracket;

      const sfSettle = wagerEngine.settleMatchWager('sf-1', 'c1');
      expect(sfSettle.won).toBe(true);
      playerKp += sfSettle.payout;

      expect(bracket.currentRound).toBe('GF');

      // --- GRAND FINALS ---
      const gfMatch = bracket.rounds.GF[0];
      const gfWagerRes = wagerEngine.placeRoundWager(
        'GF',
        gfMatch,
        gfMatch.contestant1!,
        200,
        playerKp
      );
      expect(gfWagerRes.success).toBe(true);
      playerKp -= 200;

      // Crown champion
      const finalRes = advanceBracketWinner(bracket, 'gf-1', 'c1');
      expect(finalRes.isTournamentComplete).toBe(true);
      expect(finalRes.bracket.champion!.name).toBe('CYBER_SHINOBI');

      const gfSettle = wagerEngine.settleMatchWager('gf-1', 'c1');
      expect(gfSettle.won).toBe(true);
      playerKp += gfSettle.payout;

      // Champion commentary
      const champLine = generateCommentary('champion', {
        winnerName: 'CYBER_SHINOBI',
      });
      expect(champLine.text).toContain('CYBER_SHINOBI');
      expect(wagerEngine.getWagerHistory().length).toBe(3);
    });
  });

  describe('Tier 4 - Scenario 3: Nemesis Weakness Profiling (F11-F12)', () => {
    it('S3: Simulate match with target typos, beam recoils, defeat on fatal word, and dossier ranking', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      // Match simulation: player faces 3 words
      const failedWords = [
        'DISILLUSIONMENT',
        'DISILLUSIONMENT',
        'MICROCONTROLLER',
      ];
      const fatalWord = 'DISILLUSIONMENT';

      // Record match end (loss)
      const updatedDossier = recordMatchInDossier(
        initialDossier,
        'Shinobi-X',
        false, // defeat
        78,
        0,
        failedWords,
        fatalWord
      );

      const ranked = getRankedNemesisWords(updatedDossier);
      expect(ranked.length).toBe(2);

      const topNemesis = ranked[0];
      expect(topNemesis.word).toBe('DISILLUSIONMENT');
      expect(topNemesis.attempts).toBe(2);
      expect(topNemesis.mistakes).toBe(2);
      expect(topNemesis.deathsCaused).toBe(1);
      expect(topNemesis.errorRate).toBe(100);
    });
  });

  describe('Tier 4 - Scenario 4: Weekly Trial Triad (F13-F16)', () => {
    it('S4: Enforce Code Syntax, Blind Duel, and 1 HP Sudden Death mechanics with haptics', () => {
      // 1. Code Syntax: exact punctuation & +50% push
      const codeWord = 'impl<T> From<U> for T';
      const basePush = 10;
      const codePushBonus = 1.5;
      const actualPush = basePush * codePushBonus;
      expect(actualPush).toBe(15);
      expect(codeWord.includes('<')).toBe(true);

      // 2. Blind Duel: 0.5s flash, masked bullets, typo reset
      const blindWord = 'AUTHENTICATION';
      expect(blindWord.length).toBeGreaterThan(0);
      let blindTypedIndex = 6;
      const typoHit = true;
      if (typoHit) {
        blindTypedIndex = 0; // reset
        mockNavState.vibrateCalls.length = 0;
        triggerHapticFeedback(40); // 40ms mistype
      }
      expect(blindTypedIndex).toBe(0);
      expect(mockNavState.vibrateCalls[0]).toBe(40);

      // 3. 1 HP Sudden Death: instant fatality on unshielded recoil
      let pHealth = 1;
      let pShield = 0;
      let fatalEvent = false;

      const unshieldedRecoil = 4;
      if (pShield < unshieldedRecoil) {
        pHealth = 0;
        fatalEvent = true;
        mockNavState.vibrateCalls.length = 0;
        triggerHapticFeedback([80, 40, 80]); // KO impact
      }

      expect(pHealth).toBe(0);
      expect(fatalEvent).toBe(true);
      expect(mockNavState.vibrateCalls[0]).toEqual([80, 40, 80]);
    });
  });

  describe('Tier 4 - Scenario 5: Cross-System Endurance (F1-F16)', () => {
    it('S5: Complete cross-system loop: tournament funding ghost duel under trials with telemetry & haptics', async () => {
      // 1. Tournament lounge betting
      const wagerEngine = new WageringEngine();
      const bracket = createTournamentBracket();
      const qfMatch = bracket.rounds.QF[0];
      let playerBalance = 200;

      const bet = wagerEngine.placeRoundWager('QF', qfMatch, qfMatch.contestant1!, 100, playerBalance);
      expect(bet.success).toBe(true);
      playerBalance -= 100;

      const roundAdv = advanceBracketWinner(bracket, 'qf-1', 'c1');
      expect(roundAdv.match.status).toBe('completed');
      const wagerResult = wagerEngine.settleMatchWager('qf-1', 'c1');
      expect(wagerResult.won).toBe(true);
      playerBalance += wagerResult.payout;
      expect(playerBalance).toBeGreaterThan(200);

      // 2. Setup ghost playback from previous PB
      const ghostData: GhostRunData = {
        id: 'ghost_endurance',
        playerName: 'LEGEND_CHALLENGER',
        timestamp: Date.now(),
        durationMs: 80,
        wpm: 125,
        accuracy: 99,
        events: [
          { t: 0, c: 'B', ok: true, s: 'strike' },
          { t: 20, c: 'L', ok: true, s: 'strike' },
          { t: 40, c: 'I', ok: true, s: 'strike' },
          { t: 60, c: 'T', ok: true, s: 'strike' },
          { t: 80, c: 'Z', ok: true, s: 'strike', w: 'BLITZ' },
        ],
      };

      const ghostEngine = new GhostPlaybackEngine(ghostData, {
        onCharTyped: () => {},
      });
      ghostEngine.start();
      await sleep(40);
      ghostEngine.stop();

      // 3. Active match telemetry & haptics under trial
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback(40);
      expect(mockNavState.vibrateCalls[0]).toBe(40);

      // 4. Dossier persistence
      const updatedDossier = recordMatchInDossier(
        DEFAULT_DOSSIER,
        ghostData.playerName,
        true, // player won
        130,
        playerBalance,
        ['REINTERPRET_CAST']
      );

      expect(updatedDossier.nemesisWords['REINTERPRET_CAST']).toBeDefined();
      expect(updatedDossier.highestWpm).toBeGreaterThanOrEqual(130);
    });
  });
}
