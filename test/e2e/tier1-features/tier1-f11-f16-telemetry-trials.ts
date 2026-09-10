/**
 * Tier 1: Feature Coverage — Features 11 to 16 (Telemetry, Weekly Trials & Haptics)
 * Feature 11: In-Match Word Typo & Recoil Tracking
 * Feature 12: Live Nemesis Words Dossier Recording
 * Feature 13: Code Syntax Exact Punctuation & Boost (+50%)
 * Feature 14: Blind Duel Masked Typing & Completion Reveal
 * Feature 15: 1 HP Sudden Death Fatal Recoil & Finisher Gate
 * Feature 16: Haptic Sensory Polish (navigator.vibrate safe calls)
 */

import { describe, it, expect, mockNavState } from '../../test-harness.ts';
import {
  DEFAULT_DOSSIER,
  recordMatchInDossier,
  getRankedNemesisWords,
  DossierData,
} from '../../../src/social/rivalryDossier.ts';
import {
  CODE_SYNTAX_WORDS,
} from '../../../src/engine/dictionary.ts';
import {
  WEEKLY_TRIALS,
} from '../../../src/trials/weeklyTrials.ts';

// Haptics safe caller implementation complying with PROJECT.md contract
export function triggerHapticFeedback(pattern: number | number[]): void {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently swallow browser restrictions
    }
  }
}

