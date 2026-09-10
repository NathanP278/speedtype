/**
 * Unit & Integration Test Suite for R3: Live Nemesis Words Telemetry Collection
 */

import { describe, it, expect, runAllRegisteredSuites, resetSuites } from './test-harness.ts';
import { NemesisTelemetryTracker } from '../src/engine/nemesisTelemetry.ts';
import {
  DEFAULT_DOSSIER,
  recordMatchInDossier,
  getRankedNemesisWords,
} from '../src/social/rivalryDossier.ts';
import type { DossierData } from '../src/social/rivalryDossier.ts';
import type { MatchResult } from '../src/types/combat.ts';

export function registerR3TelemetryTests(): void {
  describe('R3: Nemesis Telemetry Tracker In-Match Word Tracking', () => {
    it('initializes in clean state and records assigned words', () => {
      const tracker = new NemesisTelemetryTracker();
      expect(tracker.getFailedWords().length).toBe(0);
      expect(tracker.getWordsAttempted().length).toBe(0);
      expect(tracker.getActiveWord()).toBeNull();

      tracker.setActiveWord('PARALLEL_EXECUTION');
      expect(tracker.getActiveWord()).toBe('PARALLEL_EXECUTION');
      expect(tracker.getWordsAttempted()).toContain('PARALLEL_EXECUTION');
      expect(tracker.getFailedWords().length).toBe(0);
    });

    it('records mistypes against the active word without altering clean words', () => {
      const tracker = new NemesisTelemetryTracker();
      tracker.setActiveWord('CLEAN_WORD');
      // No mistype on CLEAN_WORD

      tracker.setActiveWord('DISILLUSIONMENT');
      tracker.recordMistype();
      tracker.recordMistype();

      const failed = tracker.getFailedWords();
      expect(failed.length).toBe(2);
      expect(failed[0]).toBe('DISILLUSIONMENT');
      expect(failed[1]).toBe('DISILLUSIONMENT');
      expect(failed).not.toContain('CLEAN_WORD');

      const stats = tracker.getWordStats('DISILLUSIONMENT');
      expect(stats).toBeDefined();
      expect(stats!.mistakes).toBe(2);
      expect(stats!.recoils).toBe(0);
    });

    it('records recoil events on word', () => {
      const tracker = new NemesisTelemetryTracker();
      tracker.setActiveWord('MICROCONTROLLER');
      tracker.recordRecoil();

      const stats = tracker.getWordStats('MICROCONTROLLER');
      expect(stats).toBeDefined();
      expect(stats!.recoils).toBe(1);
      expect(tracker.getFailedWords()).toContain('MICROCONTROLLER');
    });

    it('records fatal defeat word at match conclusion', () => {
      const tracker = new NemesisTelemetryTracker();
      tracker.setActiveWord('ELECTROMAGNETIC');
      tracker.recordFatalDefeat();

      expect(tracker.getFatalWord()).toBe('ELECTROMAGNETIC');
    });

    it('clears all telemetry state on reset()', () => {
      const tracker = new NemesisTelemetryTracker();
      tracker.setActiveWord('TEMPORARY_WORD');
      tracker.recordMistype();
      tracker.recordFatalDefeat();
      expect(tracker.getFailedWords().length).toBe(1);

      tracker.reset();
      expect(tracker.getFailedWords().length).toBe(0);
      expect(tracker.getWordsAttempted().length).toBe(0);
      expect(tracker.getActiveWord()).toBeNull();
      expect(tracker.getFatalWord()).toBeUndefined();
    });
  });

  describe('R3: Dossier Recording & Anti-Duplicate Skew Validation', () => {
    it('cleanly adds new nemesis word without duplicate attempt skew when multiple typos occur', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      // 3 typos on the same word during 1 match
      const failedWords = ['ASYNC_AWAIT', 'ASYNC_AWAIT', 'ASYNC_AWAIT'];

      const updated = recordMatchInDossier(
        initialDossier,
        'Shinobi-X',
        true,
        90,
        150,
        failedWords
      );

      const entry = updated.nemesisWords['ASYNC_AWAIT'];
      expect(entry).toBeDefined();
      // Attempts MUST be 1, NOT 3!
      expect(entry.attempts).toBe(1);
      // Mistakes MUST be 3
      expect(entry.mistakes).toBe(3);
      // Win means 0 deaths caused
      expect(entry.deathsCaused).toBe(0);
    });

    it('attributes death ONLY to fatalWord when player suffers defeat with multiple failed words', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          EARLY_MISTAKE: { attempts: 2, mistakes: 2, deathsCaused: 0 },
          FATAL_TOKEN: { attempts: 1, mistakes: 1, deathsCaused: 0 },
        },
      };

      const updated = recordMatchInDossier(
        initialDossier,
        'Glitch-Daemon',
        false, // defeat
        75,
        50,
        ['EARLY_MISTAKE', 'FATAL_TOKEN'],
        'FATAL_TOKEN' // fatalWord explicitly passed
      );

      // EARLY_MISTAKE suffered a typo, but did NOT cause death
      expect(updated.nemesisWords['EARLY_MISTAKE'].attempts).toBe(3);
      expect(updated.nemesisWords['EARLY_MISTAKE'].mistakes).toBe(3);
      expect(updated.nemesisWords['EARLY_MISTAKE'].deathsCaused).toBe(0);

      // FATAL_TOKEN caused the death
      expect(updated.nemesisWords['FATAL_TOKEN'].attempts).toBe(2);
      expect(updated.nemesisWords['FATAL_TOKEN'].mistakes).toBe(2);
      expect(updated.nemesisWords['FATAL_TOKEN'].deathsCaused).toBe(1);
    });

    it('records fatal word even if fatal knockout occurred before player mistyped on it', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      // Player had typo on WORD_1, then was hit by lethal opponent beam while active on WORD_2
      const updated = recordMatchInDossier(
        initialDossier,
        'Ada-01',
        false,
        85,
        30,
        ['WORD_1'],
        'WORD_2'
      );

      expect(updated.nemesisWords['WORD_1'].deathsCaused).toBe(0);
      expect(updated.nemesisWords['WORD_2']).toBeDefined();
      expect(updated.nemesisWords['WORD_2'].attempts).toBe(1);
      expect(updated.nemesisWords['WORD_2'].mistakes).toBe(0);
      expect(updated.nemesisWords['WORD_2'].deathsCaused).toBe(1);
    });

    it('correctly ranks nemesis words by lethality and error rate percentage', () => {
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          FREQUENT_TYPO: { attempts: 10, mistakes: 8, deathsCaused: 0 },
          LETHAL_BOSS: { attempts: 2, mistakes: 2, deathsCaused: 2 },
          OCCASIONAL: { attempts: 10, mistakes: 2, deathsCaused: 0 },
        },
      };

      const ranked = getRankedNemesisWords(dossier);
      expect(ranked.length).toBe(3);
      // LETHAL_BOSS: 2 deaths * 100 + 100% error = 300
      expect(ranked[0].word).toBe('LETHAL_BOSS');
      expect(ranked[0].deathsCaused).toBe(2);
      expect(ranked[0].errorRate).toBe(100);

      // FREQUENT_TYPO: 0 deaths + 80% error = 80
      expect(ranked[1].word).toBe('FREQUENT_TYPO');
      expect(ranked[1].errorRate).toBe(80);

      // OCCASIONAL: 0 deaths + 20% error = 20
      expect(ranked[2].word).toBe('OCCASIONAL');
      expect(ranked[2].errorRate).toBe(20);
    });

    it('MatchResult contract allows failedWords and fatalWord integration', () => {
      const result: MatchResult = {
        winner: 'opponent',
        reason: 'beam_baseline_ko',
        durationMs: 12450,
        playerStats: {
          wpm: 82,
          peakWpm: 95,
          accuracy: 91,
          totalKeystrokes: 120,
          totalMistakes: 3,
          longestStreak: 25,
          wordsCompleted: 15,
          parriesCount: 2,
          overclockCount: 1,
        },
        opponentStats: {
          wpm: 88,
          peakWpm: 102,
          accuracy: 95,
          totalKeystrokes: 135,
          totalMistakes: 1,
          longestStreak: 40,
          wordsCompleted: 17,
          parriesCount: 0,
          overclockCount: 0,
        },
        kpEarned: 180,
        timestamp: Date.now(),
        failedWords: ['~(buf^0xFF)', '~(buf^0xFF)', 'REINTERPRET_CAST'],
        fatalWord: 'REINTERPRET_CAST',
      };

      expect(result.failedWords).toBeDefined();
      expect(result.failedWords!.length).toBe(3);
      expect(result.fatalWord).toBe('REINTERPRET_CAST');
    });
  });
}

// Direct execution support
async function run() {
  resetSuites();
  registerR3TelemetryTests();
  const summary = await runAllRegisteredSuites(true);
  console.log(`\nR3 Tests: ${summary.passedTests}/${summary.totalTests} passed`);
  if (summary.failedTests > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
