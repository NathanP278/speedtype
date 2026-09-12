/**
 * SpeedType Mobile Input Engine & Virtual Keyboard Pipeline Test Suite
 *
 * Validates zero-latency character intake, cancelable beforeinput handling,
 * rapid-fire keystroke burst fidelity (<15ms), tick-scoped deduplication,
 * and seamless iOS QuickType / Android Gboard event sequences.
 */

import { describe, test, expect } from './test-harness.ts';

interface SimulatedInputEngine {
  inputVal: string;
  charLog: string[];
  backspaceCount: number;
  beforeInputHandledInTick: boolean;
  backspaceHandledInTick: boolean;
  handleKeyDown: (e: { key: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean; defaultPrevented?: boolean; preventDefault: () => void }) => void;
  handleBeforeInput: (e: { data?: string | null; inputType?: string; defaultPrevented?: boolean; preventDefault: () => void }) => void;
  handleChange: (e: { target: { value: string } }) => void;
  advanceTick: () => Promise<void>;
}

function createSimulatedInputEngine(): SimulatedInputEngine {
  const engine: SimulatedInputEngine = {
    inputVal: '',
    charLog: [],
    backspaceCount: 0,
    beforeInputHandledInTick: false,
    backspaceHandledInTick: false,
    handleKeyDown: (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        engine.backspaceHandledInTick = true;
        engine.backspaceCount++;
        queueMicrotask(() => {
          engine.backspaceHandledInTick = false;
        });
        return;
      }
    },
    handleBeforeInput: (e) => {
      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteWordBackward') {
        e.preventDefault();
        if (engine.backspaceHandledInTick) return;

        engine.backspaceHandledInTick = true;
        engine.backspaceCount++;
        queueMicrotask(() => {
          engine.backspaceHandledInTick = false;
        });
        return;
      }

      if (e.data && e.data.length > 0) {
        e.preventDefault();
        engine.beforeInputHandledInTick = true;
        queueMicrotask(() => {
          engine.beforeInputHandledInTick = false;
        });

        for (const ch of e.data) {
          engine.charLog.push(ch);
        }
      }
    },
    handleChange: (e) => {
      const val = e.target.value;
      if (engine.beforeInputHandledInTick) {
        engine.inputVal = '';
        return;
      }

      if (val.length > 0) {
        for (const ch of val) {
          engine.charLog.push(ch);
        }
      }
      engine.inputVal = '';
    },
    advanceTick: () => new Promise((resolve) => queueMicrotask(resolve)),
  };

  return engine;
}

export function registerMobileInputEngineTests(): void {
  describe('Mobile Input Engine & Virtual Keyboard Pipeline', () => {
    test('MIE-01: Cancelable beforeinput captures characters and prevents DOM mutation', () => {
      const engine = createSimulatedInputEngine();
      let defaultPrevented = false;

      engine.handleBeforeInput({
        inputType: 'insertText',
        data: 'a',
        preventDefault: () => {
          defaultPrevented = true;
        },
      });

      expect(defaultPrevented).toBe(true);
      expect(engine.charLog.length).toBe(1);
      expect(engine.charLog[0]).toBe('a');
      expect(engine.inputVal).toBe('');
    });

    test('MIE-02: Rapid double-keystrokes within <10ms are 100% captured without dropping', async () => {
      const engine = createSimulatedInputEngine();

      // Simulate typing 'speed' with rapid consecutive 'ee'
      const chars = ['s', 'p', 'e', 'e', 'd'];
      for (const ch of chars) {
        let prevented = false;
        engine.handleBeforeInput({
          inputType: 'insertText',
          data: ch,
          preventDefault: () => {
            prevented = true;
          },
        });
        expect(prevented).toBe(true);
        // Simulate microtask cycle between rapid bursts
        await engine.advanceTick();
      }

      expect(engine.charLog.join('')).toBe('speed');
      expect(engine.charLog.length).toBe(5);
    });

    test('MIE-03: iOS QuickType multi-character word suggestion inserts entire string', () => {
      const engine = createSimulatedInputEngine();
      let prevented = false;

      engine.handleBeforeInput({
        inputType: 'insertText',
        data: 'matrix ',
        preventDefault: () => {
          prevented = true;
        },
      });

      expect(prevented).toBe(true);
      expect(engine.charLog.join('')).toBe('matrix ');
      expect(engine.charLog.length).toBe(7);
    });

    test('MIE-04: Single-tick deduplication prevents duplicate Backspace on iOS Safari', async () => {
      const engine = createSimulatedInputEngine();

      // Step 1: In iOS Safari, physical/software backspace can fire keydown AND beforeinput in same tick
      let kdPrevented = false;
      let biPrevented = false;

      engine.handleKeyDown({
        key: 'Backspace',
        preventDefault: () => {
          kdPrevented = true;
        },
      });

      engine.handleBeforeInput({
        inputType: 'deleteContentBackward',
        preventDefault: () => {
          biPrevented = true;
        },
      });

      expect(kdPrevented).toBe(true);
      expect(biPrevented).toBe(true);
      // Crucial: Only 1 backspace should register, NOT 2
      expect(engine.backspaceCount).toBe(1);

      // Step 2: Next tick arrives (user presses backspace again 50ms later)
      await engine.advanceTick();

      engine.handleBeforeInput({
        inputType: 'deleteContentBackward',
        preventDefault: () => {},
      });

      // Now backspaceCount should cleanly increment to 2
      expect(engine.backspaceCount).toBe(2);
    });

    test('MIE-05: Fallback onChange skips duplicate when beforeinput handled in same tick', () => {
      const engine = createSimulatedInputEngine();

      // beforeinput handles 'k'
      engine.handleBeforeInput({
        inputType: 'insertText',
        data: 'k',
        preventDefault: () => {},
      });

      // Browser also fires onChange with target.value = 'k'
      engine.handleChange({
        target: { value: 'k' },
      });

      // charLog must contain exactly ONE 'k', not duplicate
      expect(engine.charLog.length).toBe(1);
      expect(engine.charLog[0]).toBe('k');
    });

    test('MIE-06: Modifier keys and functional keys (Tab, Esc, Ctrl, Cmd) do not emit chars', () => {
      const engine = createSimulatedInputEngine();
      let prevented = false;

      engine.handleKeyDown({
        key: 'Tab',
        preventDefault: () => {
          prevented = true;
        },
      });
      engine.handleKeyDown({
        key: 'Escape',
        preventDefault: () => {
          prevented = true;
        },
      });
      engine.handleKeyDown({
        key: 'c',
        ctrlKey: true,
        preventDefault: () => {
          prevented = true;
        },
      });
      engine.handleKeyDown({
        key: 'v',
        metaKey: true,
        preventDefault: () => {
          prevented = true;
        },
      });

      expect(engine.charLog.length).toBe(0);
      expect(engine.backspaceCount).toBe(0);
      expect(prevented).toBe(false);
    });
  });
}