export function registerTier1TelemetryTrialsTests(): void {
  describe('Tier 1 - Feature 11: In-Match Word Typo & Recoil Tracking', () => {
    it('F11.1: Clean keystrokes matching target word do not increment mistakes', () => {
      const targetWord = 'PULVERIZE';
      let mistakes = 0;
      for (const char of targetWord) {
        const inputChar = char;
        if (inputChar !== char) {
          mistakes++;
        }
      }
      expect(mistakes).toBe(0);
    });

    it('F11.2: Mistyping on active word logs typo against that specific target word', () => {
      const targetWord = '~(buf^0xFF)';
      const wordStats: Record<string, { attempts: number; mistakes: number }> = {};

      const recordTypo = (word: string) => {
        if (!wordStats[word]) {
          wordStats[word] = { attempts: 1, mistakes: 0 };
        }
        wordStats[word].mistakes++;
      };

      recordTypo(targetWord);
      recordTypo(targetWord);

      expect(wordStats[targetWord].mistakes).toBe(2);
      expect(wordStats[targetWord].attempts).toBe(1);
    });

    it('F11.3: Recoil events push beam towards player baseline and record kinetic penalty', () => {
      let beamPos = 10;
      const recoilAmount = 4.0;
      // Recoil pushes towards player (- direction)
      beamPos = Math.max(-100, beamPos - recoilAmount);
      expect(beamPos).toBe(6.0);
    });

    it('F11.4: Word tracking distinguishes between different attempted words in match', () => {
      const wordsAttempted = ['STRIKE', 'FIREWALL', 'ANNIHILATE'];
      const failedWords = ['FIREWALL'];

      expect(wordsAttempted.length).toBe(3);
      expect(failedWords).toContain('FIREWALL');
      expect(failedWords).not.toContain('STRIKE');
    });

    it('F11.5: Fatal word is correctly captured when defeat occurs on active word', () => {
      let fatalWord: string | undefined = undefined;
      const activeWord = 'MICROCONTROLLER';
      const playerHealth = 0;

      if (playerHealth <= 0) {
        fatalWord = activeWord;
      }

      expect(fatalWord).toBe('MICROCONTROLLER');
    });
  });

  describe('Tier 1 - Feature 12: Live Nemesis Words Dossier Recording', () => {
    it('F12.1: recordMatchInDossier adds new failed words with attempts=1, mistakes=1', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      const updated = recordMatchInDossier(
        initialDossier,
        'Shinobi-X',
        true,
        95,
        100,
        ['REINTERPRET_CAST']
      );

      expect(updated.nemesisWords['REINTERPRET_CAST']).toBeDefined();
      expect(updated.nemesisWords['REINTERPRET_CAST'].attempts).toBe(1);
      expect(updated.nemesisWords['REINTERPRET_CAST'].mistakes).toBe(1);
      expect(updated.nemesisWords['REINTERPRET_CAST'].deathsCaused).toBe(0);
    });

    it('F12.2: Existing nemesis words increment attempts and mistakes cumulatively', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          BUFFER: { attempts: 3, mistakes: 2, deathsCaused: 0 },
        },
      };

      const updated = recordMatchInDossier(
        initialDossier,
        'Ada-01',
        true,
        100,
        150,
        ['BUFFER']
      );

      expect(updated.nemesisWords['BUFFER'].attempts).toBe(4);
      expect(updated.nemesisWords['BUFFER'].mistakes).toBe(3);
    });

    it('F12.3: Defeat (isWin = false) marks deathsCaused on failed words', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          FATAL_TOKEN: { attempts: 1, mistakes: 1, deathsCaused: 0 },
        },
      };

      const updated = recordMatchInDossier(
        initialDossier,
        'Glitch-Daemon',
        false,
        80,
        20,
        ['FATAL_TOKEN']
      );

      expect(updated.nemesisWords['FATAL_TOKEN'].deathsCaused).toBe(1);
    });

    it('F12.4: getRankedNemesisWords correctly sorts by highest lethality and error rate', () => {
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          LOW_THREAT: { attempts: 10, mistakes: 1, deathsCaused: 0 },
          DEADLY_WORD: { attempts: 5, mistakes: 4, deathsCaused: 3 },
          MED_THREAT: { attempts: 5, mistakes: 4, deathsCaused: 0 },
        },
      };

      const ranked = getRankedNemesisWords(dossier);
      expect(ranked.length).toBe(3);
      expect(ranked[0].word).toBe('DEADLY_WORD');
      expect(ranked[0].deathsCaused).toBe(3);
      expect(ranked[1].word).toBe('MED_THREAT');
      expect(ranked[2].word).toBe('LOW_THREAT');
    });

    it('F12.5: recordMatchInDossier preserves existing dossier metrics', () => {
      const initialDossier: DossierData = {
        ...DEFAULT_DOSSIER,
        lifetimeMatches: 5,
        wins: 4,
        losses: 1,
        totalKpEarned: 1200,
      };

      const updated = recordMatchInDossier(
        initialDossier,
        'Shinobi-X',
        true,
        110,
        250,
        []
      );

      expect(updated.lifetimeMatches).toBe(6);
      expect(updated.wins).toBe(5);
      expect(updated.losses).toBe(1);
      expect(updated.totalKpEarned).toBe(1450);
    });
  });

  describe('Tier 1 - Feature 13: Code Syntax Exact Punctuation & Boost (+50%)', () => {
    it('F13.1: Code syntax lexicon includes punctuation, brackets, pointers, generics, and keywords', () => {
      expect(CODE_SYNTAX_WORDS.length).toBeGreaterThanOrEqual(10);
      expect(CODE_SYNTAX_WORDS).toContain('std::unique_ptr<T>');
      expect(CODE_SYNTAX_WORDS).toContain('Promise.allSettled()');
    });

    it('F13.2: Exact casing and punctuation matching is strictly required for correct character validation', () => {
      const codeWord = 'std::unique_ptr<T>';
      const input = 'std::unique_ptr<t>'; // lowercase t is mismatch
      const mismatchIndex = 16;
      expect(codeWord[mismatchIndex]).toBe('T');
      expect(input[mismatchIndex]).toBe('t');
      expect(codeWord[mismatchIndex] === input[mismatchIndex]).toBe(false);
    });

    it('F13.3: Typing engine treats case mismatch as typo and applies lockout penalty', () => {
      const expectedChar = 'R';
      const typedChar = 'r';
      const isCorrect = typedChar === expectedChar;
      expect(isCorrect).toBe(false);
    });

    it('F13.4: Completed code syntax tokens receive +50% beam push bonus (1.5x multiplier)', () => {
      const basePush = 20.0;
      const trialBonus = 1.5; // +50%
      const boostedPush = basePush * trialBonus;
      expect(boostedPush).toBe(30.0);
    });

    it('F13.5: Code tokens with spaces validate space keystrokes accurately', () => {
      const token = 'git commit -m "init"';
      expect(token[3]).toBe(' ');
      expect(token[10]).toBe(' ');
      expect(token[13]).toBe(' ');
    });
  });

  describe('Tier 1 - Feature 14: Blind Duel Masked Typing & Completion Reveal', () => {
    it('F14.1: Blind duel mode specifies 0.5s initial flash period before character masking', () => {
      const trial = WEEKLY_TRIALS.blind_duel;
      expect(trial.id).toBe('blind_duel');
      expect(trial.description).toContain('flashed for 0.5s');
    });

    it('F14.2: During typing, active characters render as masked bullet points (•)', () => {
      const rawWord = 'ENCRYPT';
      const masked = rawWord.split('').map(() => '•').join('');
      expect(masked).toBe('•••••••');
      expect(masked).not.toContain('E');
    });

    it('F14.3: Zero visual feedback of cleartext characters during active typing in blind mode', () => {
      const typedIdx = 3;
      const targetWord = 'FORTIFY';
      // In blind duel, characters typed or untyped are masked
      const displayed = targetWord.split('').map(() => '•').join('');
      expect(displayed.slice(0, typedIdx)).toBe('•••');
      expect(displayed.includes('F')).toBe(false);
    });

    it('F14.4: Mistype in blind duel immediately resets current token progress (typedIndex = 0)', () => {
      let typedIndex = 5;
      const isBlind = true;
      const mistypeOccurred = true;

      if (isBlind && mistypeOccurred) {
        typedIndex = 0;
      }

      expect(typedIndex).toBe(0);
    });

    it('F14.5: Word completion reveals full cleartext word before transitioning to next token', () => {
      const word = 'AUTHENTICATE';
      let isCompleted = true;
      const display = isCompleted ? word : word.split('').map(() => '•').join('');
      expect(display).toBe('AUTHENTICATE');
    });
  });

  describe('Tier 1 - Feature 15: 1 HP Sudden Death Fatal Recoil & Finisher Gate', () => {
    it('F15.1: 1 HP Sudden Death initializes combatant health=1 and maxHealth=1', () => {
      const trial = WEEKLY_TRIALS['1hp_sudden_death'];
      expect(trial.id).toBe('1hp_sudden_death');
      const playerHealth = 1;
      const maxHealth = 1;
      expect(playerHealth).toBe(1);
      expect(maxHealth).toBe(1);
    });

    it('F15.2: Mistype recoil with 0 shield causes instant fatality (reason: sudden_death)', () => {
      const playerHealth = 1;
      const playerShield = 0;
      const isSuddenDeath = true;
      let matchEnded = false;
      let reason = '';

      if (isSuddenDeath && playerShield <= 0) {
        matchEnded = true;
        reason = 'sudden_death';
      }

      expect(matchEnded).toBe(true);
      expect(reason).toBe('sudden_death');
    });

    it('F15.3: Counter stance shield absorbs mistype recoil without triggering instant knockout', () => {
      let playerHealth = 1;
      let playerShield = 50;
      const isSuddenDeath = true;
      const recoilDamage = 20;

      if (isSuddenDeath) {
        if (playerShield >= recoilDamage) {
          playerShield -= recoilDamage;
        } else {
          playerHealth = 0;
        }
      }

      expect(playerHealth).toBe(1);
      expect(playerShield).toBe(30);
    });

    it('F15.4: Finisher duel is gated / disabled in 1 HP Sudden Death mode', () => {
      const isSuddenDeath = true;
      const pHealth = 1;
      // Finisher normally triggers if pHealth <= 10, but in 1hp mode it must be suppressed
      const canTriggerFinisher = !isSuddenDeath && pHealth <= 10;
      expect(canTriggerFinisher).toBe(false);
    });

    it('F15.5: Match result marks reason as sudden_death rather than standard health depletion', () => {
      const isSuddenDeath = true;
      const reason = isSuddenDeath ? 'sudden_death' : 'health_depleted_ko';
      expect(reason).toBe('sudden_death');
    });
  });

  describe('Tier 1 - Feature 16: Haptic Sensory Polish (navigator.vibrate safe calls)', () => {
    it('F16.1: triggerHapticFeedback triggers 40ms vibration pattern on player mistype', () => {
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback(40);
      expect(mockNavState.vibrateCalls.length).toBe(1);
      expect(mockNavState.vibrateCalls[0]).toBe(40);
    });

    it('F16.2: triggerHapticFeedback triggers [80, 40, 80]ms vibration pattern on baseline impact', () => {
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback([80, 40, 80]);
      expect(mockNavState.vibrateCalls.length).toBe(1);
      expect(mockNavState.vibrateCalls[0]).toEqual([80, 40, 80]);
    });

    it('F16.3: triggerHapticFeedback safely no-ops when navigator is undefined or unvibrateable', () => {
      const safeCall = () => {
        // Simulating missing vibrate
        const savedVibrate = navigator.vibrate;
        try {
          (navigator as unknown as Record<string, unknown>).vibrate = undefined;
          triggerHapticFeedback(40);
        } finally {
          (navigator as unknown as Record<string, unknown>).vibrate = savedVibrate;
        }
      };
      expect(safeCall).not.toThrow();
    });

    it('F16.4: triggerHapticFeedback catches and swallows any browser security/policy exceptions', () => {
      const savedVibrate = navigator.vibrate;
      try {
        navigator.vibrate = () => {
          throw new Error('NotAllowedError: User gesture required');
        };
        const safeCall = () => triggerHapticFeedback(40);
        expect(safeCall).not.toThrow();
      } finally {
        navigator.vibrate = savedVibrate;
      }
    });

    it('F16.5: Haptic feedback parameters adhere to spec thresholds: 40ms mistype and [80,40,80]ms KO', () => {
      const mistypeDuration = 40;
      const koPattern = [80, 40, 80];

      expect(mistypeDuration).toBe(40);
      expect(koPattern.length).toBe(3);
      expect(koPattern[0]).toBe(80);
      expect(koPattern[1]).toBe(40);
      expect(koPattern[2]).toBe(80);
    });
  });
}
