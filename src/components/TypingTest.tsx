import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserCalibration,
  calculateNetWpm,
  calculateGrossWpm,
  calculateAccuracy,
  saveCalibration,
} from '../engine/calibration.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface TypingTestProps {
  onComplete: (calibration: UserCalibration) => void;
  onCancel?: () => void;
  existingCalibration?: UserCalibration | null;
}

const BENCHMARK_PASSAGES = [
  'the quick brown fox jumps over the lazy dog while skilled typists master the art of speed and rhythm in digital cyberspace',
  'system processors synchronize clock cycles as lightning fast keystrokes push through modern networks with absolute precision and clarity',
  'focus your mind on every word and letter because consistent accuracy creates real speed when competing against intelligent adaptive algorithms',
  'clean terminal interfaces deliver the purest feedback allowing skilled human hands to surpass machine limits through pure muscle memory',
];

const TEST_DURATION_SECONDS = 30;

export const TypingTest: React.FC<TypingTestProps> = ({
  onComplete,
  onCancel,
  existingCalibration,
}) => {
  const [passageIndex, setPassageIndex] = useState<number>(() =>
    Math.floor(Math.random() * BENCHMARK_PASSAGES.length)
  );
  const targetText = BENCHMARK_PASSAGES[passageIndex];

  const [inputHistory, setInputHistory] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TEST_DURATION_SECONDS);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [finalCalibration, setFinalCalibration] = useState<UserCalibration | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Timer countdown — only starts after first keystroke (startTime set)
  useEffect(() => {
    if (!startTime || isFinished) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, TEST_DURATION_SECONDS - elapsedSec);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        finishTest();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  /**
   * Compute live stats from the current input value.
   * Errors = characters in wrong position at this snapshot
   * (uncorrected errors — backspace already fixed those in inputHistory).
   */
  const computeStats = useCallback(
    (currentInput: string, elapsedSeconds: number) => {
      const totalChars = currentInput.length;
      let correctChars = 0;
      let uncorrectedErrors = 0;

      for (let i = 0; i < totalChars; i++) {
        if (currentInput[i] === targetText[i]) {
          correctChars++;
        } else {
          uncorrectedErrors++;
        }
      }

      const grossWpm = calculateGrossWpm(totalChars, elapsedSeconds);
      const accuracy = calculateAccuracy(correctChars, totalChars);
      const netWpm = calculateNetWpm(correctChars, uncorrectedErrors, elapsedSeconds);

      return {
        grossWpm,
        rawWpm: grossWpm,  // rawWpm = gross (all keystrokes, no error penalty)
        netWpm,
        accuracy,
        totalKeystrokes: totalChars,
        correctKeystrokes: correctChars,
        errors: uncorrectedErrors,
      };
    },
    [targetText]
  );

  const finishTest = useCallback(() => {
    if (isFinished) return;
    setIsFinished(true);

    const elapsedSeconds = startTime
      ? Math.max(1, (Date.now() - startTime) / 1000)
      : TEST_DURATION_SECONDS;

    const stats = computeStats(inputHistory, elapsedSeconds);
    const result: UserCalibration = {
      ...stats,
      timestamp: Date.now(),
    };

    setFinalCalibration(result);
    saveCalibration(result);
    soundEngine.playKeystroke(20, true);
  }, [isFinished, startTime, inputHistory, computeStats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    const value = e.target.value;
    // Clamp length to passage — allow backspace freely, block typing past end
    if (value.length > targetText.length) return;

    // Start timer on first character typed
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    const lastChar = value[value.length - 1];
    const expectedChar = targetText[value.length - 1];
    const isMistype = lastChar !== undefined && lastChar !== expectedChar;

    // Only play sound on new characters (not on backspace / deletion)
    if (value.length > inputHistory.length) {
      if (isMistype) {
        soundEngine.playMistype();
      } else {
        soundEngine.playKeystroke(value.length, false);
      }
    }

    setInputHistory(value);

    // Finished entire passage early
    if (value.length === targetText.length) {
      finishTest();
    }
  };

  const resetTest = () => {
    setInputHistory('');
    setStartTime(null);
    setSecondsRemaining(TEST_DURATION_SECONDS);
    setIsFinished(false);
    setFinalCalibration(null);
    setPassageIndex((prev) => (prev + 1) % BENCHMARK_PASSAGES.length);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const elapsedSeconds = startTime
    ? Math.max(1, (Date.now() - startTime) / 1000)
    : 1;
  const liveStats = computeStats(inputHistory, elapsedSeconds);

  const netWpmRange = finalCalibration
    ? `${Math.max(10, finalCalibration.netWpm - 20)}–${finalCalibration.netWpm + 5} WPM`
    : '';

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      className="w-full max-w-3xl mx-auto p-6 md:p-10 bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-2xl font-mono select-none transition-all flex flex-col justify-center my-auto"
    >
      {!isFinished ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-text)] animate-ping" />
                <h2 className="text-lg md:text-xl font-bold text-white tracking-wider">
                  TYPING BENCHMARK // CALIBRATION
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Type naturally for 30s. Backspace to correct typos — only uncorrected errors penalize your Net WPM.
              </p>
            </div>

            {onCancel && existingCalibration && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded transition-colors"
              >
                [EXIT]
              </button>
            )}
          </div>

          {/* Live Metric Ribbon — 3 cols: Timer | Net WPM | Raw WPM | Accuracy */}
          <div className="grid grid-cols-4 gap-3 mb-6 text-center">
            <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider mb-1">Timer</span>
              <span
                className={`text-2xl font-bold ${
                  secondsRemaining <= 5 ? 'text-red-400 animate-pulse' : 'text-zinc-200'
                }`}
              >
                {secondsRemaining}s
              </span>
            </div>

            <div className="p-3.5 bg-black/60 border border-[var(--theme-border)] rounded-xl">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-bold mb-1">
                Net WPM
              </span>
              <span className="text-2xl font-bold text-[var(--theme-text)] glow-subtle">
                {startTime ? liveStats.netWpm : '--'}
              </span>
            </div>

            <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider mb-1">Raw WPM</span>
              <span className="text-2xl font-bold text-zinc-300">
                {startTime ? liveStats.grossWpm : '--'}
              </span>
            </div>

            <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider mb-1">Accuracy</span>
              <span className="text-2xl font-bold text-cyan-400">
                {startTime ? `${liveStats.accuracy}%` : '100%'}
              </span>
            </div>
          </div>

          {/* Target Passage */}
          <div className="relative p-8 bg-black border border-zinc-800 rounded-xl mb-6 leading-loose text-xl md:text-2xl font-mono tracking-wide cursor-text min-h-[160px]">
            {!startTime && (
              <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-base pointer-events-none">
                ⚡ Start typing to begin the 30-second countdown…
              </span>
            )}
            <span className={!startTime ? 'opacity-40' : ''}>
              {targetText.split('').map((char, idx) => {
                let charStyle = 'text-zinc-600';
                const isTyped = idx < inputHistory.length;
                const isCurrent = idx === inputHistory.length;

                if (isTyped) {
                  if (inputHistory[idx] === char) {
                    charStyle = 'text-[var(--theme-text)] font-semibold';
                  } else {
                    charStyle = 'text-red-400 bg-red-950/50 underline decoration-red-500 font-bold';
                  }
                }

                return (
                  <span key={idx} className={`relative transition-colors ${charStyle}`}>
                    {char}
                    {isCurrent && (
                      <span className="absolute left-0 bottom-0 top-0 w-[2px] bg-[var(--theme-text)] animate-pulse shadow-[0_0_8px_var(--theme-text)]" />
                    )}
                  </span>
                );
              })}
            </span>
          </div>

          {/* Hidden input for focus capture */}
          <input
            ref={inputRef}
            type="text"
            value={inputHistory}
            onChange={handleInputChange}
            disabled={isFinished}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="opacity-0 absolute -top-9999px left-0 w-1 h-1 pointer-events-none"
          />

          {/* Help row */}
          <div className="flex justify-between items-center text-xs text-zinc-500 px-1">
            <span>
              {!startTime
                ? 'Backspace to correct typos — only uncorrected errors count'
                : 'Keep typing! Uncorrected errors reduce your Net WPM.'}
            </span>
            <button
              type="button"
              onClick={resetTest}
              className="text-zinc-400 hover:text-zinc-200 underline text-[11px]"
            >
              Reset Text
            </button>
          </div>
        </>
      ) : (
        /* Benchmark Completion Screen */
        <div className="text-center py-4">
          <div className="inline-block px-3 py-1 bg-green-950/60 border border-green-500/60 text-green-400 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
            ✓ Benchmark Complete
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-white tracking-wider mb-2">
            YOUR CALIBRATED TYPING PROFILE
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-8">
            Net WPM = Raw speed adjusted for uncorrected errors. Your Rival AI will now vary between{' '}
            <strong className="text-white">{netWpmRange}</strong> each match.
          </p>

          {/* Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-4">
            {/* Hero — Net WPM */}
            <div className="p-4 bg-black border-2 border-[var(--theme-text)] rounded-xl shadow-[0_0_25px_var(--theme-dim)]">
              <span className="text-[10px] text-zinc-400 uppercase block font-bold">
                Net WPM
              </span>
              <span className="text-4xl font-black text-[var(--theme-text)] glow-medium block my-1">
                {finalCalibration?.netWpm}
              </span>
              <span className="text-[10px] text-zinc-500">ACCURACY-ADJUSTED</span>
            </div>

            <div className="p-4 bg-black border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase block">Accuracy</span>
              <span className="text-3xl font-bold text-cyan-400 block my-1">
                {finalCalibration?.accuracy}%
              </span>
              <span className="text-[10px] text-zinc-500">
                {finalCalibration?.correctKeystrokes}/{finalCalibration?.totalKeystrokes} CORRECT
              </span>
            </div>

            <div className="p-4 bg-black border border-zinc-800 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase block">Raw Speed</span>
              <span className="text-3xl font-bold text-zinc-300 block my-1">
                {finalCalibration?.rawWpm}
              </span>
              <span className="text-[10px] text-zinc-500">BEFORE PENALTIES</span>
            </div>
          </div>

          {/* Rival range notice */}
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg max-w-md mx-auto mb-8 text-xs text-zinc-300 flex items-center justify-center gap-2">
            <span className="text-amber-400 font-bold">⚡ RIVAL RANGE:</span>
            <span>
              Each match rival draws <strong className="text-white">{netWpmRange}</strong> at random.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => finalCalibration && onComplete(finalCalibration)}
              className="w-full sm:w-auto px-8 py-3 bg-[var(--theme-text)] text-black font-bold text-sm rounded-xl hover:brightness-110 shadow-[0_0_20px_var(--theme-dim)] transition-all tracking-wider"
            >
              [DUEL YOUR RIVAL NOW]
            </button>
            <button
              type="button"
              onClick={resetTest}
              className="w-full sm:w-auto px-5 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-xs rounded-xl transition-colors"
            >
              [RETEST BENCHMARK]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
