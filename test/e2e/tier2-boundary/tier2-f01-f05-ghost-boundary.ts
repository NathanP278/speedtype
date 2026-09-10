/**
 * Tier 2: Boundary & Corner Cases — Features 1 to 5 (Ghost Duel Playback & Persistence)
 * Feature 1: Ghost Playback Combat Integration
 * Feature 2: Stance Event & Word Boundary Replay
 * Feature 3: Ghost Run Local Persistence (PB & Last Run)
 * Feature 4: Ghost Duel UI Controls & Duel Trigger
 * Feature 5: Dynamic Opponent HUD in Ghost Duel
 */

import { describe, it, expect, sleep } from '../../test-harness.ts';
import {
  GhostPlaybackEngine,
} from '../../../src/social/ghostPlayer.ts';
import {
  GhostRecorder,
  GhostRunData,
  savePersonalBest,
  getPersonalBest,
  saveLastRun,
  getLastRun,
  STORAGE_KEY_PERSONAL_BEST,
  STORAGE_KEY_LAST_RUN,
} from '../../../src/social/ghostRecorder.ts';
import { StanceType } from '../../../src/types/combat.ts';

export function registerTier2GhostBoundaryTests(): void {
  describe('Tier 2 - Feature 1 Boundary: Ghost Playback Combat Integration', () => {
    it('F1-B.1: Ghost with empty events array immediately terminates and triggers onPlaybackComplete', async () => {
      let completed = false;
      const emptyRun: GhostRunData = {
        id: 'ghost_empty',
        playerName: 'NOOP_BOT',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 0,
        accuracy: 0,
        events: [],
      };

      const engine = new GhostPlaybackEngine(emptyRun, {
        onCharTyped: () => {},
        onPlaybackComplete: () => {
          completed = true;
        },
      });

      engine.start();
      await sleep(30);
      expect(completed).toBe(true);
      engine.stop();
    });

    it('F1-B.2: Ghost events with 0 or negative timestamp delta are consumed without negative delay crash', async () => {
      const zeroDeltaRun: GhostRunData = {
        id: 'ghost_zero_delta',
        playerName: 'ZERO_DELTA',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 120,
        accuracy: 100,
        events: [
          { t: 0, c: 'A', ok: true, s: 'strike' },
          { t: 0, c: 'B', ok: true, s: 'strike' },
          { t: -5, c: 'C', ok: true, s: 'strike' },
        ],
      };

      const typed: string[] = [];
      const engine = new GhostPlaybackEngine(zeroDeltaRun, {
        onCharTyped: c => typed.push(c),
      });

      engine.start();
      await sleep(40);
      expect(typed.length).toBe(3);
      expect(typed).toEqual(['A', 'B', 'C']);
      engine.stop();
    });

    it('F1-B.3: Ultra-high WPM ghost (500 WPM, delta <= 5ms) processes all events without dropped indices', async () => {
      const fastEvents = [];
      for (let i = 0; i < 20; i++) {
        fastEvents.push({
          t: i * 2,
          c: 'X',
          ok: true,
          s: 'strike' as StanceType,
        });
      }

      const ultraRun: GhostRunData = {
        id: 'ghost_hyper',
        playerName: 'HYPER_OVERCLOCK',
        timestamp: Date.now(),
        durationMs: 40,
        wpm: 500,
        accuracy: 100,
        events: fastEvents,
      };

      let count = 0;
      const engine = new GhostPlaybackEngine(ultraRun, {
        onCharTyped: () => {
          count++;
        },
      });

      engine.start();
      await sleep(60);
      expect(count).toBe(20);
      engine.stop();
    });

    it('F1-B.4: Calling start() multiple times in succession resets clock cleanly without runaway loops', async () => {
      const run: GhostRunData = {
        id: 'ghost_restarts',
        playerName: 'RESTARTER',
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 100,
        accuracy: 100,
        events: [{ t: 0, c: 'Z', ok: true, s: 'strike' }],
      };

      const engine = new GhostPlaybackEngine(run, { onCharTyped: () => {} });
      expect(() => {
        engine.start();
        engine.start();
        engine.start();
      }).not.toThrow();
      engine.stop();
    });

    it('F1-B.5: Calling pause() and resume() when unstarted or stopped is a safe no-op', () => {
      const run: GhostRunData = {
        id: 'ghost_safe_pause',
        playerName: 'SAFE',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 100,
        accuracy: 100,
        events: [],
      };

      const engine = new GhostPlaybackEngine(run, { onCharTyped: () => {} });
      expect(() => {
        engine.pause();
        engine.resume();
        engine.stop();
      }).not.toThrow();
    });
  });

  describe('Tier 2 - Feature 2 Boundary: Stance Event & Word Boundary Replay', () => {
    it('F2-B.1: Replays rapid back-to-back stance switches across all 3 stances', async () => {
      const stanceRun: GhostRunData = {
        id: 'ghost_rapid_switch',
        playerName: 'TRI_STANCE',
        timestamp: Date.now(),
        durationMs: 30,
        wpm: 100,
        accuracy: 100,
        events: [
          { t: 0, c: '1', ok: true, s: 'strike' },
          { t: 5, c: '2', ok: true, s: 'counter' },
          { t: 10, c: '3', ok: true, s: 'disrupt' },
          { t: 15, c: '4', ok: true, s: 'strike' },
        ],
      };

      const stancesSeen: StanceType[] = [];
      const engine = new GhostPlaybackEngine(stanceRun, {
        onCharTyped: (_c, _ok, s) => stancesSeen.push(s),
      });

      engine.start();
      await sleep(50);
      expect(stancesSeen).toEqual(['strike', 'counter', 'disrupt', 'strike']);
      engine.stop();
    });

    it('F2-B.2: Initial event with missing or fallback stance defaults safely to strike', () => {
      const fallbackRun: GhostRunData = {
        id: 'ghost_fallback_stance',
        playerName: 'NO_STANCE',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 100,
        accuracy: 100,
        events: [],
      };

      const engine = new GhostPlaybackEngine(fallbackRun, { onCharTyped: () => {} });
      expect(engine.getStance()).toBe('strike');
    });

    it('F2-B.3: Word completion reconstruction on non-standard symbol sequences like ~(buf^0xFF)', async () => {
      const disruptToken = '~(buf^0xFF)';
      const events = disruptToken.split('').map((c, i) => ({
        t: i * 2,
        c,
        ok: true,
        s: 'disrupt' as StanceType,
        w: i === disruptToken.length - 1 ? disruptToken : undefined,
      }));

      const symbolRun: GhostRunData = {
        id: 'ghost_symbols',
        playerName: 'HEX_HACKER',
        timestamp: Date.now(),
        durationMs: 30,
        wpm: 110,
        accuracy: 100,
        events,
      };

      const completedWords: string[] = [];
      const engine = new GhostPlaybackEngine(symbolRun, {
        onCharTyped: () => {},
        onWordCompleted: w => completedWords.push(w),
      });

      engine.start();
      await sleep(50);
      expect(completedWords).toContain('~(buf^0xFF)');
      engine.stop();
    });

    it('F2-B.4: Reconstructed word span handles single-character tokens without crashing', async () => {
      const singleCharRun: GhostRunData = {
        id: 'ghost_single_char',
        playerName: 'AT_SIGN',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 100,
        accuracy: 100,
        events: [{ t: 0, c: '@', ok: true, s: 'disrupt', w: '@' }],
      };

      const completedWords: string[] = [];
      const engine = new GhostPlaybackEngine(singleCharRun, {
        onCharTyped: () => {},
        onWordCompleted: w => completedWords.push(w),
      });

      engine.start();
      await sleep(30);
      expect(completedWords).toContain('@');
      engine.stop();
    });

    it('F2-B.5: Partial word typing does not emit onWordCompleted prematurely', async () => {
      const partialRun: GhostRunData = {
        id: 'ghost_partial',
        playerName: 'HALF_TYPER',
        timestamp: Date.now(),
        durationMs: 20,
        wpm: 100,
        accuracy: 100,
        events: [
          { t: 0, c: 'S', ok: true, s: 'strike' },
          { t: 5, c: 'T', ok: true, s: 'strike' },
          { t: 10, c: 'R', ok: true, s: 'strike' }, // Cut off before STRIKE finishes
        ],
      };

      const completedWords: string[] = [];
      const engine = new GhostPlaybackEngine(partialRun, {
        onCharTyped: () => {},
        onWordCompleted: w => completedWords.push(w),
      });

      engine.start();
      await sleep(40);
      expect(completedWords.length).toBe(0);
      engine.stop();
    });
  });

  describe('Tier 2 - Feature 3 Boundary: Ghost Run Local Persistence', () => {
    it('F3-B.1: Corrupted JSON in localStorage for PB returns null gracefully without throwing', () => {
      localStorage.setItem(STORAGE_KEY_PERSONAL_BEST, '{malformed_json: true,,,}');
      expect(() => {
        const result = getPersonalBest();
        expect(result).toBeNull();
      }).not.toThrow();
    });

    it('F3-B.2: Corrupted JSON in localStorage for Last Run returns null gracefully', () => {
      localStorage.setItem(STORAGE_KEY_LAST_RUN, 'undefined');
      expect(() => {
        const result = getLastRun();
        expect(result).toBeNull();
      }).not.toThrow();
    });

    it('F3-B.3: Zero WPM and 0% accuracy run persists and deserializes intact', () => {
      const zeroRun: GhostRunData = {
        id: 'ghost_zero',
        playerName: 'ROOKIE',
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 0,
        accuracy: 0,
        events: [{ t: 0, c: 'a', ok: false, s: 'strike' }],
      };

      saveLastRun(zeroRun);
      const retrieved = getLastRun();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.wpm).toBe(0);
      expect(retrieved!.accuracy).toBe(0);
    });

    it('F3-B.4: Overwriting PB only occurs when new run has higher WPM in match logic', () => {
      const pbRun: GhostRunData = {
        id: 'ghost_pb_high',
        playerName: 'CHAMP',
        timestamp: Date.now(),
        durationMs: 1000,
        wpm: 120,
        accuracy: 99,
        events: [],
      };
      savePersonalBest(pbRun);

      const slowerRunWpm = 95;
      const storedPb = getPersonalBest();
      if (slowerRunWpm > (storedPb?.wpm || 0)) {
        savePersonalBest({ ...pbRun, wpm: slowerRunWpm });
      }

      const activePb = getPersonalBest();
      expect(activePb!.wpm).toBe(120); // Should remain 120
    });

    it('F3-B.5: Saving last run never overwrites or clears personal best run', () => {
      const pbRun: GhostRunData = {
        id: 'ghost_pb_standalone',
        playerName: 'PB_PLAYER',
        timestamp: Date.now(),
        durationMs: 1000,
        wpm: 130,
        accuracy: 100,
        events: [],
      };
      savePersonalBest(pbRun);

      const lastRun: GhostRunData = {
        id: 'ghost_last_standalone',
        playerName: 'LAST_PLAYER',
        timestamp: Date.now(),
        durationMs: 500,
        wpm: 75,
        accuracy: 88,
        events: [],
      };
      saveLastRun(lastRun);

      expect(getPersonalBest()!.id).toBe('ghost_pb_standalone');
      expect(getLastRun()!.id).toBe('ghost_last_standalone');
    });
  });

  describe('Tier 2 - Feature 4 Boundary: Ghost Duel UI Controls & Duel Trigger', () => {
    it('F4-B.1: Deserializing corrupted Base64 header returns null', () => {
      const badBase64 = '@@@@NOT_BASE_64@@@@';
      const parsed = GhostRecorder.deserialize(badBase64);
      expect(parsed).toBeNull();
    });

    it('F4-B.2: Deserializing valid Base64 that contains non-JSON string returns null', () => {
      const nonJsonString = btoa(encodeURIComponent('Plain text not JSON'));
      const parsed = GhostRecorder.deserialize(nonJsonString);
      expect(parsed).toBeNull();
    });

    it('F4-B.3: Deserializing valid JSON missing required fields (id or events) returns null', () => {
      const missingIdJson = btoa(encodeURIComponent(JSON.stringify({ playerName: 'NO_ID' })));
      expect(GhostRecorder.deserialize(missingIdJson)).toBeNull();

      const missingEventsJson = btoa(encodeURIComponent(JSON.stringify({ id: 'ghost_no_events' })));
      expect(GhostRecorder.deserialize(missingEventsJson)).toBeNull();
    });

    it('F4-B.4: Deserializing empty string returns null without throwing', () => {
      expect(GhostRecorder.deserialize('')).toBeNull();
      expect(GhostRecorder.deserialize('   ')).toBeNull();
    });

    it('F4-B.5: GhostRecorder.stop with 0 recorded keystrokes returns null and does not create ghost', () => {
      const recorder = new GhostRecorder();
      recorder.start();
      // No keystrokes recorded
      const run = recorder.stop('EMPTY_USER', 0, 0);
      expect(run).toBeNull();
    });
  });

  describe('Tier 2 - Feature 5 Boundary: Dynamic Opponent HUD in Ghost Duel', () => {
    it('F5-B.1: Ghost with empty string playerName falls back to a valid display profile name', () => {
      const emptyNameRun: GhostRunData = {
        id: 'ghost_empty_name',
        playerName: '',
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 80,
        accuracy: 90,
        events: [],
      };

      const engine = new GhostPlaybackEngine(emptyNameRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.name.length).toBeGreaterThan(0);
    });

    it('F5-B.2: Ghost with extremely long player name (150+ chars) is accepted without crash', () => {
      const longName = 'A'.repeat(150);
      const longNameRun: GhostRunData = {
        id: 'ghost_long_name',
        playerName: longName,
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 90,
        accuracy: 95,
        events: [],
      };

      const engine = new GhostPlaybackEngine(longNameRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.name).toContain('AAAA');
    });

    it('F5-B.3: Ghost with special characters and Unicode in playerName renders faithfully', () => {
      const unicodeName = '👾 CYBER_鬼神_X [⚡]';
      const unicodeRun: GhostRunData = {
        id: 'ghost_unicode',
        playerName: unicodeName,
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 110,
        accuracy: 98,
        events: [],
      };

      const engine = new GhostPlaybackEngine(unicodeRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.name).toContain(unicodeName);
    });

    it('F5-B.4: Profile provides valid avatar tag format even with custom name', () => {
      const run: GhostRunData = {
        id: 'ghost_custom_avatar',
        playerName: '[ROOT]',
        timestamp: Date.now(),
        durationMs: 100,
        wpm: 100,
        accuracy: 100,
        events: [],
      };

      const engine = new GhostPlaybackEngine(run, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.avatar).toBeDefined();
    });

    it('F5-B.5: getActiveWord returns empty string or valid word when events are empty', () => {
      const emptyRun: GhostRunData = {
        id: 'ghost_empty_word',
        playerName: 'EMPTY',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 0,
        accuracy: 0,
        events: [],
      };

      const engine = new GhostPlaybackEngine(emptyRun, { onCharTyped: () => {} });
      expect(typeof engine.getActiveWord()).toBe('string');
    });
  });
}
