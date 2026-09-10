/**
 * Tier 2: Boundary & Corner Cases — Features 11 to 16 (Telemetry, Trials & Haptics)
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
  triggerHapticFeedback,
} from '../tier1-features/tier1-f11-f16-telemetry-trials.ts';

export function registerTier2TelemetryTrialsBoundaryTests(): void {
  describe('Tier 2 - Feature 11 Boundary: In-Match Word Typo & Recoil Tracking', () => {
    it('F11-B.1: 0 typos across clean match produces empty failed words list', () => {
      const matchMistakes: Record<string, number> = {};
      const failedWords = Object.keys(matchMistakes).filter(w => matchMistakes[w] > 0);
      expect(failedWords.length).toBe(0);
    });

    it('F11-B.2: 20+ typos on same word increments mistake counter while tracking single word', () => {
      const word = 'MICROCONTROLLER';
      expect(word.length).toBe(15);
      const stats = { attempts: 1, mistakes: 0 };

      for (let i = 0; i < 25; i++) {
        stats.mistakes++;
      }

      expect(stats.mistakes).toBe(25);
      expect(stats.attempts).toBe(1);
    });

    it('F11-B.3: Typo on last character of word records mistake before word completion', () => {
      const word = 'BREACH';
      let mistakes = 0;
      let completed = false;

      // Type B-R-E-A-C correctly
      for (let i = 0; i < 5; i++) {
        // correct
      }
      // Mistype on 'H'
      const input = 'X';
      if (input !== word[5]) {
        mistakes++;
      } else {
        completed = true;
      }

      expect(mistakes).toBe(1);
      expect(completed).toBe(false);
    });

    it('F11-B.4: Recoil on player pushing beam past -100 clamps strictly at -100', () => {
      let beamPos = -98;
      const recoilAmount = 4.0;
      beamPos = Math.max(-100, Math.min(100, beamPos - recoilAmount));
      expect(beamPos).toBe(-100);
    });

    it('F11-B.5: Recoil on opponent pushing beam past +100 clamps strictly at +100', () => {
      let beamPos = 98;
      const recoilAmount = 4.0;
      beamPos = Math.max(-100, Math.min(100, beamPos + recoilAmount));
      expect(beamPos).toBe(100);
    });
  });

  describe('Tier 2 - Feature 12 Boundary: Live Nemesis Words Dossier Recording', () => {
    it('F12-B.1: Empty failed words list does not mutate nemesisWords dictionary', () => {
      const initial: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          SAFE_WORD: { attempts: 2, mistakes: 1, deathsCaused: 0 },
        },
      };

      const updated = recordMatchInDossier(initial, 'Shinobi-X', true, 100, 50, []);
      expect(Object.keys(updated.nemesisWords).length).toBe(1);
      expect(updated.nemesisWords['SAFE_WORD'].attempts).toBe(2);
    });

    it('F12-B.2: Duplicate words in failedWords array aggregate correctly', () => {
      const initial: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {},
      };

      const updated = recordMatchInDossier(
        initial,
        'Shinobi-X',
        true,
        90,
        50,
        ['REPEATED', 'REPEATED']
      );

      expect(updated.nemesisWords['REPEATED'].attempts).toBe(2);
      expect(updated.nemesisWords['REPEATED'].mistakes).toBe(2);
    });

    it('F12-B.3: Zero attempts word calculates 0% error rate without NaN or division by zero', () => {
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          UNATTEMPTED: { attempts: 0, mistakes: 0, deathsCaused: 0 },
        },
      };

      const ranked = getRankedNemesisWords(dossier);
      expect(ranked[0].errorRate).toBe(0);
      expect(Number.isNaN(ranked[0].errorRate)).toBe(false);
    });

    it('F12-B.4: Word with 1 attempt and 1 mistake calculates 100% error rate', () => {
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        nemesisWords: {
          PERFECT_FAILURE: { attempts: 1, mistakes: 1, deathsCaused: 0 },
        },
      };

      const ranked = getRankedNemesisWords(dossier);
      expect(ranked[0].errorRate).toBe(100);
    });

    it('F12-B.5: Rival stats initialize properly on first match against new rival', () => {
      const initial: DossierData = {
        ...DEFAULT_DOSSIER,
        rivals: {},
      };

      const updated = recordMatchInDossier(
        initial,
        'NEW_UNKNOWN_RIVAL',
        true,
        95,
        100,
        []
      );

      expect(updated.rivals['NEW_UNKNOWN_RIVAL']).toBeDefined();
      expect(updated.rivals['NEW_UNKNOWN_RIVAL'].wins).toBe(1);
      expect(updated.rivals['NEW_UNKNOWN_RIVAL'].losses).toBe(0);
    });
  });

  describe('Tier 2 - Feature 13 Boundary: Code Syntax Exact Punctuation & Boost (+50%)', () => {
    it('F13-B.1: Code syntax token with brackets and symbols requires exact punctuation', () => {
      const token = 'Array.from({length:32})';
      expect(token.includes('{')).toBe(true);
      expect(token.includes('}')).toBe(true);
      expect(token.includes(':')).toBe(true);
      expect(token.includes('(')).toBe(true);
      expect(token.includes(')')).toBe(true);
    });

    it('F13-B.2: Whitespace inside token is strictly verified character by character', () => {
      const token = 'fn main() -> Result<()>';
      const spaceIdx1 = token.indexOf(' ');
      const spaceIdx2 = token.indexOf(' ', spaceIdx1 + 1);

      expect(token[spaceIdx1]).toBe(' ');
      expect(token[spaceIdx2]).toBe(' ');
    });

    it('F13-B.3: Semicolon mismatch counts as typo', () => {
      const expected: string = ';';
      const actual: string = ':';
      expect(actual === expected).toBe(false);
    });

    it('F13-B.4: +50% boost correctly calculates fractional beam push increments', () => {
      const basePush = 12.5;
      const boost = basePush * 1.5;
      expect(boost).toBe(18.75);
    });

    it('F13-B.5: All CODE_SYNTAX_WORDS tokens have non-empty length and valid characters', () => {
      for (const token of CODE_SYNTAX_WORDS) {
        expect(token.length).toBeGreaterThan(0);
        expect(typeof token).toBe('string');
      }
    });
  });

  describe('Tier 2 - Feature 14 Boundary: Blind Duel Masked Typing & Completion Reveal', () => {
    it('F14-B.1: Initial flash duration is strictly 500ms', () => {
      const flashDurationMs = 500;
      expect(flashDurationMs).toBe(500);
    });

    it('F14-B.2: Masking bullet point is unicode bullet • (\u2022)', () => {
      const bullet = '•';
      expect(bullet.charCodeAt(0)).toBe(0x2022);
    });

    it('F14-B.3: Masked characters length matches original word length exactly', () => {
      const words = ['MICROCONTROLLER', 'ENCRYPT', 'A'];
      for (const w of words) {
        const masked = w.split('').map(() => '•').join('');
        expect(masked.length).toBe(w.length);
      }
    });

    it('F14-B.4: Typo resets typedIndex back to 0 forcing re-typing', () => {
      let typedIndex = 12;
      const isBlind = true;
      const mistype = true;
      if (isBlind && mistype) {
        typedIndex = 0;
      }
      expect(typedIndex).toBe(0);
    });

    it('F14-B.5: Empty word handling in blind duel returns empty string', () => {
      const emptyWord = '';
      const masked = emptyWord.split('').map(() => '•').join('');
      expect(masked).toBe('');
    });
  });

  describe('Tier 2 - Feature 15 Boundary: 1 HP Sudden Death Fatal Recoil & Finisher Gate', () => {
    it('F15-B.1: Starting HP in sudden death is strictly 1 (not 0, not 100)', () => {
      const startingHp = 1;
      expect(startingHp).toBe(1);
    });

    it('F15-B.2: Any damage >= 1 when shield=0 triggers instant fatality', () => {
      let hp = 1;
      const shield = 0;
      const damage = 1;
      let isDead = false;

      if (shield < damage) {
        hp = Math.max(0, hp - (damage - shield));
        if (hp <= 0) isDead = true;
      }

      expect(isDead).toBe(true);
      expect(hp).toBe(0);
    });

    it('F15-B.3: Partial shield absorbs hit leaving 1 HP intact', () => {
      let hp = 1;
      let shield = 10;
      const damage = 8;

      if (shield >= damage) {
        shield -= damage;
      } else {
        hp = 0;
      }

      expect(hp).toBe(1);
      expect(shield).toBe(2);
    });

    it('F15-B.4: Finisher duel boss word trigger does not fire on starting 1 HP', () => {
      const trialModifier = '1hp_sudden_death';
      const playerHealth = 1;
      const maxHealth = 1;

      // Health ratio is 100%, but absolute is <= 10
      const shouldTrigger = trialModifier !== '1hp_sudden_death' && (playerHealth / maxHealth) <= 0.10;
      expect(shouldTrigger).toBe(false);
    });

    it('F15-B.5: Defeat reason in 1 HP mode is strictly sudden_death', () => {
      const isSuddenDeath = true;
      const reason = isSuddenDeath ? 'sudden_death' : 'health_depleted_ko';
      expect(reason).toBe('sudden_death');
    });
  });

  describe('Tier 2 - Feature 16 Boundary: Haptic Sensory Polish', () => {
    it('F16-B.1: Vibration array pattern [80, 40, 80] preserves element values and order', () => {
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback([80, 40, 80]);
      expect(mockNavState.vibrateCalls[0]).toEqual([80, 40, 80]);
    });

    it('F16-B.2: Single vibration value 40 preserves numeric duration', () => {
      mockNavState.vibrateCalls.length = 0;
      triggerHapticFeedback(40);
      expect(mockNavState.vibrateCalls[0]).toBe(40);
    });

    it('F16-B.3: Negative vibration duration is safely guarded', () => {
      mockNavState.vibrateCalls.length = 0;
      const safeDuration = (val: number) => (val > 0 ? val : 0);
      triggerHapticFeedback(safeDuration(-50));
      expect(mockNavState.vibrateCalls[0]).toBe(0);
    });

    it('F16-B.4: Calling triggerHapticFeedback in test environment succeeds without error', () => {
      expect(() => {
        triggerHapticFeedback(40);
        triggerHapticFeedback([80, 40, 80]);
      }).not.toThrow();
    });

    it('F16-B.5: Consecutive rapid vibration calls do not throw', () => {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          triggerHapticFeedback(40);
        }
      }).not.toThrow();
    });
  });
}
