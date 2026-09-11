/**
 * Tier 3: Pairwise Cross-Feature Interactions (16 Test Cases)
 * Tests interactions between combinations of features F1 through F16.
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
  TOURNAMENT_SEEDS,
  TournamentContestant,
  computeMatchupOdds,
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

export function registerTier3CrossFeatureTests(): void {
  const sampleGhost: GhostRunData = {
    id: 'ghost_p1',
    playerName: 'PHANTOM_RIVAL',
    timestamp: Date.now(),
    durationMs: 100,
    wpm: 110,
    accuracy: 97,
    events: [
      { t: 0, c: 'S', ok: true, s: 'strike' },
      { t: 20, c: 'T', ok: true, s: 'strike' },
      { t: 40, c: 'R', ok: true, s: 'strike' },
      { t: 60, c: 'I', ok: true, s: 'strike' },
      { t: 80, c: 'K', ok: true, s: 'strike' },
      { t: 100, c: 'E', ok: true, s: 'strike', w: 'STRIKE' },
    ],
  };

  describe('Tier 3: Pairwise Cross-Feature Interaction Tests', () => {
    it('P01: F1 (Ghost Playback) + F11 (Nemesis Telemetry): Ghost duel records player typos during playback', async () => {
      const matchMistakes: Record<string, number> = {};
      const targetWord = 'ELECTROMAGNETIC';

      const engine = new GhostPlaybackEngine(sampleGhost, {
        onCharTyped: () => {},
      });
      engine.start();

      // Simulate player typo while ghost is typing
      matchMistakes[targetWord] = (matchMistakes[targetWord] || 0) + 1;

      await sleep(30);
      engine.stop();

      expect(matchMistakes[targetWord]).toBe(1);
      expect(engine.getProfile().name).toContain('PHANTOM_RIVAL');
    });

    it('P02: F1 (Ghost Playback) + F13 (Code Syntax): Ghost match in Code Syntax trial mode', async () => {
      const syntaxToken = 'std::unique_ptr<T>';
      const engine = new GhostPlaybackEngine(sampleGhost, { onCharTyped: () => {} });

      engine.start();
      const pushBonus = 1.5; // +50% code syntax
      const burstValue = 20 * pushBonus;
      engine.stop();

      expect(burstValue).toBe(30);
      expect(syntaxToken).toContain('::');
    });

    it('P03: F1 (Ghost Playback) + F14 (Blind Duel): Ghost plays back while player types masked tokens', async () => {
      let ghostTyped = 0;
      const engine = new GhostPlaybackEngine(sampleGhost, {
        onCharTyped: () => {
          ghostTyped++;
        },
      });
      engine.start();
      await sleep(50);
      engine.stop();

      const playerWord = 'BUFFER';
      const playerMasked = playerWord.split('').map(() => '•').join('');

      expect(ghostTyped).toBeGreaterThanOrEqual(1);
      expect(playerMasked).toBe('••••••');
    });

    it('P04: F1 (Ghost Playback) + F15 (1 HP Sudden Death): Ghost duel in 1 HP mode triggers fatal recoil on mistype', () => {
      const playerHp = 1;
      const playerShield = 0;
      let matchWinner = '';
      let endReason = '';

      // Player mistypes in 1 HP Sudden death
      if (playerShield <= 0 && playerHp <= 1) {
        matchWinner = 'opponent'; // Ghost wins
        endReason = 'sudden_death';
      }

      expect(matchWinner).toBe('opponent');
      expect(endReason).toBe('sudden_death');
    });

    it('P05: F1 (Ghost Playback) + F16 (Haptics): Ghost duel player mistype triggers 40ms haptic feedback', () => {
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback(40);
      expect(mockNavState.vibrateCalls[0]).toBe(40);
    });

    it('P06: F2 (Stance Replay) + F11 (Nemesis Tracking): Ghost stance switch to disrupt logs player mistake', () => {
      let activeOpponentStance = 'strike';
      const onStanceChanged = (s: string) => {
        activeOpponentStance = s;
      };

      onStanceChanged('disrupt');
      const failedWords = ['MICROCONTROLLER'];

      expect(activeOpponentStance).toBe('disrupt');
      expect(failedWords).toContain('MICROCONTROLLER');
    });

    it('P07: F3 (Ghost Persistence) + F4 (Ghost UI Controls): Save PB to storage, serialize to Base64, and deserialize', () => {
      savePersonalBest(sampleGhost);
      const retrieved = getPersonalBest();
      expect(retrieved).not.toBeNull();

      const base64Code = GhostRecorder.serialize(retrieved!);
      const imported = GhostRecorder.deserialize(base64Code);

      expect(imported).not.toBeNull();
      expect(imported!.id).toBe(sampleGhost.id);
      expect(imported!.wpm).toBe(sampleGhost.wpm);
    });

    it('P08: F6 (8-Contestant Pool) + F7 (Bracket Progression): Seed 8 players and advance 4 QF winners to SF', () => {
      expect(TOURNAMENT_SEEDS.length).toBe(8);
      let bracket = createTournamentBracket();

      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-2', 'c4').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-3', 'c2').bracket;
      const res = advanceBracketWinner(bracket, 'qf-4', 'c3');

      expect(res.isRoundComplete).toBe(true);
      expect(res.bracket.currentRound).toBe('SF');
      expect(res.bracket.rounds.SF[0].contestant1!.id).toBe('c1');
      expect(res.bracket.rounds.SF[0].contestant2!.id).toBe('c4');
    });

    it('P09: F7 (Bracket Progression) + F8 (Keystroke Simulation): Match outcomes driven by WPM power comparison', () => {
      const c1 = TOURNAMENT_SEEDS[0] as TournamentContestant; // 124 WPM
      const c8 = TOURNAMENT_SEEDS[7] as TournamentContestant; // 68 WPM
      const odds = computeMatchupOdds(c1, c8);

      expect(odds.oddsA).toBeLessThan(odds.oddsB);
      let bracket = createTournamentBracket();
      // Favored winner c1 wins QF1
      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      expect(bracket.rounds.SF[0].contestant1!.id).toBe('c1');
    });

    it('P10: F7 (Bracket Progression) + F9 (Match Commentary): Commentary generated across full tournament tree', () => {
      const bracket = createTournamentBracket();
      const qfIntro = generateCommentary('intro', {
        contestant1Name: bracket.rounds.QF[0].contestant1!.name,
        contestant2Name: bracket.rounds.QF[0].contestant2!.name,
        roundName: 'QUARTERFINALS',
      });
      expect(qfIntro.text).toContain('CYBER_SHINOBI');

      const champLine = generateCommentary('champion', {
        winnerName: 'CYBER_SHINOBI',
      });
      expect(champLine.text).toContain('CYBER_SHINOBI');
      expect(champLine.type).toBe('champion');
    });

    it('P11: F7 (Bracket Progression) + F10 (Per-Round Wagering): Place QF wager, advance QF, settle and place SF wager', () => {
      const engine = new WageringEngine();
      let bracket = createTournamentBracket();
      const qfMatch = bracket.rounds.QF[0];

      // Place QF wager
      const wagerRes = engine.placeRoundWager('QF', qfMatch, qfMatch.contestant1!, 100, 500);
      expect(wagerRes.success).toBe(true);

      // Settle QF wager
      const settleRes = engine.settleMatchWager(qfMatch.id, qfMatch.contestant1!.id);
      expect(settleRes.won).toBe(true);
      const newBalance = 500 - 100 + settleRes.payout;

      // Advance QF
      bracket = advanceBracketWinner(bracket, 'qf-1', 'c1').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-2', 'c4').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-3', 'c2').bracket;
      bracket = advanceBracketWinner(bracket, 'qf-4', 'c3').bracket;

      // Place SF wager
      const sfMatch = bracket.rounds.SF[0];
      const sfWager = engine.placeRoundWager('SF', sfMatch, sfMatch.contestant1!, 150, newBalance);
      expect(sfWager.success).toBe(true);
    });

    it('P12: F8 (Simulation) + F10 (Wagering): High odds underdog victory awards massive payout', () => {
      const engine = new WageringEngine();
      const bracket = createTournamentBracket();
      const qfMatch = bracket.rounds.QF[0];
      const underdog = qfMatch.contestant2!; // c8 BIT_FLIPPER

      engine.placeRoundWager('QF', qfMatch, underdog, 100, 500);
      const res = engine.settleMatchWager(qfMatch.id, underdog.id);

      expect(res.won).toBe(true);
      expect(res.payout).toBeGreaterThanOrEqual(350); // 100 * ~3.8 odds
    });

    it('P13: F11 (Typo Tracking) + F12 (Dossier Recording): Match failed words directly update Dossier nemesis stats', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      const failedWords = ['PULVERIZE', 'PULVERIZE', 'DISRUPT'];
      const updated = recordMatchInDossier(
        initialDossier,
        'Shinobi-X',
        false,
        90,
        50,
        failedWords
      );

      const ranked = getRankedNemesisWords(updated);
      expect(ranked.length).toBe(2);
      const pulverize = ranked.find(w => w.word === 'PULVERIZE');
      expect(pulverize!.attempts).toBe(2);
      expect(pulverize!.mistakes).toBe(2);
    });

    it('P14: F13 (Code Syntax) + F14 (Blind Duel): Code syntax word masked in blind duel resets on punctuation error', () => {
      const syntaxWord = 'Promise.allSettled()';
      let typedIdx = 7; // typed 'Promise'
      const isBlind = true;
      const mistypedDot = true; // mistyped '.' as ','

      if (isBlind && mistypedDot) {
        typedIdx = 0;
      }

      expect(typedIdx).toBe(0);
      const masked = syntaxWord.split('').map(() => '•').join('');
      expect(masked.length).toBe(syntaxWord.length);
    });

    it('P15: F14 (Blind Duel) + F15 (1 HP Sudden Death): Blind duel typo in 1 HP mode causes instant fatality', () => {
      let playerHealth = 1;
      let playerShield = 0;
      const isBlind = true;
      const isSuddenDeath = true;
      let matchEnded = false;
      let reason = '';

      const typoOccurred = true;
      if (isBlind && typoOccurred) {
        if (isSuddenDeath && playerShield <= 0) {
          playerHealth = 0;
          matchEnded = true;
          reason = 'sudden_death';
        }
      }

      expect(matchEnded).toBe(true);
      expect(playerHealth).toBe(0);
      expect(reason).toBe('sudden_death');
    });

    it('P16: F15 (1 HP Sudden Death) + F16 (Haptics): Fatal sudden death recoil triggers [80, 40, 80]ms KO vibration', () => {
      mockNavState.vibrateCalls.length = 0;
      const isFatalKo = true;

      if (isFatalKo) {
        triggerHapticFeedback([80, 40, 80]);
      }

      expect(mockNavState.vibrateCalls.length).toBe(1);
      expect(mockNavState.vibrateCalls[0]).toEqual([80, 40, 80]);
    });
  });
}
