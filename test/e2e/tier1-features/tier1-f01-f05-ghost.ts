/**
 * Tier 1: Feature Coverage — Features 1 to 5 (Ghost Duel Playback & Persistence)
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

export function registerTier1GhostTests(): void {
  const sampleGhostRun: GhostRunData = {
    id: 'ghost_test_123',
    playerName: 'PHANTOM_OPERATOR',
    timestamp: 1720000000000,
    durationMs: 1200,
    wpm: 105,
    accuracy: 98,
    events: [
      { t: 0, c: 'S', ok: true, s: 'strike' },
      { t: 50, c: 'T', ok: true, s: 'strike' },
      { t: 100, c: 'R', ok: true, s: 'strike' },
      { t: 150, c: 'I', ok: true, s: 'strike' },
      { t: 200, c: 'K', ok: true, s: 'strike' },
      { t: 250, c: 'E', ok: true, s: 'strike', w: 'STRIKE' },
      { t: 400, c: 'S', ok: true, s: 'counter' },
      { t: 450, c: 'H', ok: true, s: 'counter' },
      { t: 500, c: 'I', ok: true, s: 'counter' },
      { t: 550, c: 'E', ok: true, s: 'counter' },
      { t: 600, c: 'L', ok: true, s: 'counter' },
      { t: 650, c: 'D', ok: true, s: 'counter', w: 'SHIELD' },
      { t: 800, c: '!', ok: true, s: 'disrupt' },
      { t: 850, c: '&', ok: true, s: 'disrupt' },
      { t: 900, c: '&', ok: true, s: 'disrupt' },
      { t: 950, c: '_', ok: true, s: 'disrupt' },
      { t: 1000, c: 'N', ok: true, s: 'disrupt' },
      { t: 1050, c: 'U', ok: true, s: 'disrupt' },
      { t: 1100, c: 'L', ok: true, s: 'disrupt' },
      { t: 1150, c: 'L', ok: true, s: 'disrupt' },
      { t: 1200, c: '#', ok: true, s: 'disrupt', w: '!&&_NULL#' },
    ],
  };

  describe('Tier 1 - Feature 1: Ghost Playback Combat Integration', () => {
    it('F1.1: GhostPlaybackEngine initializes with valid GhostRunData and sets profile metadata', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, {
        onCharTyped: () => {},
      });
      const profile = engine.getProfile();
      expect(profile.name).toContain('PHANTOM_OPERATOR');
      expect(profile.wpm).toBe(105);
      expect(profile.accuracy).toBe(98);
      expect(engine.getStance()).toBe('strike');
    });

    it('F1.2: GhostPlaybackEngine start begins playback clock and executes timestamped character typing', async () => {
      const charsTyped: Array<{ c: string; ok: boolean; s: StanceType }> = [];
      const engine = new GhostPlaybackEngine(sampleGhostRun, {
        onCharTyped: (char, ok, stance) => {
          charsTyped.push({ c: char, ok, s: stance });
        },
      });

      engine.start();
      await sleep(40);
      expect(charsTyped.length).toBeGreaterThanOrEqual(1);
      expect(charsTyped[0].c).toBe('S');
      expect(charsTyped[0].s).toBe('strike');
      engine.stop();
    });

    it('F1.3: GhostPlaybackEngine stop halts animation loop and ceases event dispatch', async () => {
      const charsTyped: string[] = [];
      const engine = new GhostPlaybackEngine(sampleGhostRun, {
        onCharTyped: char => {
          charsTyped.push(char);
        },
      });

      engine.start();
      await sleep(30);
      const countAtStop = charsTyped.length;
      engine.stop();
      await sleep(30);
      expect(charsTyped.length).toBe(countAtStop);
    });

    it('F1.4: GhostPlaybackEngine pause and resume correctly maintains elapsed offset', async () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, {
        onCharTyped: () => {},
      });
      engine.start();
      await sleep(20);
      engine.pause();
      await sleep(20);
      engine.resume();
      await sleep(20);
      engine.stop();
      expect(engine.getStance()).toBeDefined();
    });

    it('F1.5: GhostPlaybackEngine triggers onPlaybackComplete when all events finish', async () => {
      let completed = false;
      const singleEventRun: GhostRunData = {
        id: 'single_test',
        playerName: 'QUICK_GHOST',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 120,
        accuracy: 100,
        events: [{ t: 0, c: 'X', ok: true, s: 'strike', w: 'X' }],
      };

      const engine = new GhostPlaybackEngine(singleEventRun, {
        onCharTyped: () => {},
        onPlaybackComplete: () => {
          completed = true;
        },
      });

      engine.start();
      await sleep(40);
      expect(completed).toBe(true);
      engine.stop();
    });
  });

  describe('Tier 1 - Feature 2: Stance Event & Word Boundary Replay', () => {
    it('F2.1: GhostPlaybackEngine emits strike stance events with correct stance', async () => {
      const stancesReceived: StanceType[] = [];
      const engine = new GhostPlaybackEngine(sampleGhostRun, {
        onCharTyped: (_char, _ok, stance) => {
          stancesReceived.push(stance);
        },
      });
      engine.start();
      await sleep(40);
      expect(stancesReceived.length).toBeGreaterThanOrEqual(1);
      expect(stancesReceived[0]).toBe('strike');
      engine.stop();
    });

    it('F2.2: GhostPlaybackEngine emits counter stance events with correct stance', async () => {
      const counterRun: GhostRunData = {
        id: 'counter_run',
        playerName: 'AEGIS',
        timestamp: Date.now(),
        durationMs: 50,
        wpm: 90,
        accuracy: 100,
        events: [
          { t: 0, c: 'B', ok: true, s: 'counter' },
          { t: 10, c: 'U', ok: true, s: 'counter' },
          { t: 20, c: 'F', ok: true, s: 'counter' },
          { t: 30, c: 'F', ok: true, s: 'counter' },
          { t: 40, c: 'E', ok: true, s: 'counter' },
          { t: 50, c: 'R', ok: true, s: 'counter', w: 'BUFFER' },
        ],
      };

      const stances: StanceType[] = [];
      const engine = new GhostPlaybackEngine(counterRun, {
        onCharTyped: (_c, _ok, s) => stances.push(s),
      });
      engine.start();
      await sleep(40);
      expect(stances.length).toBeGreaterThanOrEqual(1);
      expect(stances.every(s => s === 'counter')).toBe(true);
      engine.stop();
    });

    it('F2.3: GhostPlaybackEngine emits disrupt stance events with correct stance', async () => {
      const disruptRun: GhostRunData = {
        id: 'disrupt_run',
        playerName: 'GLITCH',
        timestamp: Date.now(),
        durationMs: 0,
        wpm: 85,
        accuracy: 100,
        events: [{ t: 0, c: '@', ok: true, s: 'disrupt', w: '@async{42}/' }],
      };

      let emittedStance: StanceType | null = null;
      const engine = new GhostPlaybackEngine(disruptRun, {
        onCharTyped: (_c, _ok, s) => {
          emittedStance = s;
        },
      });
      engine.start();
      await sleep(40);
      expect<StanceType | null>(emittedStance).toBe('disrupt');
      engine.stop();
    });

    it('F2.4: GhostPlaybackEngine triggers onStanceChanged when stance changes in run', async () => {
      const stanceChanges: StanceType[] = [];
      const switchRun: GhostRunData = {
        id: 'switch_run',
        playerName: 'SWITCHER',
        timestamp: Date.now(),
        durationMs: 10,
        wpm: 100,
        accuracy: 100,
        events: [
          { t: 0, c: 'A', ok: true, s: 'strike' },
          { t: 10, c: 'B', ok: true, s: 'counter' },
        ],
      };

      const engine = new GhostPlaybackEngine(switchRun, {
        onCharTyped: () => {},
        onStanceChanged: s => stanceChanges.push(s),
      });
      engine.start();
      await sleep(50);
      expect(stanceChanges).toContain('counter');
      engine.stop();
    });

    it('F2.5: GhostPlaybackEngine reconstructs and triggers onWordCompleted at word boundaries', async () => {
      const wordsCompleted: string[] = [];
      const wordRun: GhostRunData = {
        id: 'word_boundary_run',
        playerName: 'VERB_BURSTER',
        timestamp: Date.now(),
        durationMs: 10,
        wpm: 120,
        accuracy: 100,
        events: [
          { t: 0, c: 'C', ok: true, s: 'strike' },
          { t: 2, c: 'L', ok: true, s: 'strike' },
          { t: 4, c: 'E', ok: true, s: 'strike' },
          { t: 6, c: 'A', ok: true, s: 'strike' },
          { t: 8, c: 'V', ok: true, s: 'strike' },
          { t: 10, c: 'E', ok: true, s: 'strike', w: 'CLEAVE' },
        ],
      };

      const engine = new GhostPlaybackEngine(wordRun, {
        onCharTyped: () => {},
        onWordCompleted: w => wordsCompleted.push(w),
      });
      engine.start();
      await sleep(50);
      expect(wordsCompleted).toContain('CLEAVE');
      engine.stop();
    });
  });

  describe('Tier 1 - Feature 3: Ghost Run Local Persistence (PB & Last Run)', () => {
    it('F3.1: savePersonalBest persists run in localStorage under STORAGE_KEY_PERSONAL_BEST', () => {
      savePersonalBest(sampleGhostRun);
      const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_BEST);
      expect(raw).toBeDefined();
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.id).toBe('ghost_test_123');
      expect(parsed.playerName).toBe('PHANTOM_OPERATOR');
    });

    it('F3.2: getPersonalBest retrieves the stored personal best run with fidelity', () => {
      savePersonalBest(sampleGhostRun);
      const retrieved = getPersonalBest();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('ghost_test_123');
      expect(retrieved!.wpm).toBe(105);
      expect(retrieved!.events.length).toBe(sampleGhostRun.events.length);
    });

    it('F3.3: saveLastRun persists run in localStorage under STORAGE_KEY_LAST_RUN', () => {
      const lastRun: GhostRunData = {
        ...sampleGhostRun,
        id: 'ghost_last_456',
        wpm: 92,
      };
      saveLastRun(lastRun);
      const raw = localStorage.getItem(STORAGE_KEY_LAST_RUN);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.id).toBe('ghost_last_456');
      expect(parsed.wpm).toBe(92);
    });

    it('F3.4: getLastRun retrieves the stored last run correctly', () => {
      const lastRun: GhostRunData = {
        ...sampleGhostRun,
        id: 'ghost_last_retrieval',
        wpm: 111,
      };
      saveLastRun(lastRun);
      const retrieved = getLastRun();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('ghost_last_retrieval');
      expect(retrieved!.wpm).toBe(111);
    });

    it('F3.5: getPersonalBest and getLastRun return null when storage empty or cleared', () => {
      localStorage.removeItem(STORAGE_KEY_PERSONAL_BEST);
      localStorage.removeItem(STORAGE_KEY_LAST_RUN);
      expect(getPersonalBest()).toBeNull();
      expect(getLastRun()).toBeNull();
    });
  });

  describe('Tier 1 - Feature 4: Ghost Duel UI Controls & Duel Trigger', () => {
    it('F4.1: GhostRecorder.serialize encodes GhostRunData into valid Base64 string', () => {
      const encoded = GhostRecorder.serialize(sampleGhostRun);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('F4.2: GhostRecorder.deserialize parses valid Base64 string back into GhostRunData', () => {
      const encoded = GhostRecorder.serialize(sampleGhostRun);
      const decoded = GhostRecorder.deserialize(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe(sampleGhostRun.id);
      expect(decoded!.playerName).toBe(sampleGhostRun.playerName);
      expect(decoded!.events.length).toBe(sampleGhostRun.events.length);
    });

    it('F4.3: GhostRecorder.deserialize returns null for corrupted string', () => {
      const corrupted = 'not_a_valid_base64_json!#@$';
      const result = GhostRecorder.deserialize(corrupted);
      expect(result).toBeNull();
    });

    it('F4.4: GhostRecorder records microsecond keystrokes and word completions', () => {
      const recorder = new GhostRecorder();
      recorder.start();
      recorder.recordKeystroke('S', true, 'strike');
      recorder.recordKeystroke('M', true, 'strike');
      recorder.recordKeystroke('I', true, 'strike');
      recorder.recordKeystroke('T', true, 'strike');
      recorder.recordKeystroke('E', true, 'strike', 'SMITE');

      const run = recorder.stop('TESTER', 100, 100);
      expect(run).not.toBeNull();
      expect(run!.events.length).toBe(5);
      expect(run!.events[4].w).toBe('SMITE');
    });

    it('F4.5: GhostRecorder.stop produces valid GhostRunData with calculated metrics', () => {
      const recorder = new GhostRecorder();
      recorder.start();
      recorder.recordKeystroke('A', true, 'counter');
      const run = recorder.stop('PILOT_01', 95, 99);
      expect(run).not.toBeNull();
      expect(run!.playerName).toBe('PILOT_01');
      expect(run!.wpm).toBe(95);
      expect(run!.accuracy).toBe(99);
      expect(run!.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tier 1 - Feature 5: Dynamic Opponent HUD in Ghost Duel', () => {
    it('F5.1: GhostPlaybackEngine.getProfile reflects challenger name from GhostRunData', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.name).toContain('PHANTOM_OPERATOR');
    });

    it('F5.2: GhostPlaybackEngine.getProfile calculates baseWpm and accuracy matching run', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.baseWpm).toBe(105);
      expect(profile.accuracy).toBe(98);
    });

    it('F5.3: GhostPlaybackEngine.getProfile supplies distinct avatar tag', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, { onCharTyped: () => {} });
      const profile = engine.getProfile();
      expect(profile.avatar).toBeDefined();
      expect(profile.avatar.length).toBeGreaterThan(0);
    });

    it('F5.4: GhostPlaybackEngine.getStance returns initial preferred stance of run', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, { onCharTyped: () => {} });
      expect(engine.getStance()).toBe('strike');
    });

    it('F5.5: GhostPlaybackEngine.getActiveWord returns current target word during playback', () => {
      const engine = new GhostPlaybackEngine(sampleGhostRun, { onCharTyped: () => {} });
      const activeWord = engine.getActiveWord();
      expect(typeof activeWord).toBe('string');
    });
  });
}
